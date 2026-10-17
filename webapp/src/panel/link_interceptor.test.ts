// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import {installLinkInterceptor, panelPathOfLink} from './link_interceptor';

jest.mock('src/webapp_globals', () => ({browserHistory: undefined}));

// jsdom's page is http://localhost:8065 (package.json's testEnvironmentOptions).
const SITE = 'http://localhost:8065';
const RUN = '/playbooks/runs/abcdefghijklmnopqrstuvwxyz';

describe('panelPathOfLink', () => {
    test.each([
        [RUN, SITE, RUN],
        [`${RUN}?from=dm_assignedtask`, SITE, `${RUN}?from=dm_assignedtask`],
        [`${SITE}${RUN}#playbook-run-retrospective`, SITE, `${RUN}#playbook-run-retrospective`],
        ['/playbooks/playbooks/abcdefghijklmnopqrstuvwxyz/outline', SITE, '/playbooks/playbooks/abcdefghijklmnopqrstuvwxyz/outline'],
        ['/playbooks', SITE, '/playbooks'],
        [`/chat${RUN}`, `${SITE}/chat`, RUN],
    ])('%s (site %s) opens %s in the panel', (href, site, expected) => {
        expect(panelPathOfLink(href, site)).toBe(expected);
    });

    test.each([
        ['another site', `https://example.com${RUN}`, SITE],
        ['another page of the app', '/lumen/channels/town-square', SITE],
        ['a path that only starts like it', '/playbooksroom/channels/x', SITE],
        ['the community route', '/lumen/playbooks/runs', SITE],
        ['outside the site subpath', RUN, `${SITE}/chat`],
    ])('leaves %s alone', (_name, href, site) => {
        expect(panelPathOfLink(href, site)).toBeNull();
    });
});

describe('installLinkInterceptor', () => {
    let open: jest.Mock;
    let remove: () => void;
    let appClick: jest.Mock;

    const link = (href: string, attributes: Record<string, string> = {}, parent: HTMLElement = document.body) => {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        Object.entries(attributes).forEach(([k, v]) => a.setAttribute(k, v));
        const span = document.createElement('span');
        span.textContent = 'run';
        a.appendChild(span);
        parent.appendChild(a);
        return span;
    };

    const click = (target: Element, init: MouseEventInit = {}) => {
        const event = new MouseEvent('click', {bubbles: true, cancelable: true, button: 0, ...init});
        target.dispatchEvent(event);
        return event;
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        open = jest.fn();

        // The app's own handler (it also keeps jsdom from navigating).
        appClick = jest.fn((e: Event) => e.preventDefault());
        document.body.addEventListener('click', appClick);
        remove = installLinkInterceptor({getSiteURL: () => SITE, open});
    });

    afterEach(() => {
        remove();
        document.body.removeEventListener('click', appClick);
    });

    test('opens a link to the old full page in the panel, before the app handles it', () => {
        const event = click(link(`${RUN}?from=run_update`));

        expect(open).toHaveBeenCalledWith(`${RUN}?from=run_update`);
        expect(event.defaultPrevented).toBe(true);
        expect(appClick).not.toHaveBeenCalled();
    });

    test.each([
        ['ctrl', {ctrlKey: true}],
        ['meta', {metaKey: true}],
        ['shift', {shiftKey: true}],
        ['middle button', {button: 1}],
    ])('leaves a %s click (a new tab or window) to the browser', (_name, init) => {
        click(link(RUN), init);

        expect(open).not.toHaveBeenCalled();
        expect(appClick).toHaveBeenCalledTimes(1);
    });

    test('leaves the links that open elsewhere or download', () => {
        click(link(RUN, {target: '_blank'}));
        click(link('/plugins/playbooks/api/v0/playbooks/x/export', {download: 'export.json'}));
        click(link('/lumen/channels/town-square'));

        expect(open).not.toHaveBeenCalled();
        expect(appClick).toHaveBeenCalledTimes(3);
    });

    test('leaves the panel its own links (its router has them)', () => {
        const panel = document.createElement('div');
        panel.setAttribute('data-playbooks-panel', 'true');
        document.body.appendChild(panel);

        click(link(RUN, {}, panel));

        expect(open).not.toHaveBeenCalled();
        expect(appClick).toHaveBeenCalledTimes(1);
    });

    test('stops when removed', () => {
        remove();
        click(link(RUN));

        expect(open).not.toHaveBeenCalled();
        remove = () => {};
    });
});
