// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Store} from 'redux';

import {GlobalState} from '@mattermost/types/store';
import {isSystemMessage} from 'mattermost-redux/utils/post_utils';
import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {getChannel} from 'mattermost-redux/selectors/entities/channels';

import {FormattedMessage} from 'react-intl';

import PlaybookRunPostMenuIcon from 'src/components/assets/icons/post_menu_icon';

import {addToTimeline, startPlaybookRun} from 'src/actions';

function shouldShowPostMenuForPost(store: Store, postId: string) {
    const state = store.getState() as GlobalState;
    const post = getPost(state, postId);
    return Boolean(post) && !isSystemMessage(post);
}

export const StartPlaybookRunPostMenuText = () => {
    return (
        <>
            <PlaybookRunPostMenuIcon data-testid={'playbookRunPostMenuIcon'}/>
            <FormattedMessage defaultMessage='Run playbook'/>
        </>
    );
};

export const AttachToPlaybookRunPostMenuText = () => {
    return (
        <>
            <PlaybookRunPostMenuIcon/>
            <FormattedMessage defaultMessage='Add to run timeline'/>
        </>
    );
};

export function makeStartPlaybookRunAction(store: Store) {
    return {
        text: StartPlaybookRunPostMenuText,
        action: (postId: string) => {
            const state = store.getState() as GlobalState;
            const post = getPost(state, postId);
            if (!post) {
                return;
            }
            const channel = getChannel(state, post.channel_id);
            if (!channel) {
                return;
            }
            store.dispatch(startPlaybookRun(channel.team_id, postId) as any);
        },
        filter: (postId: string) => {
            return shouldShowPostMenuForPost(store, postId);
        },
    };
}

export function makeAttachToPlaybookRunAction(store: Store) {
    return {
        text: AttachToPlaybookRunPostMenuText,
        action: (postId: string) => {
            store.dispatch(addToTimeline(postId) as any);
        },
        filter: (postId: string) => {
            return shouldShowPostMenuForPost(store, postId);
        },
    };
}
