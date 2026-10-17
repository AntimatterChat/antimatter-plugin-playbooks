// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

// Antimatter: the links to the old full page keep working. Messages, emails and notifications link to
// /playbooks/runs/<id> or /playbooks/playbooks/<id>; the web app sends /playbooks/... to /<community>/playbooks/...,
// which this plugin answers: it opens the run's channel (or the community's last channel when there is none, or you
// aren't in it) with the side panel on the page the link pointed to.

import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useStore} from 'react-redux';
import {GlobalState} from '@mattermost/types/store';
import {Client4} from 'mattermost-redux/client';
import {getCurrentChannelId, getRedirectChannelNameForTeam} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeamId, getTeam, getTeamByName} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {fetchPlaybookRun} from 'src/client';
import {browserHistory} from 'src/webapp_globals';

import {PANEL_BASE, isPanelPath, openPlaybooksPanel} from './history';

const RUN_PATH = new RegExp(`^${PANEL_BASE}/runs/([a-z0-9]{26})(?:[/?#]|$)`);

// The longest wait for the channel to show before the panel opens anyway.
const OPEN_TIMEOUT_MS = 10000;

/**
 * panelPathOfOldUrl is the panel view for an old full-page URL, given without the community in front
 * (/playbooks/incidents/<id> was renamed /playbooks/runs/<id>; /playbooks opened on the runs).
 */
export function panelPathOfOldUrl(pathname: string, search = '', hash = ''): string {
    let path = pathname.replace(/\/+$/, '') || '/';
    if (!isPanelPath(path)) {
        path = PANEL_BASE;
    }
    if (path === PANEL_BASE) {
        path = `${PANEL_BASE}/runs`;
    }
    path = path.replace(new RegExp(`^${PANEL_BASE}/incidents(?=/|$)`), `${PANEL_BASE}/runs`);
    return path + search + hash;
}

export const runIdOfPanelPath = (path: string) => RUN_PATH.exec(path)?.[1];

type Run = {channel_id: string; team_id: string};

export type RedirectDeps = {
    getState: () => GlobalState;
    subscribe: (listener: () => void) => () => void;
    fetchRun: (id: string) => Promise<Run>;
    isChannelMember: (channelId: string) => Promise<boolean>;
    replace: (path: string) => void;
    open: (panelPath: string) => void;
    timeoutMs?: number;
};

/**
 * redirectOldUrl goes from an old URL's page (the community's /<team>/playbooks/... route) to a channel, and opens
 * the panel on panelPath once the channel shows. It returns the channel's path.
 */
export async function redirectOldUrl(teamName: string, panelPath: string, deps: RedirectDeps): Promise<string> {
    const state = deps.getState();
    let team = getTeamByName(state, teamName);
    let channelId = '';

    const runId = runIdOfPanelPath(panelPath);
    if (runId) {
        try {
            const run = await deps.fetchRun(runId);
            const runTeam = run.team_id ? getTeam(state, run.team_id) : undefined;
            if (runTeam) {
                team = runTeam;
            }

            // A channel you aren't in isn't opened (it would join you to a public one): the panel shows the run.
            if (run.channel_id && await deps.isChannelMember(run.channel_id)) {
                channelId = run.channel_id;
            }
        } catch {
            // The run is private or gone: the panel's run view says so.
        }
    }

    const name = team?.name ?? teamName;
    const channelPath = channelId ? `/${name}/channels/${channelId}` : `/${name}/channels/${team ? getRedirectChannelNameForTeam(state, team.id) : 'town-square'}`;
    deps.replace(channelPath);

    // Open the panel once the channel is the current one: before that, the community's page has no side panel.
    const ready = () => {
        const now = deps.getState();
        const currentChannelId = getCurrentChannelId(now);
        if (!currentChannelId || (channelId && currentChannelId !== channelId)) {
            return false;
        }
        return !team || getCurrentTeamId(now) === team.id;
    };

    await new Promise<void>((resolve) => {
        if (ready()) {
            resolve();
            return;
        }
        let unsubscribe = () => {};
        const timer = setTimeout(() => {
            unsubscribe();
            resolve();
        }, deps.timeoutMs ?? OPEN_TIMEOUT_MS);
        unsubscribe = deps.subscribe(() => {
            if (ready()) {
                clearTimeout(timer);
                unsubscribe();
                resolve();
            }
        });
    });

    deps.open(panelPath);
    return channelPath;
}

const isChannelMember = async (channelId: string, userId: string) => {
    try {
        await Client4.getChannelMember(channelId, userId);
        return true;
    } catch {
        return false;
    }
};

/**
 * OldUrlRedirect answers /<team>/playbooks/... (registered as the plugin's team route): the old full-page links, sent
 * there by the web app, and the even older /<team>/playbooks/... ones.
 */
const OldUrlRedirect = () => {
    const location = useLocation();
    const store = useStore<GlobalState>();

    useEffect(() => {
        const match = /^\/([^/]+)(\/.*)?$/.exec(location.pathname);
        if (!match) {
            return;
        }
        const [, teamName, rest = ''] = match;
        const panelPath = panelPathOfOldUrl(rest, location.search, location.hash);
        const userId = getCurrentUserId(store.getState());

        redirectOldUrl(teamName, panelPath, {
            getState: store.getState,
            subscribe: store.subscribe,
            fetchRun: fetchPlaybookRun,
            isChannelMember: (channelId) => isChannelMember(channelId, userId),
            replace: (path) => browserHistory.replace(path),
            open: openPlaybooksPanel,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key, location.pathname]);

    return null;
};

export default OldUrlRedirect;
