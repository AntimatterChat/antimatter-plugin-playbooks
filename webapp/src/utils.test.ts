// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bareUsername, uniqueId} from './utils';

describe('utils', () => {
    describe('bareUsername', () => {
        it('leaves a bare username unchanged', () => {
            expect(bareUsername('maya')).toEqual('maya');
        });

        it('strips a single leading @', () => {
            expect(bareUsername('@maya')).toEqual('maya');
        });

        it('strips a doubled leading @ (the "@@maya" case)', () => {
            expect(bareUsername('@@maya')).toEqual('maya');
        });

        it('handles an empty string', () => {
            expect(bareUsername('')).toEqual('');
        });
    });

    describe('uniqueId', () => {
        it('should handle a missing prefix', () => {
            const id1 = uniqueId();
            const id2 = uniqueId();

            expect(id1).not.toEqual(id2);
        });

        it('should handle a prefix', () => {
            const id1 = uniqueId('prefix');
            const id2 = uniqueId('prefix');
            const otherId1 = uniqueId('other');

            expect(id1).not.toEqual(id2);
            expect(id2).not.toEqual(otherId1);
            expect(otherId1).not.toEqual(id1);
        });
    });
});
