// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';

import {
    PANEL_HOME,
    isPanelPath,
    makePanelHistory,
    openPanelHome,
    openPlaybooksPanel,
    setPanelControls,
} from './history';

jest.mock('src/webapp_globals', () => ({browserHistory: undefined}));

const RUN = '/playbooks/runs/abcdefghijklmnopqrstuvwxyz';

const setup = (open = false) => {
    const app = createMemoryHistory({initialEntries: ['/lumen/channels/town-square']});
    const panel = makePanelHistory(() => app);
    const controls = {open, isOpen: () => controls.open, show: jest.fn(() => { controls.open = true; })};
    setPanelControls(controls);
    return {app, panel, controls};
};

afterEach(() => setPanelControls(null));

describe('isPanelPath', () => {
    test.each([
        ['/playbooks', true],
        ['/playbooks/runs', true],
        [RUN, true],
        ['/playbooksroom', false],
        ['/lumen/playbooks/runs', false],
        ['/lumen/channels/town-square', false],
    ])('%s is a panel view: %s', (path, expected) => {
        expect(isPanelPath(path)).toBe(expected);
    });
});

describe('the panel history', () => {
    test('starts on the channel runs', () => {
        const {panel} = setup();
        expect(panel.location.pathname).toBe(PANEL_HOME);
        expect(panel.canGoBack()).toBe(false);
    });

    test('keeps the panel views, with their query and hash', () => {
        const {app, panel} = setup();
        panel.push(`${RUN}?from=run_list#playbook-run-retrospective`);

        expect(panel.location.pathname).toBe(RUN);
        expect(panel.location.search).toBe('?from=run_list');
        expect(panel.location.hash).toBe('#playbook-run-retrospective');
        expect(app.location.pathname).toBe('/lumen/channels/town-square');
    });

    test('sends the other paths to the app, without leaving the panel view', () => {
        const {app, panel} = setup();
        panel.push(RUN);
        panel.push('/lumen/channels/off-topic');
        panel.replace({pathname: '/lumen/pl/abcdefghijklmnopqrstuvwxyz'});

        expect(panel.location.pathname).toBe(RUN);
        expect(app.location.pathname).toBe('/lumen/pl/abcdefghijklmnopqrstuvwxyz');
        expect(app.length).toBe(3);
    });

    test('goes back through the views, and from a view opened on its own to the channel runs', () => {
        const {panel} = setup();
        panel.push('/playbooks/runs');
        panel.push(RUN);

        panel.back();
        expect(panel.location.pathname).toBe('/playbooks/runs');
        panel.back();
        expect(panel.location.pathname).toBe(PANEL_HOME);

        panel.replace('/playbooks/playbooks');
        expect(panel.canGoBack()).toBe(false);
        panel.back();
        expect(panel.location.pathname).toBe(PANEL_HOME);
    });

    test('reset leaves one view with nothing to go back to', () => {
        const {panel} = setup();
        panel.push('/playbooks/runs');
        panel.push(RUN);

        panel.reset('/playbooks/browse');
        expect(panel.location.pathname).toBe('/playbooks/browse');
        expect(panel.canGoBack()).toBe(false);
    });

    test('tells its listeners (the panel router) where it goes', () => {
        const {panel} = setup();
        const listener = jest.fn();
        const unlisten = panel.listen(listener);
        panel.push(RUN);
        unlisten();

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({pathname: RUN}), 'PUSH');
    });
});

describe('openPlaybooksPanel', () => {
    test('opens a closed panel on the view, with the channel runs to go back to', () => {
        const {panel, controls} = setup(false);
        panel.push('/playbooks/playbooks');

        openPlaybooksPanel(RUN, panel);

        expect(controls.show).toHaveBeenCalledTimes(1);
        expect(panel.location.pathname).toBe(RUN);
        panel.back();
        expect(panel.location.pathname).toBe(PANEL_HOME);
        expect(panel.canGoBack()).toBe(false);
    });

    test('goes to the view in an open panel, as a link would', () => {
        const {panel, controls} = setup(true);
        panel.push('/playbooks/runs');

        openPlaybooksPanel(RUN, panel);

        expect(controls.show).not.toHaveBeenCalled();
        expect(panel.location.pathname).toBe(RUN);
        panel.back();
        expect(panel.location.pathname).toBe('/playbooks/runs');
    });

    test('stays on the view it already shows', () => {
        const {panel} = setup(true);
        panel.push(RUN);
        const length = panel.length;

        openPlaybooksPanel(RUN, panel);
        expect(panel.length).toBe(length);
    });

    test('opens a closed panel on the channel runs', () => {
        const {panel, controls} = setup(false);
        panel.push(RUN);

        openPlaybooksPanel(PANEL_HOME, panel);

        expect(controls.show).toHaveBeenCalledTimes(1);
        expect(panel.location.pathname).toBe(PANEL_HOME);
        expect(panel.canGoBack()).toBe(false);
    });
});

describe('openPanelHome', () => {
    test('starts a closed panel from the channel runs', () => {
        const {panel} = setup(false);
        panel.push(RUN);

        openPanelHome(panel);
        expect(panel.location.pathname).toBe(PANEL_HOME);
    });

    test('leaves an open panel where it is (the button then closes it)', () => {
        const {panel} = setup(true);
        panel.push(RUN);

        openPanelHome(panel);
        expect(panel.location.pathname).toBe(RUN);
    });
});
