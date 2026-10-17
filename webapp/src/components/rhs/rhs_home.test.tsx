// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import renderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';
import {fireEvent, render, screen, within} from '@testing-library/react';

import {PresetTemplates} from 'src/components/templates/template_data';

import RHSHome from './rhs_home';

const mockDispatch = jest.fn();
let mockCanCreate = true;

jest.mock('src/hooks/redux', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: () => 'team-1',
}));
jest.mock('src/hooks', () => ({
    useCanCreatePlaybooksInTeam: () => mockCanCreate,
}));
jest.mock('src/actions', () => ({
    displayPlaybookCreateModal: (props: {startingTemplate?: string}) => ({type: 'CREATE_PLAYBOOK', ...props}),
}));

// The title goes to the side panel's header; here, in place.
jest.mock('src/rhs_title_remote_render', () => ({
    RHSTitleRemoteRender: ({children}: {children: React.ReactNode}) => <div data-testid='title'>{children}</div>,
}));

const home = () => (
    <IntlProvider locale='en'>
        <RHSHome/>
    </IntlProvider>
);

beforeEach(() => {
    mockDispatch.mockClear();
    mockCanCreate = true;
});

describe('the Playbooks panel outside a channel', () => {
    test('greets with a Fusion empty state and one primary action, not an illustration', () => {
        render(home());

        const welcome = screen.getByTestId('playbooks-rhs-welcome');
        expect(welcome.getAttribute('data-empty-state')).toBe('true');
        expect(within(welcome).getByRole('heading', {name: 'Welcome to Playbooks'})).toBeTruthy();
        expect(welcome.querySelectorAll('button')).toHaveLength(1);
        expect(screen.getByTestId('playbooks-rhs-home').querySelector('img')).toBeNull();

        fireEvent.click(screen.getByTestId('playbooks-rhs-create'));
        expect(mockDispatch).toHaveBeenCalledWith({type: 'CREATE_PLAYBOOK', startingTemplate: undefined});
    });

    test('lists every template as a row that starts a playbook from it', () => {
        render(home());

        expect(screen.getByRole('heading', {name: 'Start from a template'})).toBeTruthy();
        const rows = screen.getAllByTestId('template-details');
        expect(rows).toHaveLength(PresetTemplates.length);
        rows.forEach((row) => expect(row.className).toContain('am-app-row'));

        fireEvent.click(within(rows[1]).getByTestId('use-playbook'));
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({type: 'CREATE_PLAYBOOK', startingTemplate: PresetTemplates[1].title});
    });

    test('tells people who can\'t create playbooks so, without a button or templates', () => {
        mockCanCreate = false;
        render(home());

        expect(screen.getByText('You can’t create playbooks in this community.')).toBeTruthy();
        expect(screen.getByTestId('playbooks-rhs-welcome').querySelector('button')).toBeNull();
        expect(screen.queryAllByTestId('template-details')).toHaveLength(0);
    });

    test('keeps its structure', () => {
        expect(renderer.create(home()).toJSON()).toMatchSnapshot();
    });
});
