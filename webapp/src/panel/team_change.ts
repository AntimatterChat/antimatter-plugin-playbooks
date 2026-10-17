// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useUpdateEffect} from 'react-use';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {useAppSelector} from 'src/hooks/redux';

import {PANEL_HOME} from './history';
import {usePanelHistory} from './panel_title';

/**
 * useLeaveOnTeamChange takes the panel back to the channel's runs when you switch to another community while it
 * shows a run or a playbook of the one you left (the full page went back to its start page). A link that opens a run
 * of another community switches to it first: the run then belongs to the current community and stays.
 */
export function useLeaveOnTeamChange(teamId: string | undefined) {
    const history = usePanelHistory();
    const currentTeamId = useAppSelector(getCurrentTeamId);

    useUpdateEffect(() => {
        if (currentTeamId && teamId && currentTeamId !== teamId) {
            history.reset(PANEL_HOME);
        }
    }, [currentTeamId]);
}
