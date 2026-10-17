// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useApolloClient} from '@apollo/client';

import {playbookLHSQueryDocument} from 'src/panel/browse_query';

// Antimatter: the full page's left sidebar is the side panel's browse view (src/panel/browse.tsx); the changes that
// used to refresh the sidebar (following a run, archiving a playbook...) refresh its lists.
export const useLHSRefresh = () => {
    const apolloClient = useApolloClient();

    const refreshLists = () => {
        apolloClient.refetchQueries({
            include: [playbookLHSQueryDocument],
        });
    };

    return refreshLists;
};
