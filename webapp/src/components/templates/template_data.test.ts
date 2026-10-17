// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defaultMessageOnJoin} from 'src/types/playbook';

import TemplateData from './template_data';

describe('TemplateData', () => {
    // if a template is missing, this might break the work templates feature.
    // reminder: because playbook templates don't have an ID, we rely on their name to identify them.
    // if this breaks, contact the @channel team to figure out what should be done.
    const knownTemplatesInWorkTemplate = [
        'Product Release',
        'Incident Resolution',
        'Customer Onboarding',
        'Employee Onboarding',
        'Feature Lifecycle',
        'Bug Bash',
    ];

    knownTemplatesInWorkTemplate.forEach((templateName) => {
        it(`should contains ${templateName} for work template`, () => {
            expect(
                TemplateData.find((template) => template.title.trim() === templateName),
            ).not.toBeUndefined();
        });
    });

    // The built-in templates and the default welcome message don't link to the dead
    // docs.antimatter.example of the rebrand.
    it('has no docs.antimatter.example links', () => {
        expect(JSON.stringify(TemplateData)).not.toContain('docs.antimatter.example');
        expect(defaultMessageOnJoin).not.toContain('docs.antimatter.example');
        expect(defaultMessageOnJoin).toContain('https://antimatter.chat/docs/users/apps.html#playbooks');
    });
});
