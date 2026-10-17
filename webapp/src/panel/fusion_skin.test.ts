// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import path from 'path';

// The panel's Fusion skin restyles classic classes (.btn, .form-control...): it must only ever apply to Playbooks'
// panel under the Fusion UI, never to the classic UI or to the rest of the page.
const SCOPE = 'html[data-am-web-ui=\'fusion\'] [data-playbooks-panel]';

const css = fs.readFileSync(path.join(__dirname, 'fusion_skin.scss'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// The selectors of the rules at the top level of the stylesheet.
const topLevelSelectors = () => {
    const selectors: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < css.length; i++) {
        if (css[i] === '{') {
            if (depth === 0) {
                selectors.push(css.slice(start, i).trim());
            }
            depth++;
        } else if (css[i] === '}') {
            depth--;
            if (depth === 0) {
                start = i + 1;
            }
        } else if (css[i] === ';' && depth === 0) {
            start = i + 1;
        }
    }
    return selectors;
};

describe('the panel\'s Fusion skin', () => {
    test('has rules', () => {
        expect(topLevelSelectors().length).toBeGreaterThan(0);
    });

    test('scopes every rule to the panel under the Fusion UI', () => {
        const unscoped = topLevelSelectors().
            flatMap((selector) => selector.split(',').map((s) => s.trim())).
            filter((selector) => !selector.startsWith(SCOPE));
        expect(unscoped).toEqual([]);
    });

    test('uses Fusion\'s tokens, not hard-coded colours', () => {
        const colours = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];

        // White text on the accent and danger colours, as Fusion's buttons.
        expect(colours.filter((c) => c.toLowerCase() !== '#fff')).toEqual([]);
        expect(css).not.toMatch(/--center-channel|--button-bg|--sidebar-/);
    });

    test('is loaded by the panel', () => {
        const panel = fs.readFileSync(path.join(__dirname, 'panel.tsx'), 'utf8');
        expect(panel).toContain('import \'./fusion_skin.scss\';');
        expect(panel).toContain('data-playbooks-panel={true}');
    });
});
