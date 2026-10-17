// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Playbooks draws Fusion's empty states (a small line icon, a title, one action), never Mattermost's illustrations:
// no source file imports them, they're gone from the tree, and no component draws an illustration inline. This
// scans what the bundle is built from: every module the plugin's code imports.

import fs from 'fs';
import path from 'path';

const SRC = __dirname;

// The Mattermost artwork Playbooks shipped, by the paths the code imported it from.
const OLD_ARTWORK = [
    'src/components/assets/illustrations/bug_bash_svg',
    'src/components/assets/illustrations/clipboard_checklist_svg',
    'src/components/assets/illustrations/customer_onboarding_svg',
    'src/components/assets/illustrations/employee_onboarding_svg',
    'src/components/assets/illustrations/feature_lifecycle_svg',
    'src/components/assets/illustrations/incident_resolution_svg',
    'src/components/assets/illustrations/learn_playbooks_svg',
    'src/components/assets/illustrations/playbook_list_svg',
    'src/components/assets/illustrations/product_release_svg',
    'src/components/assets/illustrations/rocket_release_svg',
    'src/components/assets/illustrations/search_svg',
    'src/components/assets/error_svg',
    'src/components/assets/no_content_playbook_runs_svg',
    'src/components/assets/no_metrics_svg',
    'src/components/assets/success_svg',
    'src/components/assets/files_overlay.png',
    'src/components/assets/antimatter_logo',
];

const sourceFiles = (dir: string): string[] => fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
        return entry.name === 'node_modules' ? [] : sourceFiles(full);
    }
    return (/\.(tsx?|jsx?|s?css)$/).test(entry.name) ? [full] : [];
});

// The modules a file imports (import ... from, import '...', require(), import()), resolved to src/... paths.
const importsOf = (file: string): string[] => {
    const code = fs.readFileSync(file, 'utf8');
    const specs = [
        ...code.matchAll(/(?:from\s+|import\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g),
        ...code.matchAll(/@import\s+['"]([^'"]+)['"]/g),
        ...code.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g),
    ].map((m) => m[1]);
    return specs.map((spec) => {
        if (spec.startsWith('.')) {
            return 'src/' + path.relative(SRC, path.resolve(path.dirname(file), spec)).split(path.sep).join('/');
        }
        return spec;
    });
};

const withoutExtension = (spec: string) => spec.replace(/\.(tsx?|jsx?)$/, '');

const files = sourceFiles(SRC).filter((f) => f !== __filename);

describe('Mattermost artwork', () => {
    test('no module of the plugin imports the old illustrations', () => {
        const offenders = files.flatMap((file) => importsOf(file).
            filter((spec) => OLD_ARTWORK.includes(withoutExtension(spec)) || (/\/illustrations\//).test(spec) || (/_svg$/).test(withoutExtension(spec))).
            map((spec) => `${path.relative(SRC, file)} imports ${spec}`));
        expect(offenders).toEqual([]);
    });

    test('the old illustrations are gone from the tree', () => {
        const left = OLD_ARTWORK.filter((spec) => {
            const base = path.join(SRC, '..', spec);
            return ['', '.tsx', '.ts', '.png', '.svg'].some((ext) => fs.existsSync(base + ext));
        });
        expect(left).toEqual([]);
        expect(fs.existsSync(path.join(SRC, 'components/assets/illustrations'))).toBe(false);
    });

    test('no component draws an illustration inline (an SVG of many shapes or fills)', () => {
        const drawings = files.filter((file) => (/\.tsx$/).test(file)).flatMap((file) => {
            const code = fs.readFileSync(file, 'utf8');
            const shapes = (code.match(/<(path|circle|rect|ellipse|polygon)\b/g) ?? []).length;
            const fills = (code.match(/fill=['"{]+#[0-9a-fA-F]{3,8}/g) ?? []).length;
            return shapes >= 4 || fills > 0 ? [`${path.relative(SRC, file)}: ${shapes} shapes, ${fills} coloured fills`] : [];
        });
        expect(drawings).toEqual([]);
    });

    test('no image is imported but the plugin\'s own icons', () => {
        const images = files.flatMap((file) => importsOf(file).
            filter((spec) => (/\.(png|jpe?g|gif|webp|svg)$/).test(spec)).
            map((spec) => `${path.relative(SRC, file)} imports ${spec}`));
        expect(images).toEqual([]);
    });
});
