// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useIntl} from 'react-intl';
import styled from 'styled-components';
import {useQuery} from '@apollo/client';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {PlaybookRunType} from 'src/graphql/generated/graphql';
import {ReservedCategory, useCanCreatePlaybooksInTeam, useReservedCategoryTitleMapper} from 'src/hooks';
import {selectHasOverdueTasks} from 'src/selectors';
import {displayPlaybookCreateModal} from 'src/actions';
import {pluginUrl} from 'src/browser_routing';
import {useImportPlaybook} from 'src/components/backstage/import_playbook';
import {LHSPlaybookDotMenu} from 'src/components/backstage/lhs_playbook_dot_menu';
import {LHSRunDotMenu} from 'src/components/backstage/lhs_run_dot_menu';
import FusionIcon, {FusionIconName} from 'src/components/fusion/icon';
import {APP_COLOR, FUSION} from 'src/components/fusion/web_ui';

import {PanelTitle, usePanelHistory} from './panel_title';
import {playbookLHSQueryDocument} from './browse_query';

const pollInterval = 60000; // Poll every minute for updates, while the window has the focus

const useBrowseData = (teamID: string) => {
    const {data, startPolling, stopPolling} = useQuery(playbookLHSQueryDocument, {
        variables: {
            userID: 'me',
            teamID,
            types: [PlaybookRunType.Playbook, PlaybookRunType.ChannelChecklist],
        },
        fetchPolicy: 'cache-and-network',
        skip: !teamID,
    });

    useEffect(() => {
        const focus = () => startPolling(pollInterval);
        const blur = () => stopPolling();
        window.addEventListener('focus', focus);
        window.addEventListener('blur', blur);
        return () => {
            window.removeEventListener('focus', focus);
            window.removeEventListener('blur', blur);
        };
    }, [startPolling, stopPolling]);

    return {
        runs: data?.runs.edges.map((edge) => edge.node) ?? [],
        playbooks: data?.playbooks ?? [],
        ready: Boolean(data),
    };
};

const ICON_SIZE = 18;
const MENU_ICON_COLOR = 'var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56))';

// A row's icon: one of Fusion's line icons (Compass's under the classic UI).
const rowIcon = (name: FusionIconName) => (
    <FusionIcon
        name={name}
        size={ICON_SIZE}
    />
);

/**
 * PanelBrowse lists what you can reach in Playbooks, as the full page's left sidebar did: all runs, all playbooks and
 * your tasks, then your favourites, your runs in progress and your playbooks.
 */
