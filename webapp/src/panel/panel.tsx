// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useIntl} from 'react-intl';
import {Redirect, Route, Router, Switch} from 'react-router-dom';
import styled from 'styled-components';

import {useAppDispatch} from 'src/hooks/redux';

import {setRHSOpen} from 'src/actions';
import {ErrorPageTypes} from 'src/constants';
import {pluginErrorUrl} from 'src/browser_routing';
import {ToastProvider} from 'src/components/backstage/toast_banner';
import ChannelRuns from 'src/components/rhs/rhs_main';
import PlaybookRunDetails from 'src/components/backstage/playbook_runs/playbook_run/playbook_run';
import PlaybookEditor from 'src/components/backstage/playbook_editor/playbook_editor';
import PlaybookList from 'src/components/backstage/playbook_list';
import RunsPage from 'src/components/backstage/runs_page';
import TaskInbox from 'src/components/backstage/rhs/task_inbox/task_inbox';
import ErrorPage from 'src/components/error_page';

import {PANEL_BASE, PANEL_BROWSE, PANEL_HOME, PanelHistory, panelHistory} from './history';
import {PANEL_SCROLL_ID} from './constants';
import {PanelWidthProvider} from './panel_width';
import {PanelTitle} from './panel_title';
import PanelBrowse from './browse';

const ID_FORMAT = '[a-z0-9]{26}';

// The views of the panel, at the paths of the full page they replace.
export const PanelRoutes = () => {
    const {formatMessage} = useIntl();

    return (
        <Switch>
            <Route
                path={PANEL_HOME}
                exact={true}
            >
                <ChannelRuns/>
            </Route>
            <Route
                path={PANEL_BROWSE}
                exact={true}
            >
                <PanelBrowse/>
            </Route>
            <Route path={`${PANEL_BASE}/playbooks/:playbookId(${ID_FORMAT})/:tab(attributes|outline|reports)?`}>
                <PlaybookEditor/>
            </Route>
            <Route
                path={`${PANEL_BASE}/playbooks`}
                exact={true}
            >
                <PanelTitle title={formatMessage({defaultMessage: 'Playbooks'})}/>
                <PlaybookList/>
            </Route>
            <Route path={`${PANEL_BASE}/start`}>
                <PanelTitle title={formatMessage({defaultMessage: 'Playbooks'})}/>
                <PlaybookList firstTimeUserExperience={true}/>
            </Route>
            <Redirect
                from={`${PANEL_BASE}/incidents/:playbookRunId`}
                to={`${PANEL_BASE}/runs/:playbookRunId`}
            />
            <Route path={`${PANEL_BASE}/runs/:playbookRunId(${ID_FORMAT})`}>
                <PlaybookRunDetails/>
            </Route>
            <Redirect
                from={`${PANEL_BASE}/incidents`}
                to={`${PANEL_BASE}/runs`}
            />
            <Route
                path={`${PANEL_BASE}/runs`}
                exact={true}
            >
                <PanelTitle title={formatMessage({defaultMessage: 'Runs'})}/>
                <RunsPage/>
            </Route>
            <Route
                path={`${PANEL_BASE}/tasks`}
                exact={true}
            >
                <PanelTitle title={formatMessage({defaultMessage: 'Your tasks'})}/>
                <TaskInbox/>
            </Route>
            <Route path={`${PANEL_BASE}/error`}>
                <PanelTitle title={formatMessage({defaultMessage: 'Playbooks'})}/>
                <ErrorPage/>
            </Route>

            {/* The full page opened on its runs: so does a link to /playbooks. */}
            <Redirect
                exact={true}
                from={PANEL_BASE}
                to={`${PANEL_BASE}/runs`}
            />
            <Route>
                <Redirect to={pluginErrorUrl(ErrorPageTypes.DEFAULT)}/>
            </Route>
        </Switch>
    );
};

// Let the rest of the plugin know whether the panel shows (the run channel opener, the links to the panel).
const useSetRHSState = () => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(setRHSOpen(true));
        return () => {
            dispatch(setRHSOpen(false));
        };
    }, [dispatch]);
};

type Props = {
    history?: PanelHistory;
};

/**
 * PlaybooksPanel is the Playbooks app in the side panel: the channel's runs and checklists first, and every page the
 * app had as a full page (runs, a run's overview, playbooks and their editor, your tasks) as views with a back button.
 */
const PlaybooksPanel = ({history = panelHistory}: Props) => {
    useSetRHSState();

    return (
        <Router history={history}>
            <ToastProvider>
                <Root data-playbooks-panel={true}>
                    <Scroll id={PANEL_SCROLL_ID}>
                        <PanelRoutes/>
                    </Scroll>
                </Root>
            </ToastProvider>
        </Router>
    );
};

const Root = styled(PanelWidthProvider)`
    position: relative;
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    background: var(--center-channel-bg);
`;

const Scroll = styled.div`
    position: relative;
    height: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
`;

export default PlaybooksPanel;
