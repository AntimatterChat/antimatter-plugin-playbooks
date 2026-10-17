// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {IntlProvider} from 'react-intl';
import {fireEvent, render, screen} from '@testing-library/react';

import {FUSION_ICON_NAMES} from 'src/components/fusion/icon';

import TemplateRow from './template_row';
import PresetTemplates from './template_data';

const bugBash = PresetTemplates.find((t) => t.title === 'Bug Bash')!;
const learn = PresetTemplates.find((t) => t.title === 'Learn how to use playbooks')!;

const row = (template: typeof bugBash, onSelect = jest.fn(), description?: string) => (
    <IntlProvider locale='en'>
        <TemplateRow
            title={template.title}
            icon={template.icon}
            template={template.template}
            label={template.label}
            description={description}
            onSelect={onSelect}
        />
    </IntlProvider>
);

describe('TemplateRow', () => {
    test('shows the template as a Fusion app row: its icon, name and what it holds', () => {
        render(row(bugBash));

        const el = screen.getByTestId('template-details');
        expect(el.className).toContain('am-app-row');
        expect(el.querySelector(`[data-fusion-icon="${bugBash.icon}"]`)).not.toBeNull();
        expect(screen.getByText('Bug Bash')).toBeTruthy();
        expect(screen.getByText(/checklists? · .*actions?/)).toBeTruthy();
        expect(el.querySelector('img, svg')).toBeNull();
    });

    test('uses the template from the row and from its button, once each', () => {
        const onSelect = jest.fn();
        render(row(bugBash, onSelect));

        fireEvent.click(screen.getByTestId('use-playbook'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('use-playbook').getAttribute('aria-label')).toBe('Use Bug Bash');

        fireEvent.click(screen.getByTestId('template-details'));
        expect(onSelect).toHaveBeenCalledTimes(2);

        fireEvent.keyDown(screen.getByTestId('template-details'), {key: 'Enter'});
        expect(onSelect).toHaveBeenCalledTimes(3);
    });

    test('shows a template\'s label and description', () => {
        render(row(learn, jest.fn(), 'Learn the basics.'));
        expect(screen.getByText('Recommended for beginners')).toBeTruthy();
        expect(screen.getByText('Learn the basics.')).toBeTruthy();
    });
});

describe('PresetTemplates', () => {
    test.each(PresetTemplates.map((t) => [t.title, t.icon]))('%s has a Fusion icon (%s), not an illustration', (_, icon) => {
        expect(FUSION_ICON_NAMES).toContain(icon);
    });
});
