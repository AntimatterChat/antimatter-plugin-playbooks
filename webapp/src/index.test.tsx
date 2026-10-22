// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: Playbooks has no full page (no product, no app switcher entry): it's an app of the side panel, and the
// old full-page URLs open the panel.

import {PANEL_HOME, openPlaybooksPanel, panelHistory} from 'src/panel/history';

jest.mock('src/webapp_globals', () => ({browserHistory: undefined}));

// The charts of the playbook statistics aren't drawn here (chart.js and its plugins don't load in jsdom).
jest.mock('src/components/backstage/line_graph', () => ({__esModule: true, default: () => null}));
jest.mock('src/components/backstage/bar_graph', () => ({__esModule: true, default: () => null}));

const TOGGLE = {type: 'TOGGLE_PLAYBOOKS_PANEL'};
const SHOW = {type: 'SHOW_PLAYBOOKS_PANEL'};

// A registry that records what the plugin registers.
const makeRegistry = () => {
    const calls: Record<string, unknown[][]> = {};
    const registry = new Proxy({}, {
        get: (_target, name: string) => (...args: unknown[]) => {
            calls[name] = [...(calls[name] ?? []), args];
            return {toggleRHSPlugin: TOGGLE, showRHSPlugin: SHOW};
        },
    });
    return {registry, calls};
};

// The state has a current community: the channel header button and the app bar icon read it (openPanel).
const makeStore = (rhsOpen = false) => {
    const store = {
        teamId: 'team-1',
        dispatch: jest.fn(),
        getState: () => ({
            'plugins-playbooks': {rhsOpen},
            entities: {teams: {currentTeamId: store.teamId}},
        }),
        subscribe: jest.fn(),
    };
    return store;
};

// Loads the plugin with its own panel history (isolateModules), for the tests that look at the panel's views.
const loadPluginAndHistory = () => {
    let plugin: any;
    let history: typeof panelHistory | undefined;
    let open: typeof openPlaybooksPanel | undefined;
    (window as any).registerPlugin = (_id: string, instance: unknown) => {
        plugin = instance;
    };
    jest.isolateModules(() => {
        require('src/index'); // eslint-disable-line global-require, @typescript-eslint/no-require-imports
        ({panelHistory: history, openPlaybooksPanel: open} = require('src/panel/history')); // eslint-disable-line global-require, @typescript-eslint/no-require-imports
    });
    return {plugin, history: history!, open: open!};
};

const loadPlugin = () => {
    let plugin: any;
    (window as any).registerPlugin = (_id: string, instance: unknown) => {
        plugin = instance;
    };
    jest.isolateModules(() => {
        require('src/index'); // eslint-disable-line global-require, @typescript-eslint/no-require-imports
    });
    return plugin;
};

describe('Playbooks registrations', () => {
    test('registers no full page (product)', () => {
        const plugin = loadPlugin();
        const {registry, calls} = makeRegistry();

        plugin.doRegistrations(registry, makeStore(), {});

        expect(calls.registerProduct).toBeUndefined();
        expect(calls.registerRightHandSidebarComponent).toHaveLength(1);
        expect(calls.registerAppBarComponent).toHaveLength(1);
    });

    test('answers the old full-page URLs in a community', () => {
        const plugin = loadPlugin();
        const {registry, calls} = makeRegistry();

        plugin.doRegistrations(registry, makeStore(), {});

        expect(calls.registerNeedsTeamRoute).toHaveLength(1);
        const [route, component] = calls.registerNeedsTeamRoute[0];
        expect(route).toBe('/');
        expect((component as {name?: string}).name).toBe('OldUrlRedirect');
    });

    test('the channel header button and the app bar icon open the panel on the channel\'s runs', () => {
        const plugin = loadPlugin();
        const {registry, calls} = makeRegistry();
        const store = makeStore(false);

        plugin.doRegistrations(registry, store, {});

        // The panel's history is the plugin's own (isolateModules): use the one it registered with.
        const toggle = calls.registerChannelHeaderButtonAction[0][1] as () => void;
        const appBarToggle = calls.registerAppBarComponent[0][1] as () => void;
        expect(appBarToggle).toBe(toggle);

        toggle();
        expect(store.dispatch).toHaveBeenCalledWith(TOGGLE);
    });

    test('the button opens the panel again on the view it was on, and on the channel\'s runs in another community', () => {
        const {plugin, history} = loadPluginAndHistory();
        const {registry, calls} = makeRegistry();
        const store = makeStore(false);
        plugin.doRegistrations(registry, store, {});
        const toggle = calls.registerChannelHeaderButtonAction[0][1] as () => void;

        toggle();
        history.push('/playbooks/runs');

        // Closed, then opened again in the same community: the view stays.
        toggle();
        expect(history.location.pathname).toBe('/playbooks/runs');

        // In another community, the panel starts again from the channel's runs.
        store.teamId = 'team-2';
        toggle();
        expect(history.location.pathname).toBe(PANEL_HOME);
        expect(store.dispatch).toHaveBeenLastCalledWith(TOGGLE);
    });

    test('opening a view shows the panel', () => {
        const {plugin, history, open} = loadPluginAndHistory();
        const {registry} = makeRegistry();
        const store = makeStore(false);
        plugin.doRegistrations(registry, store, {});

        open('/playbooks/runs');

        expect(store.dispatch).toHaveBeenCalledWith(SHOW);
        expect(history.location.pathname).toBe('/playbooks/runs');
        history.back();
        expect(history.location.pathname).toBe(PANEL_HOME);
    });
});
