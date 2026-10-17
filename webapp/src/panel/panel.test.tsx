// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {IntlProvider} from 'react-intl';
import {
    act,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {Router} from 'react-router-dom';

import {setRHSOpen} from 'src/actions';

import {PANEL_HOME, PanelHistory, makePanelHistory} from './history';
import {useLeaveOnTeamChange} from './team_change';
import PlaybooksPanel from './panel';

// The views are tested on their own: here, each one only says which it is (and what it was given).
jest.mock('src/components/rhs/rhs_main', () => ({__esModule: true, default: () => <div data-testid='view-channel-runs'/>}));
jest.mock('src/components/backstage/playbook_runs/playbook_run/playbook_run', () => {
    const {useRouteMatch, useLocation} = jest.requireActual('react-router-dom');
    return {
        __esModule: true,
        default: function RunView() {
            const {params} = useRouteMatch();
            const {hash} = useLocation();
            return <div data-testid='view-run'>{params.playbookRunId + hash}</div>;
        },
    };
});
jest.mock('src/components/backstage/playbook_editor/playbook_editor', () => {
    const {useRouteMatch} = jest.requireActual('react-router-dom');
    return {
        __esModule: true,
        default: function EditorView() {
            const {params} = useRouteMatch();
            return <div data-testid='view-editor'>{`${params.playbookId}:${params.tab ?? 'usage'}`}</div>;
        },
    };
});
jest.mock('src/components/backstage/playbook_list', () => ({
    __esModule: true,
    default: ({firstTimeUserExperience}: {firstTimeUserExperience?: boolean}) => <div data-testid={firstTimeUserExperience ? 'view-start' : 'view-playbooks'}/>,
}));
jest.mock('src/components/backstage/runs_page', () => ({__esModule: true, default: () => <div data-testid='view-runs'/>}));
jest.mock('src/components/backstage/rhs/task_inbox/task_inbox', () => ({__esModule: true, default: () => <div data-testid='view-tasks'/>}));
jest.mock('src/components/error_page', () => {
    const {useLocation} = jest.requireActual('react-router-dom');
    return {
        __esModule: true,
        default: function ErrorView() {
            return <div data-testid='view-error'>{useLocation().search}</div>;
        },
    };
});
jest.mock('src/panel/browse', () => ({__esModule: true, default: () => <div data-testid='view-browse'/>}));
jest.mock('src/components/backstage/toast_banner', () => ({ToastProvider: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('@mattermost/shared/components/tooltip', () => ({WithTooltip: ({children}: {children: React.ReactNode}) => <>{children}</>}));
jest.mock('src/webapp_globals', () => ({browserHistory: undefined}));

const mockDispatch = jest.fn();
const mockState = {teamId: 'team-1'};
jest.mock('src/hooks/redux', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock('mattermost-redux/selectors/entities/teams', () => ({
    ...jest.requireActual('mattermost-redux/selectors/entities/teams'),
    getCurrentTeamId: (state: {teamId: string}) => state.teamId,
}));

const RUN_ID = 'abcdefghijklmnopqrstuvwxyz';
const PLAYBOOK_ID = 'zyxwvutsrqponmlkjihgfedcba';

let history: PanelHistory;

// A new element each time, so that a rerender renders again (the store is mocked).
const panelElement = () => (
    <IntlProvider locale='en'>
        <PlaybooksPanel history={history}/>
    </IntlProvider>
);

const renderPanel = () => {
    const result = render(panelElement());
    return {...result, rerender: () => result.rerender(panelElement())};
};

const go = (path: string) => act(() => {
    history.push(path);
});

beforeEach(() => {
    mockDispatch.mockClear();
    mockState.teamId = 'team-1';
    history = makePanelHistory(() => undefined);

    // The plugin's title slot in the side panel's header (RHSTitlePlaceholder).
    document.body.innerHTML = '<div id="playbooks-rhs-title-placeholder"></div>';
});

describe('the Playbooks panel', () => {
    test('opens on the channel\'s runs and checklists', () => {
        renderPanel();
        expect(screen.getByTestId('view-channel-runs')).toBeTruthy();
    });

    test.each([
        ['/playbooks/browse', 'view-browse', ''],
        ['/playbooks/runs', 'view-runs', ''],
        [`/playbooks/runs/${RUN_ID}`, 'view-run', RUN_ID],
        [`/playbooks/runs/${RUN_ID}?from=digest#playbook-run-retrospective`, 'view-run', `${RUN_ID}#playbook-run-retrospective`],
        ['/playbooks/playbooks', 'view-playbooks', ''],
        [`/playbooks/playbooks/${PLAYBOOK_ID}`, 'view-editor', `${PLAYBOOK_ID}:usage`],
        [`/playbooks/playbooks/${PLAYBOOK_ID}/outline`, 'view-editor', `${PLAYBOOK_ID}:outline`],
        [`/playbooks/playbooks/${PLAYBOOK_ID}/reports`, 'view-editor', `${PLAYBOOK_ID}:reports`],
        ['/playbooks/start', 'view-start', ''],
        ['/playbooks/tasks', 'view-tasks', ''],
        ['/playbooks/error?type=playbooks', 'view-error', '?type=playbooks'],
    ])('shows %s as a view of the panel', (path, view, text) => {
        renderPanel();
        go(path);

        expect(screen.getByTestId(view).textContent).toBe(text);
    });

    test.each([
        [`/playbooks/incidents/${RUN_ID}`, `/playbooks/runs/${RUN_ID}`],
        ['/playbooks/incidents', '/playbooks/runs'],
        ['/playbooks', '/playbooks/runs'],
    ])('takes the old path %s to %s', (from, to) => {
        renderPanel();
        go(from);

        expect(history.location.pathname).toBe(to);
    });

    test('says when a page does not exist', () => {
        renderPanel();
        go('/playbooks/nothing-here');

        expect(screen.getByTestId('view-error').textContent).toBe('?type=default');
    });

    test('goes back through its views with the back button of its title', () => {
        renderPanel();
        go('/playbooks/runs');
        go('/playbooks/tasks');
        expect(screen.getByTestId('playbooks-panel-title-text').textContent).toBe('Your tasks');

        fireEvent.click(screen.getByTestId('playbooks-panel-back'));
        expect(screen.getByTestId('view-runs')).toBeTruthy();
        expect(screen.getByTestId('playbooks-panel-title-text').textContent).toBe('Runs');

        fireEvent.click(screen.getByTestId('playbooks-panel-back'));
        expect(screen.getByTestId('view-channel-runs')).toBeTruthy();
    });

    test('a view opened on its own goes back to the channel\'s runs', () => {
        renderPanel();
        act(() => history.reset('/playbooks/tasks'));

        fireEvent.click(screen.getByTestId('playbooks-panel-back'));
        expect(screen.getByTestId('view-channel-runs')).toBeTruthy();
    });

    test('lets the plugin know when it shows', () => {
        const {unmount} = renderPanel();
        expect(mockDispatch).toHaveBeenCalledWith(setRHSOpen(true));

        unmount();
        expect(mockDispatch).toHaveBeenLastCalledWith(setRHSOpen(false));
    });

    test('stays on its view when the community changes (the lists follow the current one)', () => {
        const {rerender} = renderPanel();
        go('/playbooks/runs');

        mockState.teamId = 'team-2';
        rerender();

        expect(screen.getByTestId('view-runs')).toBeTruthy();
    });

    test('marks its root so that the link handler leaves its links to it', () => {
        const {container} = renderPanel();
        expect(container.querySelector('[data-playbooks-panel]')).toBeTruthy();
        expect(container.querySelector('#playbooks-backstageRoot')).toBeTruthy();
    });
});

describe('useLeaveOnTeamChange', () => {
    const RunOfTeam = ({teamId}: {teamId?: string}) => {
        useLeaveOnTeamChange(teamId);
        return null;
    };

    const renderView = (teamId?: string) => {
        const element = () => (
            <Router history={history}>
                <RunOfTeam teamId={teamId}/>
            </Router>
        );
        const result = render(element());
        return () => result.rerender(element());
    };

    test('takes a run or playbook view of the community you left back to the channel\'s runs', () => {
        history.push('/playbooks/runs');
        history.push(`/playbooks/runs/${RUN_ID}`);
        const rerender = renderView('team-1');

        mockState.teamId = 'team-2';
        act(() => rerender());

        expect(history.location.pathname).toBe(PANEL_HOME);
        expect(history.canGoBack()).toBe(false);
    });

    test('keeps a view of the community you switched to (a link opened its run there)', () => {
        history.push(`/playbooks/runs/${RUN_ID}`);
        mockState.teamId = 'team-1';
        const rerender = renderView('team-2');

        mockState.teamId = 'team-2';
        act(() => rerender());

        expect(history.location.pathname).toBe(`/playbooks/runs/${RUN_ID}`);
    });

    test('keeps a run without a community (a direct message checklist)', () => {
        history.push(`/playbooks/runs/${RUN_ID}`);
        const rerender = renderView('');

        mockState.teamId = 'team-2';
        act(() => rerender());

        expect(history.location.pathname).toBe(`/playbooks/runs/${RUN_ID}`);
    });
});
