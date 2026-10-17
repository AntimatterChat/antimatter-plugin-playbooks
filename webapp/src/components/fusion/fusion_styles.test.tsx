// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {render} from '@testing-library/react';

import {PrimaryButton, TertiaryButton} from 'src/components/assets/buttons';
import {DropdownMenu} from 'src/components/dot_menu';

// The CSS styled-components injected for what was rendered.
const injectedCss = () => Array.from(document.querySelectorAll('style')).map((s) => s.textContent ?? '').join('\n');

// The rules of the injected CSS that only apply under the Fusion UI.
const fusionRules = () => injectedCss().split('}').filter((rule) => rule.includes('html[data-am-web-ui="fusion"]'));

describe('the shared controls under the Fusion UI', () => {
    test('buttons get Fusion\'s shape and colours, and keep the classic ones outside Fusion', () => {
        const {container} = render(
            <>
                <PrimaryButton>{'Create'}</PrimaryButton>
                <TertiaryButton>{'Cancel'}</TertiaryButton>
            </>,
        );

        // Still the classic buttons' classes, which the classic UI styles.
        const [primary, tertiary] = Array.from(container.querySelectorAll('button'));
        expect(primary.className).toContain('btn-primary');
        expect(tertiary.className).toContain('btn-tertiary');

        const rules = fusionRules().join('}');
        expect(rules).toContain('border-radius:10px');
        expect(rules).toContain('background:var(--am-matter)');
        expect(rules).toContain('background:var(--am-raise)');
        expect(rules).toContain('font-family:var(--am-font-ui)');
    });

    test('menus are Fusion\'s: the raised surface, rounder', () => {
        render(<DropdownMenu>{'Item'}</DropdownMenu>);

        const rules = fusionRules().join('}');
        expect(rules).toContain('background:var(--am-raise)');
        expect(rules).toContain('border-radius:12px');
        expect(rules).toContain('box-shadow:var(--am-shadow)');
    });
});
