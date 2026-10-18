// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {
    act,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';

import {forgetChannelViews} from 'src/panel/channel_view';

import ChannelRuns from './rhs_main';

// The channel's runs, by status, as the server gives them (the runs query of the panel).
type Run = {id: string; lastUpdatedAt?: number};
const mockRuns: {InProgress: Run[]; Finished: Run[]} = {InProgress: [], Finished: []};
const mockRefetch = jest.fn();
jest.mock('@apollo/client', () => ({
    useQuery: (_query: unknown, {variables}: {variables: {status: 'InProgress' | 'Finished'}}) => ({
        data: {
            runs: {
                totalCount: mockRuns[variables.status].length,
                edges: mockRuns[variables.status].map((node) => ({node})),
                pageInfo: {endCursor: '', hasNextPage: false},
            },
        },
        refetch: mockRefetch,
        fetchMore: jest.fn(),
    }),
}));
jest.mock('src/graphql/generated/gql', () => ({graphql: (query: string) => query}));

const mockState = {
    entities: {
        teams: {currentTeamId: 'team-1', teams: {'team-1': {id: 'team-1', name: 'lumen'}}},
        channels: {currentChannelId: 'channel-a'},
    },
};
jest.mock('src/hooks/redux', () => ({
    useAppSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock('src/hooks', () => ({usePlaybooksCrud: () => ({isLoading: false})}));
jest.mock('src/browser_routing', () => ({navigateToChannel: jest.fn()}));
jest.mock('src/components/assets/loading_spinner', () => ({__esModule: true, default: () => <div data-testid='loading'/>}));

// The views are tested on their own: here, a checklist with its back button, and the list with a row per run.
jest.mock('src/components/rhs/rhs_run_details', () => ({
    __esModule: true,
    default: ({runID, onBackClick}: {runID: string; onBackClick: () => void}) => (
        <div data-testid='checklist'>
            {runID}
            <button
                data-testid='back'
                onClick={onBackClick}
            />
        </div>
    ),
}));
jest.mock('./rhs_run_list', () => ({
    __esModule: true,
    FilterType: {InProgress: 0, Finished: 1},
    default: ({runs, onSelectRun}: {runs: Run[]; onSelectRun: (id: string) => void}) => (
        <div data-testid='list'>
            {runs.map((run) => (
                <button
                    key={run.id}
                    data-testid={`open-${run.id}`}
                    onClick={() => onSelectRun(run.id)}
                />
            ))}
        </div>
    ),
}));
jest.mock('./rhs_home', () => ({__esModule: true, default: () => <div data-testid='home'/>}));

// The panel's first view, as the panel shows it again and again: a new element each time.
const view = () => <ChannelRuns/>;
const shown = () => (screen.queryByTestId('checklist') ? `checklist ${screen.getByTestId('checklist').textContent}` : (screen.queryByTestId('list') && 'list'));

// The runs change on the server (a task checked, a run started or finished): the panel gets new objects.
const runsUpdate = (rerender: (ui: React.ReactElement) => void, inProgress: string[]) => {
    mockRuns.InProgress = inProgress.map((id) => ({id, lastUpdatedAt: Date.now()}));
    act(() => rerender(view()));
};

const inChannel = (channelId: string) => {
    mockState.entities.channels.currentChannelId = channelId;
};

beforeEach(() => {
    forgetChannelViews();
    inChannel('channel-a');
    mockRuns.InProgress = [{id: 'run-1'}];
    mockRuns.Finished = [];
});

describe("the channel's runs in the Playbooks panel", () => {
    test("opens the channel's only run in progress the first time", () => {
        render(view());
        expect(shown()).toBe('checklist run-1');
    });

    test('back from a checklist goes to the list, and stays there after re-renders and runs updates', () => {
        const {rerender} = render(view());
        fireEvent.click(screen.getByTestId('back'));
        expect(shown()).toBe('list');

        act(() => rerender(view()));
        expect(shown()).toBe('list');

        runsUpdate(rerender, ['run-1']);
        expect(shown()).toBe('list');
        expect(mockRefetch).toHaveBeenCalled();
    });

    test('the list stays the list after another view of the panel (the list of playbooks) and back', () => {
        const {unmount} = render(view());
        fireEvent.click(screen.getByTestId('back'));
        unmount();

        render(view());
        expect(shown()).toBe('list');
    });

    test('closing the panel and opening it again shows the list, when it was last', () => {
        const {unmount} = render(view());
        fireEvent.click(screen.getByTestId('back'));
        unmount();

        render(view());
        expect(shown()).toBe('list');
    });

    test('closing the panel and opening it again shows the checklist it opened by itself, when it was last', () => {
        const {unmount} = render(view());
        unmount();

        render(view());
        expect(shown()).toBe('checklist run-1');
    });

    test('closing the panel and opening it again shows the checklist the person opened, when it was last', () => {
        mockRuns.InProgress = [{id: 'run-1'}, {id: 'run-2'}];
        const {unmount} = render(view());
        fireEvent.click(screen.getByTestId('open-run-2'));
        expect(shown()).toBe('checklist run-2');
        unmount();

        render(view());
        expect(shown()).toBe('checklist run-2');
    });

    test('a channel first shown with several runs in progress opens none, even once one is left', () => {
        mockRuns.InProgress = [{id: 'run-1'}, {id: 'run-2'}];
        const {rerender} = render(view());
        expect(shown()).toBe('list');

        runsUpdate(rerender, ['run-2']);
        expect(shown()).toBe('list');
    });

    test('a channel first shown without a run in progress opens none when one starts', () => {
        mockRuns.InProgress = [];
        const {rerender} = render(view());
        expect(shown()).toBe('list');

        runsUpdate(rerender, ['run-3']);
        expect(shown()).toBe('list');
    });

    test('each channel keeps its own view, and opens its only run by itself the first time only', () => {
        const {rerender} = render(view());
        fireEvent.click(screen.getByTestId('back'));
        expect(shown()).toBe('list');

        // Another channel, shown for the first time, with its only run in progress.
        inChannel('channel-b');
        mockRuns.InProgress = [{id: 'run-b'}];
        act(() => rerender(view()));
        expect(shown()).toBe('checklist run-b');

        // Back in the first channel: its list, as the person left it.
        inChannel('channel-a');
        mockRuns.InProgress = [{id: 'run-1'}];
        act(() => rerender(view()));
        expect(shown()).toBe('list');
    });

    test('outside a channel, the home', () => {
        inChannel('');
        render(view());
        expect(screen.getByTestId('home')).toBeTruthy();
    });
});
