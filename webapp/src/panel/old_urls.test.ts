// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import {GlobalState} from '@mattermost/types/store';

import {RedirectDeps, panelPathOfOldUrl, redirectOldUrl, runIdOfPanelPath} from './old_urls';

type FakeState = {
    currentTeamId: string;
    currentChannelId: string;
    teams: Record<string, {id: string; name: string}>;
};

jest.mock('mattermost-redux/selectors/entities/channels', () => ({
    getCurrentChannelId: (state: FakeState) => state.currentChannelId,
    getRedirectChannelNameForTeam: (_state: FakeState, teamId: string) => `last-viewed-in-${teamId}`,
}));
jest.mock('mattermost-redux/selectors/entities/teams', () => ({
    getCurrentTeamId: (state: FakeState) => state.currentTeamId,
    getTeam: (state: FakeState, id: string) => state.teams[id],
    getTeamByName: (state: FakeState, name: string) => Object.values(state.teams).find((team) => team.name === name),
}));
jest.mock('mattermost-redux/selectors/entities/users', () => ({getCurrentUserId: () => 'me'}));
jest.mock('mattermost-redux/client', () => ({Client4: {getChannelMember: jest.fn()}}));
jest.mock('src/client', () => ({fetchPlaybookRun: jest.fn()}));
jest.mock('src/webapp_globals', () => ({browserHistory: undefined}));

const RUN_ID = 'abcdefghijklmnopqrstuvwxyz';
const CHANNEL_ID = 'channelchannelchannelchann';

// Lets the redirect's awaits (the run, the channel membership) settle.
const flush = async () => {
    for (let i = 0; i < 10; i++) {
        await Promise.resolve(); // eslint-disable-line no-await-in-loop
    }
};

describe('panelPathOfOldUrl', () => {
    test.each([
        [`/playbooks/runs/${RUN_ID}`, '', '', `/playbooks/runs/${RUN_ID}`],
        [`/playbooks/runs/${RUN_ID}/`, '?from=digest_runsinprogress', '#playbook-run-retrospective', `/playbooks/runs/${RUN_ID}?from=digest_runsinprogress#playbook-run-retrospective`],
        [`/playbooks/incidents/${RUN_ID}`, '', '', `/playbooks/runs/${RUN_ID}`],
        ['/playbooks/incidents', '', '', '/playbooks/runs'],
        ['/playbooks', '', '', '/playbooks/runs'],
        ['/playbooks/', '', '', '/playbooks/runs'],
        [`/playbooks/playbooks/${RUN_ID}/outline`, '', '', `/playbooks/playbooks/${RUN_ID}/outline`],
        ['/playbooks/error', '?type=playbooks', '', '/playbooks/error?type=playbooks'],
        ['', '', '', '/playbooks/runs'],
    ])('%s%s%s opens %s', (pathname, search, hash, expected) => {
        expect(panelPathOfOldUrl(pathname, search, hash)).toBe(expected);
    });

    test('finds the run of a run view', () => {
        expect(runIdOfPanelPath(`/playbooks/runs/${RUN_ID}?from=x`)).toBe(RUN_ID);
        expect(runIdOfPanelPath(`/playbooks/runs/${RUN_ID}#retro`)).toBe(RUN_ID);
        expect(runIdOfPanelPath('/playbooks/runs')).toBeUndefined();
        expect(runIdOfPanelPath(`/playbooks/playbooks/${RUN_ID}`)).toBeUndefined();
    });
});