const PanelBrowse = () => {
    const {formatMessage} = useIntl();
    const dispatch = useAppDispatch();
    const history = usePanelHistory();
    const teamID = useAppSelector(getCurrentTeamId);
    const canCreatePlaybooks = useCanCreatePlaybooksInTeam(teamID);
    const hasOverdueTasks = useAppSelector(selectHasOverdueTasks);
    const categoryTitle = useReservedCategoryTitleMapper();
    const {runs, playbooks, ready} = useBrowseData(teamID);
    const [fileInputRef, importPlaybookInput] = useImportPlaybook(teamID, (id: string) => history.push(pluginUrl(`/playbooks/${id}/outline`)));

    const open = (path: string) => () => history.push(pluginUrl(path));

    const hasViewerAccessToPlaybook = (playbookId: string) => playbooks.some((pb) => pb.id === playbookId);

    const runRow = (run: typeof runs[number]) => (
        <BrowseRow
            key={run.id}
            testId='playbooks-browse-run'
            icon={rowIcon(run.type === PlaybookRunType.Playbook ? 'runbook' : 'checkbox')}
            title={run.name}
            onOpen={open(`/runs/${run.id}?from=playbooks_lhs`)}
            menu={(
                <LHSRunDotMenu
                    playbookRunId={run.id}
                    isFavorite={run.isFavorite}
                    ownerUserId={run.ownerUserID}
                    participantIDs={run.participantIDs}
                    followerIDs={run.followers}
                    hasPermanentViewerAccess={hasViewerAccessToPlaybook(run.playbookID)}
                    iconColor={MENU_ICON_COLOR}
                />
            )}
        />
    );

    const playbookRow = (pb: typeof playbooks[number]) => (
        <BrowseRow
            key={pb.id}
            testId='playbooks-browse-playbook'
            icon={rowIcon(pb.public ? 'playbook' : 'lock')}
            title={pb.title}
            onOpen={open(`/playbooks/${pb.id}`)}
            menu={(
                <LHSPlaybookDotMenu
                    playbookId={pb.id}
                    isFavorite={pb.isFavorite}
                    iconColor={MENU_ICON_COLOR}
                />
            )}
        />
    );

    const favoriteRows = [
        ...playbooks.filter((pb) => pb.isFavorite).map(playbookRow),
        ...runs.filter((run) => run.isFavorite).map(runRow),
    ];
    const runRows = runs.filter((run) => !run.isFavorite).map(runRow);
    const playbookRows = playbooks.filter((pb) => !pb.isFavorite).map(playbookRow);

    return (
        <>
            {/* product name; don't translate */}
            {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
            <PanelTitle title={'Playbooks'}/>
            <Panel
                className='am-app-panel'
                data-testid='playbooks-browse'
            >
                <BrowseRow
                    testId='playbooks-browse-all-runs'
                    icon={rowIcon('runbook')}
                    title={formatMessage({defaultMessage: 'All runs', description: 'Playbooks side panel: opens the list of every run and checklist the user can see in the community.'})}
                    onOpen={open('/runs')}
                />
                <BrowseRow
                    testId='playbooks-browse-all-playbooks'
                    icon={rowIcon('playbook')}
                    title={formatMessage({defaultMessage: 'All playbooks', description: 'Playbooks side panel: opens the list of every playbook the user can see in the community, with the templates to start a new one.'})}
                    onOpen={open('/playbooks')}
                />
                <BrowseRow
                    testId='playbooks-browse-tasks'
                    icon={rowIcon('inbox')}
                    title={formatMessage({defaultMessage: 'Your tasks'})}
                    onOpen={open('/tasks')}
                    trailing={hasOverdueTasks ? (
                        <OverdueDot
                            aria-label={formatMessage({defaultMessage: 'Some of your tasks are overdue', description: 'Playbooks side panel: what a red dot next to "Your tasks" means.'})}
                            title={formatMessage({defaultMessage: 'Some of your tasks are overdue', description: 'Playbooks side panel: what a red dot next to "Your tasks" means.'})}
                        />
                    ) : undefined}
                />

                {favoriteRows.length > 0 && (
                    <>
                        <Heading className='am-app-h'>{categoryTitle(ReservedCategory.Favorite)}</Heading>
                        {favoriteRows}
                    </>
                )}

                <Heading className='am-app-h'>{categoryTitle(ReservedCategory.Runs)}</Heading>
                {runRows}
                {ready && runRows.length === 0 && favoriteRows.length === 0 && (
                    <Empty data-testid='playbooks-browse-no-runs'>
                        {formatMessage({defaultMessage: 'You have no runs in progress.', description: 'Playbooks side panel: shown under the runs heading when the user takes part in no run in progress.'})}
                    </Empty>
                )}

                <Heading className='am-app-h'>
                    {categoryTitle(ReservedCategory.Playbooks)}
                    <span className='am-grow'/>
                    {canCreatePlaybooks && (
                        <>
                            <HeadingButton
                                type='button'
                                onClick={() => fileInputRef.current?.click()}
                                data-testid='playbooks-browse-import'
                            >
                                {formatMessage({defaultMessage: 'Import', description: 'Playbooks side panel: imports a playbook from an exported file.'})}
                            </HeadingButton>
                            <HeadingButton
                                type='button'
                                onClick={() => dispatch(displayPlaybookCreateModal({}))}
                                data-testid='playbooks-browse-create'
                                aria-label={formatMessage({defaultMessage: 'Create playbook'})}
                                title={formatMessage({defaultMessage: 'Create playbook'})}
                            >
                                <FusionIcon
                                    name='plus'
                                    size='sm'
                                />
                            </HeadingButton>
                        </>
                    )}
                </Heading>
                {importPlaybookInput}
                {playbookRows}
                {ready && playbooks.length === 0 && (
                    <Empty data-testid='playbooks-browse-no-playbooks'>
                        {formatMessage({defaultMessage: 'You aren’t a member of any playbook yet.', description: 'Playbooks side panel: shown under the playbooks heading when the user is a member of no playbook.'})}
                    </Empty>
                )}
            </Panel>
        </>
    );
};

type RowProps = {
    icon: React.ReactNode;
    title: string;
    onOpen: () => void;
    menu?: React.ReactNode;
    trailing?: React.ReactNode;
    testId: string;
};

// BrowseRow is one line of the list: it opens its view; its menu (favourite, copy link, leave...) stays apart.
const BrowseRow = ({icon, title, onOpen, menu, trailing, testId}: RowProps) => (
    <Row
        className='am-app-row'
        role='link'
        tabIndex={0}
        data-testid={testId}
        onClick={onOpen}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
            }
        }}
    >
        <RowIcon>{icon}</RowIcon>
        <b>{title}</b>
        <RowTrailing
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {trailing}
            {menu}
        </RowTrailing>
    </Row>
);

// The Fusion UI styles .am-app-panel, .am-app-h and .am-app-row; these are the classic UI's look for them.
const Panel = styled.div`
    display: grid;
    align-content: start;
    padding: 10px 12px 16px;
    gap: 6px;
`;

const Heading = styled.h4`
    display: flex;
    align-items: center;
    margin: 10px 2px 0;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 11px;
    font-weight: 700;
    gap: 8px;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    .am-grow {
        flex: 1;
    }
`;

const HeadingButton = styled.button`
    display: inline-flex;
    height: 24px;
    align-items: center;
    padding: 0 6px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--button-bg);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    &:hover {
        background: rgba(var(--button-bg-rgb), 0.08);
    }
`;

const Row = styled.div`
    display: grid;
    width: 100%;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(var(--center-channel-color-rgb), 0.04);
    cursor: pointer;
    gap: 10px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    text-align: left;

    &:hover,
    &:focus-visible {
        background: rgba(var(--center-channel-color-rgb), 0.08);
    }

    b {
        overflow: hidden;
        font-size: 13.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const RowIcon = styled.span`
    display: flex;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));

    /* As the other apps' rows in the Fusion UI: the icon in the app's colour. */
    ${FUSION} & {
        color: ${APP_COLOR};
    }
`;

const RowTrailing = styled.span`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const OverdueDot = styled.span`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--am-danger, var(--dnd-indicator));
`;

const Empty = styled.div`
    padding: 4px 2px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 13px;
`;

export default PanelBrowse;
