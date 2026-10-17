// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import {render} from '@testing-library/react';

import FusionIcon, {FUSION_ICON_NAMES} from './icon';

// The symbols of Fusion's icon sprite (server repo: webapp/fusion/src/fusion/components/icon/icon_sprite.tsx), as of
// the Fusion look of Playbooks. A name Playbooks uses that isn't here would draw nothing under Fusion.
const FUSION_SPRITE = [
    'hash', 'speaker', 'lock', 'forum', 'thread', 'thread-reply', 'search', 'users', 'pin', 'bell', 'inbox', 'cog',
    'shield', 'mic', 'mic-off', 'mic-lock', 'headphones', 'headphones-off', 'video', 'screen', 'hangup', 'plus', 'apps',
    'captions', 'transcript', 'reply', 'smile', 'dots', 'x', 'ban', 'chev', 'server', 'globe', 'export', 'pen', 'send',
    'compass', 'menu', 'board', 'playbook', 'check', 'store', 'plug', 'chat', 'rank', 'org', 'tag', 'clock', 'history',
    'bot', 'image', 'file', 'attach', 'follow', 'at', 'bold', 'italic', 'strike', 'heading', 'link', 'code',
    'codeblock', 'quote', 'sparkle', 'flag', 'eye-off', 'eye', 'stroke', 'library', 'flame', 'timer', 'ul', 'ol',
    'type', 'poll', 'upload', 'slash', 'star', 'bell-off', 'folder', 'leave', 'user-plus', 'forward', 'bookmark', 'copy',
    'trash', 'sticker', 'popout', 'expand', 'kanban', 'runbook', 'ticket', 'mail', 'calendar', 'pad', 'draw', 'cursor',
    'rect', 'ellipse', 'arrow', 'text', 'eraser', 'undo', 'checkbox', 'pause', 'moon', 'phone', 'pin-top', 'hand',
    'fullscreen', 'shrink-width', 'mark',
];

const setWebUI = (ui?: 'classic' | 'fusion') => {
    window.antimatterWebUI = ui;
    if (ui) {
        document.documentElement.dataset.amWebUi = ui;
    } else {
        delete document.documentElement.dataset.amWebUi;
    }
};

afterEach(() => setWebUI(undefined));

describe('FusionIcon', () => {
    test.each(FUSION_ICON_NAMES)('%s is a symbol of Fusion\'s sprite', (name) => {
        expect(FUSION_SPRITE).toContain(name);
    });

    test('draws the sprite\'s symbol under Fusion, with its own stroke', () => {
        setWebUI('fusion');
        const {container} = render(<FusionIcon name='runbook'/>);
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg!.getAttribute('class')).toBe('am-ic');
        expect(svg!.getAttribute('stroke')).toBe('currentColor');
        expect(svg!.getAttribute('fill')).toBe('none');
        expect(container.querySelector('use')!.getAttribute('href')).toBe('#am-i-runbook');
    });

    test('takes Fusion\'s small sizes as its classes, and other sizes inline', () => {
        setWebUI('fusion');
        const {container, rerender} = render(
            <FusionIcon
                name='plus'
                size='sm'
            />,
        );
        expect(container.querySelector('svg')!.getAttribute('class')).toBe('am-ic am-sm');

        rerender(
            <FusionIcon
                name='plus'
                size={22}
            />,
        );
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('class')).toBe('am-ic');
        expect(svg.style.width).toBe('22px');
    });

    test('draws the matching Compass icon under the classic UI', () => {
        setWebUI('classic');
        const {container} = render(<FusionIcon name='runbook'/>);
        expect(container.querySelector('svg')).toBeNull();
        expect(container.querySelector('i')!.className).toBe('icon icon-product-playbooks');
    });
});