describe('redirectOldUrl', () => {
    const makeDeps = (overrides: Partial<RedirectDeps> = {}) => {
        const state: FakeState = {
            currentTeamId: '',
            currentChannelId: '',
            teams: {
                t1: {id: 't1', name: 'lumen'},
                t2: {id: 't2', name: 'ops'},
            },
        };
        const listeners = new Set<() => void>();
        const deps: RedirectDeps = {
            getState: () => state as unknown as GlobalState,
            subscribe: (listener) => {
                listeners.add(listener);
                return () => listeners.delete(listener);
            },
            fetchRun: jest.fn(async () => ({channel_id: CHANNEL_ID, team_id: 't2'})),
            isChannelMember: jest.fn(async () => true),
            replace: jest.fn(),
            open: jest.fn(),
            timeoutMs: 1000,
            ...overrides,
        };

        // The app's channel view showing a channel of a community.
        const show = (teamId: string, channelId: string) => {
            state.currentTeamId = teamId;
            state.currentChannelId = channelId;
            listeners.forEach((listener) => listener());
        };

        return {deps, show, listeners};
    };

    test('opens a run in its channel, in its community, with the panel on the run', async () => {
        const {deps, show} = makeDeps();
        const path = `/playbooks/runs/${RUN_ID}#playbook-run-retrospective`;

        const done = redirectOldUrl('lumen', path, deps);
        await flush();

        expect(deps.replace).toHaveBeenCalledWith(`/ops/channels/${CHANNEL_ID}`);
        expect(deps.open).not.toHaveBeenCalled();

        // Another channel shows first (the community's previous one): the panel waits for the run's.
        show('t2', 'otherchannelotherchannelot');
        expect(deps.open).not.toHaveBeenCalled();
        show('t2', CHANNEL_ID);

        await expect(done).resolves.toBe(`/ops/channels/${CHANNEL_ID}`);
        expect(deps.open).toHaveBeenCalledWith(path);
    });

    test('does not open a channel you are not in (it would join you): the community\'s last channel, with the run', async () => {
        const {deps, show} = makeDeps({isChannelMember: jest.fn(async () => false)});
        const path = `/playbooks/runs/${RUN_ID}`;

        const done = redirectOldUrl('lumen', path, deps);
        await flush();

        expect(deps.replace).toHaveBeenCalledWith('/ops/channels/last-viewed-in-t2');
        show('t2', 'lastlastlastlastlastlastla');

        await done;
        expect(deps.open).toHaveBeenCalledWith(path);
    });

    test('a run that is private or gone opens on the community\'s last channel, where the panel says so', async () => {
        const {deps, show} = makeDeps({fetchRun: jest.fn(async () => {
            throw new Error('403');
        })});
        const path = `/playbooks/runs/${RUN_ID}`;

        const done = redirectOldUrl('lumen', path, deps);
        await flush();

        expect(deps.isChannelMember).not.toHaveBeenCalled();
        expect(deps.replace).toHaveBeenCalledWith('/lumen/channels/last-viewed-in-t1');
        show('t1', 'lastlastlastlastlastlastla');

        await done;
        expect(deps.open).toHaveBeenCalledWith(path);
    });

    test('a page without a channel (playbooks, runs, a playbook) opens on the community\'s last channel', async () => {
        const {deps, show} = makeDeps();
        const path = `/playbooks/playbooks/${RUN_ID}/outline`;

        const done = redirectOldUrl('lumen', path, deps);
        await flush();

        expect(deps.fetchRun).not.toHaveBeenCalled();
        expect(deps.replace).toHaveBeenCalledWith('/lumen/channels/last-viewed-in-t1');

        // Still the community page: no channel yet.
        expect(deps.open).not.toHaveBeenCalled();
        show('t1', 'lastlastlastlastlastlastla');

        await done;
        expect(deps.open).toHaveBeenCalledWith(path);
    });

    test('opens the panel right away when the channel already shows', async () => {
        const {deps, show} = makeDeps();
        show('t1', 'lastlastlastlastlastlastla');

        await redirectOldUrl('lumen', '/playbooks/runs', deps);
        expect(deps.open).toHaveBeenCalledWith('/playbooks/runs');
    });

    test('opens the panel anyway when the channel takes too long, and stops listening', async () => {
        jest.useFakeTimers();
        try {
            const {deps, listeners} = makeDeps();

            const done = redirectOldUrl('lumen', '/playbooks/tasks', deps);
            await flush();
            expect(listeners.size).toBe(1);

            jest.advanceTimersByTime(1000);
            await done;

            expect(deps.open).toHaveBeenCalledWith('/playbooks/tasks');
            expect(listeners.size).toBe(0);
        } finally {
            jest.useRealTimers();
        }
    });
});
