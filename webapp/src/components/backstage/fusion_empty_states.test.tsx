// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

// The side panel's other empty states: each is a Fusion empty state (a line icon, a title, at most one primary action)
// where the app had Mattermost illustrations.

import React from 'react';
import renderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';
import {MemoryRouter} from 'react-router-dom';
import {fireEvent, render, screen} from '@testing-library/react';

import {ErrorPageTypes} from 'src/constants';
import ErrorPage from 'src/components/error_page';

import GettingStarted from './playbook_list_getting_started';
import EmptyState from './playbook_properties/empty_state';
import {FileUploadOverlay} from './file_upload_overlay';

const intl = (children: React.ReactNode) => <IntlProvider locale='en'>{children}</IntlProvider>;

const expectFusionEmptyState = (el: HTMLElement) => {
    expect(el.getAttribute('data-empty-state')).toBe('true');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelectorAll('.btn-primary').length).toBeLessThanOrEqual(1);
};

describe('the playbooks list with no playbook', () => {
    test('offers the templates to people who can create playbooks', () => {
        const scrollToNext = jest.fn();
        render(intl(
            <GettingStarted
                canCreatePlaybooks={true}
                scrollToNext={scrollToNext}
            />,
        ));
        expectFusionEmptyState(screen.getByTestId('playbooks-getting-started'));
        expect(screen.getByRole('heading', {name: 'No playbooks yet'})).toBeTruthy();
        fireEvent.click(screen.getByTestId('playbooks-getting-started-templates'));
        expect(scrollToNext).toHaveBeenCalledTimes(1);
    });

    test('tells the others they can\'t create any', () => {
        render(intl(
            <GettingStarted
                canCreatePlaybooks={false}
                scrollToNext={jest.fn()}
            />,
        ));
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.getByText('You can’t create playbooks in this community.')).toBeTruthy();
    });

    test('keeps its structure', () => {
        expect(renderer.create(intl(
            <GettingStarted
                canCreatePlaybooks={true}
                scrollToNext={jest.fn()}
            />,
        )).toJSON()).toMatchSnapshot();
    });
});

describe('a playbook\'s attributes before there are any', () => {
    test('is a Fusion empty state with one action to add one', () => {
        const onAdd = jest.fn();
        render(intl(
            <EmptyState
                title='No attributes yet'
                description='Add custom attributes.'
                buttonText='Add your first attribute'
                onButtonClick={onAdd}
            />,
        ));
        const el = screen.getByTestId('attributes-empty-state');
        expectFusionEmptyState(el);
        fireEvent.click(screen.getByText('Add your first attribute'));
        expect(onAdd).toHaveBeenCalledTimes(1);
    });
});

describe('the panel\'s error view', () => {
    test.each([
        [ErrorPageTypes.PLAYBOOK_RUNS, 'Run not found', 'Back to runs'],
        [ErrorPageTypes.PLAYBOOKS, 'Playbook not found', 'Back to playbooks'],
        ['', 'Page not found', 'Back to playbooks'],
    ])('type %s: an empty state in the danger tone, with the way back', (type, title, back) => {
        render(intl(
            <MemoryRouter initialEntries={[`/playbooks/error?type=${type}`]}>
                <ErrorPage/>
            </MemoryRouter>,
        ));
        const el = screen.getByTestId('playbooks-panel-error');
        expectFusionEmptyState(el);
        expect(screen.getByTestId('errorMessageTitle').textContent).toBe(title);
        expect(screen.getByRole('link', {name: back})).toBeTruthy();
    });
});

describe('the file drop overlay', () => {
    test('is a frame with an icon and the message, without the classic picture and logo', () => {
        const {container, rerender} = render(
            <FileUploadOverlay
                show={true}
                message='Drop a playbook export file to import it.'
                overlayType='center'
            />,
        );
        expect(screen.getByTestId('file-upload-overlay').querySelector('img')).toBeNull();
        expect(screen.getByText('Drop a playbook export file to import it.')).toBeTruthy();

        rerender(
            <FileUploadOverlay
                show={false}
                message='Drop a playbook export file to import it.'
                overlayType='center'
            />,
        );
        expect(container.firstChild).toBeNull();
    });
});
