// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

// (A .tsx file: the GraphQL code generator reads the queries of the .tsx files.)

import {graphql} from 'src/graphql/generated';

// What the full page's left sidebar listed: your runs in progress and your playbooks, favourites first. The app's
// lists refresh it after a change (useLHSRefresh).
export const playbookLHSQueryDocument = graphql(/* GraphQL */`
    query PlaybookLHS($userID: String!, $teamID: String!, $types: [PlaybookRunType!]) {
        runs (participantOrFollowerID: $userID, teamID: $teamID, sort: "name", statuses: ["InProgress"], types: $types){
            edges {
                node {
                    id
                    name
                    isFavorite
                    playbookID
                    ownerUserID
                    participantIDs
                    followers
                    type
                }
            }
        }
        playbooks (teamID: $teamID, withMembershipOnly: true) {
            id
            title
            isFavorite
            public
        }
    }
`);
