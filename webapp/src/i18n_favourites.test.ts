// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Message ids are hashes of the English text (formatjs, [sha512:contenthash:base64:6]), so spelling "Favourite"
// the British way gave these messages new ids: en.json and every translation must use them.

const id = (defaultMessage: string) => crypto.createHash('sha512').update(defaultMessage).digest('base64').slice(0, 6);
const catalog = (name: string): Record<string, string> => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', name), 'utf8'));

const british = ['Favourite', 'Unfavourite', 'Favourites'];
const american = ['Favorite', 'Unfavorite', 'Favorites'];

describe('Favourites in the English interface', () => {
    test('en.json has the British messages under their own ids, and not the old ones', () => {
        const en = catalog('en.json');
        for (const message of british) {
            expect(en[id(message)]).toBe(message);
        }
        for (const message of american) {
            expect(en[id(message)]).toBeUndefined();
        }
    });

    test('the translations moved to the new ids, unchanged', () => {
        const files = fs.readdirSync(path.join(__dirname, '..', 'i18n')).filter((f) => f.endsWith('.json') && f !== 'en.json');
        for (const file of files) {
            const messages = catalog(file);
            for (const message of american) {
                expect([file, messages[id(message)]]).toEqual([file, undefined]);
            }
        }

        const fr = catalog('fr.json');
        expect(fr[id('Favourite')]).toBe('Favori');
        expect(fr[id('Favourites')]).toBe('Favoris');
    });
});
