// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import renderer from 'react-test-renderer';
import {fireEvent, render, screen} from '@testing-library/react';

import EmptyState from './empty_state';

const setWebUI = (ui?: 'classic' | 'fusion') => {
    window.antimatterWebUI = ui;
    if (ui) {
        document.documentElement.dataset.amWebUi = ui;
    } else {
        delete document.documentElement.dataset.amWebUi;
    }
};

afterEach(() => setWebUI(undefined));

describe('EmptyState', () => {
    test('is a small line icon, a title, a sentence and one primary action', () => {
        const onClick = jest.fn();
        render(
            <EmptyState
                data-testid='empty'
                icon='checkbox'
                title='No checklists yet'
                text='Start one to track tasks here.'
                action={{label: 'New checklist', onClick, testId: 'primary'}}
            />,
        );

        const root = screen.getByTestId('empty');
        expect(root.getAttribute('data-empty-state')).toBe('true');
        expect(screen.getByTestId('empty-state-icon').querySelector('[data-fusion-icon="checkbox"]')).not.toBeNull();
        expect(screen.getByRole('heading', {name: 'No checklists yet'})).toBeTruthy();
        expect(screen.getByText('Start one to track tasks here.')).toBeTruthy();

        // One button, the primary one.
        const buttons = root.querySelectorAll('button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0].className).toContain('btn-primary');
        fireEvent.click(screen.getByTestId('primary'));
        expect(onClick).toHaveBeenCalledTimes(1);

        // No illustration: no image, and no drawing but the icon.
        expect(root.querySelector('img')).toBeNull();
        expect(root.querySelectorAll('svg, i')).toHaveLength(1);
    });

    test('offers another way out as a plain button, and a note', () => {
        const onSecondary = jest.fn();
        render(
            <EmptyState
                data-testid='empty'
                icon='checkbox'
                title='Nothing in progress'
                secondary={{label: 'View finished', onClick: onSecondary, testId: 'secondary'}}
                note='You can’t create playbooks in this community.'
            />,
        );

        const secondary = screen.getByTestId('secondary');
        expect(secondary.className).not.toContain('btn-primary');
        fireEvent.click(secondary);
        expect(onSecondary).toHaveBeenCalledTimes(1);
        expect(screen.getByText('You can’t create playbooks in this community.')).toBeTruthy();
    });

    test('draws Fusion\'s icon under the Fusion UI', () => {
        setWebUI('fusion');
        render(
            <EmptyState
                data-testid='empty'
                icon='runbook'
                title='Welcome to Playbooks'
            />,
        );
        expect(screen.getByTestId('empty-state-icon').querySelector('use')!.getAttribute('href')).toBe('#am-i-runbook');
    });

    test('keeps its structure (classic UI)', () => {
        const tree = renderer.create(
            <EmptyState
                icon='playbook'
                title='No playbooks yet'
                text='Playbooks make important procedures repeatable.'
                action={{label: 'Choose a template', onClick: jest.fn(), icon: 'plus'}}
                secondary={{label: 'Import', onClick: jest.fn()}}
                note='A note.'
            />,
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('keeps its structure (Fusion UI, error tone)', () => {
        setWebUI('fusion');
        const tree = renderer.create(
            <EmptyState
                icon='ban'
                tone='danger'
                fill={true}
                title='Run not found'
                text='The run you’re requesting is private or does not exist.'
            />,
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
