// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {ApolloClient, NormalizedCacheObject, gql} from '@apollo/client';

import {matchPath} from 'react-router-dom';

import {Store} from 'src/types/store';

import {inPlaybookRunChannel, isPlaybookRunRHSOpen} from 'src/selectors';
import {PlaybookRunStatus} from 'src/types/playbook_run';

import {receivedTeamPlaybookRunConnections, toggleRHS} from 'src/actions';
import {browserHistory} from 'src/webapp_globals';

const RunsOnTeamQuery = gql`
    query RunsOnTeamQuery(
        $participant: String!,
        $teamID: String!,
        $status: String!,
    ) {
        runs(
            teamID: $teamID,
            statuses: [$status],
            participantOrFollowerID: $participant,
        ) {
            edges {
                node {
                    channel_id: channelID
                    team_id: teamID
                }
            }
        }
    }
`;

export function makeRHSOpener(store: Store, graphqlClient: ApolloClient<NormalizedCacheObject>): () => Promise<void> {
    let currentTeamId = '';
    let currentChannelId = '';
    let currentChannelIsPlaybookRun = false;

    return async () => {
        const state = store.getState();
        const currentChannel = getCurrentChannel(state);
        const currentTeam = getCurrentTeam(state);
        const url = new URL(window.location.href);
        const isInChannel = matchPath(url.pathname, {path: '/:team/:path(channels|messages)/:identifier/:postid?'});

        // Wait for a valid team and channel before doing anything.
        if (!isInChannel || !currentChannel || !currentTeam) {
            return;
        }

        // Update the known set of playbook runs whenever the team changes.
        if (currentTeamId !== currentTeam.id) {
            currentTeamId = currentTeam.id;
            const currentUserId = getCurrentUserId(state);

            const fetched = await graphqlClient.query({
                query: RunsOnTeamQuery,
                variables: {
                    participant: currentUserId,
                    teamID: currentTeam.id,
                    status: PlaybookRunStatus.InProgress,
                },
            });

            const runs = fetched.data.runs.edges.map((edge: any) => edge.node);
            store.dispatch(receivedTeamPlaybookRunConnections(runs));
        }

        const searchParams = new URLSearchParams(url.searchParams);

        // Only consider opening the RHS if the channel has changed and wasn't already seen as
        // a playbook run.
        if (currentChannel.id === currentChannelId && currentChannelIsPlaybookRun) {
            return;
        }
        currentChannelId = currentChannel.id;
        currentChannelIsPlaybookRun = inPlaybookRunChannel(state);

        // Don't do anything unless we're in a playbook run channel.
        if (!currentChannelIsPlaybookRun) {
            return;
        }

        // Record (and remove) if we were asked to force the RHS open.
        let forceRHSOpen = false;
        if (searchParams.has('forceRHSOpen')) {
            forceRHSOpen = true;
            searchParams.delete('forceRHSOpen');
            browserHistory.replace({pathname: url.pathname, search: searchParams.toString()});
        }

        // Don't do anything if the playbook run RHS is already open.
        if (isPlaybookRunRHSOpen(state)) {
            return;
        }

        // Antimatter: the panel opens when asked to (a link to the run, a click on its card in the chat), never just
        // because the channel has a run: switching channels doesn't open apps.
        if (forceRHSOpen) {
            //@ts-ignore thunk
            store.dispatch(toggleRHS());
        }
    };
}
