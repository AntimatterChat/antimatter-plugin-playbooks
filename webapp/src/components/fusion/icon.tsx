// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {isFusionUI} from './web_ui';

// The icons Playbooks draws in Fusion's line icon set (the app's sprite, symbols #am-i-<name>), with the classic UI's
// Compass icon for each.
const CLASSIC_ICONS = {
    runbook: 'product-playbooks',
    playbook: 'book-outline',
    checkbox: 'check-all',
    check: 'check',
    plus: 'plus',
    flag: 'flag-outline',
    flame: 'fire',
    users: 'account-multiple-outline',
    'user-plus': 'account-plus-outline',
    sparkle: 'lightbulb-outline',
    ticket: 'magnify',
    compass: 'information-outline',
    upload: 'paperclip',
    inbox: 'checkbox-multiple-marked-outline',
    search: 'magnify',
    timer: 'clock-outline',
    clock: 'clock-outline',
    rank: 'sort-ascending',
    ban: 'alert-circle-outline',
    chev: 'chevron-down',
    dots: 'dots-horizontal',
    lock: 'lock-outline',
    apps: 'play-box-multiple-outline',
    link: 'link-variant',
    tag: 'format-list-bulleted',
    pen: 'pencil-outline',
    star: 'star-outline',
    eye: 'eye-outline',
    trash: 'trash-can-outline',
    copy: 'content-copy',
    x: 'close',
} as const;

export type FusionIconName = keyof typeof CLASSIC_ICONS;

// The Fusion icons Playbooks uses: each must be a symbol of Fusion's sprite (see icon.test.tsx).
export const FUSION_ICON_NAMES = Object.keys(CLASSIC_ICONS) as FusionIconName[];

// Fusion's icon sizes (.am-ic, .am-ic.am-sm, .am-ic.am-xs).
const SIZES = {md: 20, sm: 16, xs: 13} as const;

type Props = {
    name: FusionIconName;
    size?: keyof typeof SIZES | number;
    className?: string;
};

/**
 * FusionIcon draws one of Fusion's icons under the Fusion UI, and the matching Compass icon under the classic UI. The
 * stroke is set on the element too, so the icon looks the same outside Fusion's .am-app (in a menu or a dialog).
 */
const FusionIcon = ({name, size = 'md', className}: Props) => {
    const px = typeof size === 'number' ? size : SIZES[size];
    if (isFusionUI()) {
        const classes = ['am-ic', typeof size === 'string' && size !== 'md' ? `am-${size}` : '', className ?? ''].filter(Boolean).join(' ');
        return (
            <svg
                className={classes}
                width={px}
                height={px}
                fill='none'
                stroke='currentColor'
                strokeWidth={1.8}
                strokeLinecap='round'
                strokeLinejoin='round'
                style={typeof size === 'number' ? {width: px, height: px} : undefined}
                aria-hidden='true'
                data-fusion-icon={name}
            >
                <use href={`#am-i-${name}`}/>
            </svg>
        );
    }

    return (
        <i
            className={`icon icon-${CLASSIC_ICONS[name]}` + (className ? ` ${className}` : '')}
            style={{fontSize: px}}
            aria-hidden='true'
            data-fusion-icon={name}
        />
    );
};

export default FusionIcon;
