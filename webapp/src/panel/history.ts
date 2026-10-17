// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

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
