// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import renderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';
import {fireEvent, render, screen} from '@testing-library/react';

import {FilterType, NoRuns, RunListOptions} from './rhs_run_list';

// The list's own dependencies, which the empty state doesn't use.
jest.mock('src/hooks/redux', () => ({useAppDispatch: () => jest.fn(), useAppSelector: () => undefined}));
jest.mock('src/graphql/hooks', () => ({useUpdateRun: () => jest.fn()}));
jest.mock('src/client', () => ({createPlaybookRun: jest.fn()}));
jest.mock('src/actions', () => ({openPlaybookRunModal: jest.fn(), openUpdateRunChannelModal: jest.fn()}));
jest.mock('src/components/profile/profile', () => ({__esModule: true, default: () => null}));
jest.mock('src/components/backstage/toast_banner', () => ({useToaster: () => ({add: jest.fn()})}));
jest.mock('src/hooks', () => ({useTextOverflow: () => false}));
jest.mock('src/hooks/run_permissions', () => ({useCanModifyRun: () => true}));
jest.mock('src/browser_routing', () => ({navigateToPluginUrl: jest.fn()}));
jest.mock('./rhs_participants', () => ({UserList: () => null}));

type Counts = {active: boolean, numInProgress: number, numFinished: number};

const noRuns = (counts: Counts, setOptions = jest.fn(), onCreate = jest.fn()) => (
    <IntlProvider locale='en'>
        <NoRuns
            {...counts}
            setOptions={setOptions}
            onCreateChecklistClicked={onCreate}
        />
    </IntlProvider>
);

// What a setOptions call did to the options.
const applied = (setOptions: jest.Mock): RunListOptions => setOptions.mock.calls[0][0]({sort: 'create_at', direction: 'DESC', filter: FilterType.InProgress});

describe('the channel\'s runs when the filter leaves none', () => {
    test('a channel without any run: an empty state whose one action starts a checklist', () => {
        const onCreate = jest.fn();
        render(noRuns({active: true, numInProgress: 0, numFinished: 0}, jest.fn(), onCreate));

        const empty = screen.getByTestId('no-active-runs');
        expect(empty.getAttribute('data-empty-state')).toBe('true');
        expect(screen.getByRole('heading', {name: 'No checklists in this channel yet'})).toBeTruthy();
        expect(empty.querySelectorAll('button')).toHaveLength(1);
        expect(empty.querySelector('img')).toBeNull();

        // The id the end-to-end tests click.
        fireEvent.click(screen.getByTestId('create-blank-checklist'));
        expect(onCreate).toHaveBeenCalledTimes(1);
    });

    test('only finished runs: says so, and shows them on request', () => {
        const setOptions = jest.fn();
        render(noRuns({active: true, numInProgress: 0, numFinished: 2}, setOptions));

        expect(screen.getByRole('heading', {name: 'Nothing in progress'})).toBeTruthy();
        fireEvent.click(screen.getByTestId('view-finished-runs'));
        expect(applied(setOptions).filter).toBe(FilterType.Finished);
    });

    test('no finished run: says so, and goes back to those in progress', () => {
        const setOptions = jest.fn();
        render(noRuns({active: false, numInProgress: 3, numFinished: 0}, setOptions));

        expect(screen.getByRole('heading', {name: 'Nothing finished yet'})).toBeTruthy();
        fireEvent.click(screen.getByTestId('view-in-progress-runs'));
        expect(applied(setOptions).filter).toBe(FilterType.InProgress);
    });

    test('keeps its structure', () => {
        expect(renderer.create(noRuns({active: true, numInProgress: 0, numFinished: 1})).toJSON()).toMatchSnapshot();
    });
});
