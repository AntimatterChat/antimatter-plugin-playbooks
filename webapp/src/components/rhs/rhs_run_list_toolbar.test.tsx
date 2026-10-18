// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {IntlProvider} from 'react-intl';
import {fireEvent, render, screen} from '@testing-library/react';

import {navigateToPluginUrl} from 'src/browser_routing';
import {PanelToolbarRow} from 'src/panel/panel_toolbar';

import RHSRunList, {FilterType} from './rhs_run_list';

// The list's own dependencies.
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

// The channel's runs in the panel: its toolbar row over the list, as the panel draws them.
const list = () => (
    <IntlProvider locale='en'>
        <PanelToolbarRow>
            <div data-testid='panel-body'>
                <RHSRunList
                    runs={[]}
                    onSelectRun={jest.fn()}
                    onRunCreated={jest.fn()}
                    getMore={jest.fn()}
                    hasMore={false}
                    options={{sort: 'create_at', direction: 'DESC', filter: FilterType.InProgress}}
                    setOptions={jest.fn()}
                    numInProgress={0}
                    numFinished={0}
                />
            </div>
        </PanelToolbarRow>
    </IntlProvider>
);

describe("the channel's runs: their toolbar", () => {
    test('puts the button that browses runs, playbooks and tasks (the four squares) in the panel\'s toolbar row', () => {
        render(list());

        const toolbar = screen.getByTestId('playbooks-panel-toolbar');
        const browse = screen.getByTestId('playbooks-browse-button');
        expect(toolbar.contains(browse)).toBe(true);
        expect(toolbar.contains(screen.getByTestId('playbooks-channel-toolbar'))).toBe(true);

        // It still opens the list of everything (the full page's sidebar).
        fireEvent.click(browse);
        expect(navigateToPluginUrl).toHaveBeenCalledWith('/browse');
    });

    test('doesn\'t name the app again: the panel\'s header does', () => {
        render(list());

        const toolbar = screen.getByTestId('playbooks-panel-toolbar');
        expect(toolbar.textContent).not.toContain('Playbooks');
        expect(toolbar.querySelector('.PlaybooksProductIcon, svg, img')).toBeNull();
    });

    test('is above the panel\'s body, not in it', () => {
        render(list());

        expect(screen.getByTestId('panel-body').contains(screen.getByTestId('playbooks-browse-button'))).toBe(false);
    });
});
