// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {useIntl} from 'react-intl';

import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {BACKSTAGE_LIST_PER_PAGE} from 'src/constants';
import {Playbook} from 'src/types/playbook';

import {openPlaybookRunModal} from 'src/actions';
import {navigateToPluginUrl} from 'src/browser_routing';
import {useCanCreatePlaybooksInTeam, usePlaybooksCrud, usePlaybooksRouting} from 'src/hooks';
import EmptyState from 'src/components/fusion/empty_state';

import {clientHasPlaybooks} from 'src/client';
import {useLHSRefresh} from 'src/components/backstage/lhs_navigation';

const NoContentPage = () => {
    const {formatMessage} = useIntl();
    const dispatch = useAppDispatch();
    const teamId = useAppSelector(getCurrentTeamId);
    const [playbookExist, setPlaybookExist] = useState(false);
    const {setSelectedPlaybook} = usePlaybooksCrud({team_id: '', per_page: BACKSTAGE_LIST_PER_PAGE});
    const {create} = usePlaybooksRouting<Playbook>({onGo: setSelectedPlaybook});
    const canCreatePlaybooks = useCanCreatePlaybooksInTeam(teamId);
    const refreshLHS = useLHSRefresh();

    // When the component is first mounted, determine if there are any
    // playbooks at all.If yes show Run playbook else create playbook
    useEffect(() => {
        async function checkForPlaybook() {
            const returnedPlaybookExist = await clientHasPlaybooks(teamId);
            setPlaybookExist(returnedPlaybookExist);
        }
        checkForPlaybook();
    }, [teamId]);

    const handleClick = () => {
        if (playbookExist) {
            dispatch(openPlaybookRunModal({
                teamId,
                onRunCreated: (runId: string) => {
                    navigateToPluginUrl(`/runs/${runId}?from=run_modal`);
                    refreshLHS();
                },
            }));
        } else {
            create({teamId});
        }
    };

    // A Fusion empty state (it was a Mattermost illustration beside a large title).
    return (
        <EmptyState
            data-testid='runs-no-content'
            icon='runbook'
            fill={true}
            title={formatMessage({
                defaultMessage: 'No runs yet',
                description: 'Playbooks side panel: the title of the list of runs when there is none.',
            })}
            text={formatMessage({
                defaultMessage: 'Run a playbook to coordinate your team and tools, and keep a record of every step.',
                description: 'Playbooks side panel: what a run is, in the list of runs when there is none.',
            })}
            action={(canCreatePlaybooks || playbookExist) ? {
                label: playbookExist ? formatMessage({defaultMessage: 'Run playbook'}) : formatMessage({defaultMessage: 'Create playbook'}),
                icon: playbookExist ? 'runbook' : 'plus',
                onClick: handleClick,
                testId: 'runs-no-content-action',
            } : undefined}
        />
    );
};

export default NoContentPage;
