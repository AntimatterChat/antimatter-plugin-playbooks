// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DateTime} from 'luxon';

export enum ErrorPageTypes {
    PLAYBOOK_RUNS = 'playbook_runs',
    PLAYBOOKS = 'playbooks',
    DEFAULT = 'default',
}

export const BACKSTAGE_LIST_PER_PAGE = 15;
export const PROFILE_CHUNK_SIZE = 200;
export const RUN_NAME_MAX_LENGTH = 64;

export const DateTimeFormats = {
    // eslint-disable-next-line no-undefined
    DATE_MED_NO_YEAR: {...DateTime.DATE_MED, year: undefined},
};

export const CallsSlashCommandPrefix = '/call ';

export const MAX_PROPERTIES_LIMIT = 20;
