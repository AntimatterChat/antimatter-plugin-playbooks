// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The id of the panel's scrolling view: the lists' infinite scroll and the editor's section links follow it (the full
// page's container had the same id).
export const PANEL_SCROLL_ID = 'playbooks-backstageRoot';

// Marks the panel's root, so that the link handler leaves the panel's own links to its router.
export const PANEL_ROOT_SELECTOR = '[data-playbooks-panel]';

// The width the side panel has by default in the Fusion UI, until it's measured.
export const DEFAULT_PANEL_WIDTH = 474;

// Under this width, the lists show one compact line per run or playbook instead of table columns.
export const COMPACT_LIST_WIDTH = 700;

// Under this width, the editor takes the single-column layout it had on phones; under the wider one, it hides the
// outline's section links.
export const NARROW_EDITOR_WIDTH = 769;
export const EDITOR_NAV_WIDTH = 1267;
