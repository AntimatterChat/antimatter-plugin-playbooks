// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter ships two web UIs: Fusion, the default, and the classic one. Both say which one runs before plugins load
// (window.antimatterWebUI, and data-am-web-ui on <html>). Under Fusion, Playbooks draws with Fusion's design tokens
// (--am-main, --am-muted...), its icon sprite and its classes; under the classic UI, with the classic theme.

declare global {
    interface Window {
        antimatterWebUI?: 'classic' | 'fusion';
    }
}

// isFusionUI returns whether the Fusion web UI is running.
export function isFusionUI(): boolean {
    return window.antimatterWebUI === 'fusion' || document.documentElement.dataset.amWebUi === 'fusion';
}

// FUSION is the selector of a page drawn by the Fusion UI, for styles that only apply there: `${FUSION} & {...}` in a
// styled component. It matches menus and dialogs portalled to <body> too, unlike the Fusion classes' scope (.am-app).
export const FUSION = 'html[data-am-web-ui="fusion"]';

// Playbooks' colour in the Fusion UI (its app icon, .am-playbooks in Fusion's app rail).
export const APP_COLOR = '#60A5FA';
