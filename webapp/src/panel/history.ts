// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: Playbooks has no full page any more. Its pages (runs, a run's overview, playbooks, the playbook editor,
// your tasks...) are views of its side panel, kept at the paths the full page had (/playbooks/runs/<id>...) in the
// panel's own history: the views keep their links and routes, and the panel's back button goes back through them.
// A path outside /playbooks goes to the app's history (a channel, a profile...).

import {
    History,
    LocationDescriptor,
    LocationState,
    createLocation,
    createMemoryHistory,
    createPath,
} from 'history';
import {useEffect, useState} from 'react';

import {browserHistory} from 'src/webapp_globals';

export const PANEL_BASE = '/playbooks';

// The panel's first view: the current channel's runs and checklists (what the side panel always showed).
export const PANEL_HOME = '/playbooks/channel';

// The view that lists everything you can reach (your runs, your playbooks, your tasks): what the full page's left
// sidebar was.
export const PANEL_BROWSE = '/playbooks/browse';

// isPanelPath tells whether a path (without the site's subpath) is one of the panel's views.
export const isPanelPath = (pathname: string) => pathname === PANEL_BASE || pathname.startsWith(PANEL_BASE + '/');

const targetPathname = (to: LocationDescriptor<LocationState>) => {
    if (typeof to === 'string') {
        return createLocation(to).pathname ?? '';
    }
    return to.pathname ?? '';
};

const targetPath = (to: LocationDescriptor<LocationState>) => (typeof to === 'string' ? to : createPath(createLocation(to)));

export type PanelHistory = History & {

    // reset leaves the panel on one view, with nothing to go back to.
    reset: (path?: string) => void;

    // canGoBack tells whether the panel has a view to go back to.
    canGoBack: () => boolean;

    // back goes to the previous view; a view opened on its own goes back to the channel's runs.
    back: () => void;
};

export function makePanelHistory(appHistory: () => History | undefined = () => browserHistory): PanelHistory {
    const memory = createMemoryHistory({initialEntries: [PANEL_HOME]});

    // The panel's history reads through to the memory history (location, index, length change as it moves), and
    // only sends the paths that aren't the panel's to the app.
    const panel = Object.create(memory) as PanelHistory;

    panel.push = (to: LocationDescriptor<LocationState>, state?: LocationState) => {
        if (isPanelPath(targetPathname(to))) {
            if (typeof to === 'string') {
                memory.push(to, state);
            } else {
                memory.push(to);
            }
            return;
        }
        appHistory()?.push(targetPath(to), state);
    };

    panel.replace = (to: LocationDescriptor<LocationState>, state?: LocationState) => {
        if (isPanelPath(targetPathname(to))) {
            if (typeof to === 'string') {
                memory.replace(to, state);
            } else {
                memory.replace(to);
            }
            return;
        }
        appHistory()?.push(targetPath(to), state);
    };

    panel.reset = (path = PANEL_HOME) => {
        if (memory.index > 0) {
            memory.go(-memory.index);
        }
        memory.replace(path);
    };

    panel.canGoBack = () => memory.index > 0;

    panel.back = () => {
        if (memory.index > 0) {
            memory.goBack();
            return;
        }
        memory.replace(PANEL_HOME);
    };

    return panel;
}

export const panelHistory = makePanelHistory();

// The longest pop-out panel state the host passes on (it travels in the pop-out window's URL).
const MAX_PANEL_STATE = 512;

// isRestorablePanelState tells whether a pop-out panel state is a view of the panel to start on. The state comes from
// a URL, so it's untrusted: only the panel's own paths are taken, and the view fetches its run or playbook again as
// the signed-in person (one they can't open shows the not-found view).
export function isRestorablePanelState(state?: string): state is string {
    if (!state || state.length > MAX_PANEL_STATE || state === PANEL_HOME) {
        return false;
    }
    if (Array.from(state).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
        return false;
    }
    return isPanelPath(createLocation(state).pathname ?? '');
}

/**
 * usePanelState links the panel to the host's pop-out panel state: a pop-out window starts on the view the main
 * window showed (initialPanelState, e.g. '/playbooks/runs/<id>'), and the panel reports every move (setPanelState),
 * null for the channel's runs, so that "Open in a new window" starts where the person is. Without the props (the
 * classic UI), nothing changes.
 */
export function usePanelState(history: PanelHistory, setPanelState?: (state: string | null) => void, initialPanelState?: string): void {
    useState(() => {
        if (isRestorablePanelState(initialPanelState)) {
            history.reset(PANEL_HOME);
            history.push(initialPanelState);
        }
        return null;
    });

    useEffect(() => {
        if (!setPanelState) {
            return undefined;
        }
        const report = () => {
            const path = createPath(history.location);
            setPanelState(path === PANEL_HOME ? null : path);
        };
        report();
        return history.listen(report);
    }, [history, setPanelState]);
}

type PanelControls = {

    // Whether the Playbooks panel is showing.
    isOpen: () => boolean;

    // Shows the Playbooks panel.
    show: () => void;
};

let controls: PanelControls | null = null;

// setPanelControls is called once the plugin has registered its panel.
export function setPanelControls(next: PanelControls | null) {
    controls = next;
}

/**
 * openPlaybooksPanel shows a view of the Playbooks panel, e.g. '/playbooks/runs/<id>#playbook-run-retrospective'.
 * A closed panel opens on it, with the channel's runs to go back to; an open one goes to it as a link would.
 */
export function openPlaybooksPanel(path: string, history: PanelHistory = panelHistory) {
    const open = controls?.isOpen() ?? false;
    if (!open) {
        history.reset(PANEL_HOME);
    }

    if (path !== createPath(history.location)) {
        history.push(path);
    }

    if (!open) {
        controls?.show();
    }
}

// openPanelHome opens the panel on the channel's runs, as the channel header button and the app bar icon do.
export function openPanelHome(history: PanelHistory = panelHistory) {
    if (!(controls?.isOpen() ?? false)) {
        history.reset(PANEL_HOME);
    }
}
