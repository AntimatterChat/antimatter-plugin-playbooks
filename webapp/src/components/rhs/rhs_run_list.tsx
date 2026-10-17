// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo, useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import styled from 'styled-components';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import Scrollbars from 'react-custom-scrollbars';
import {DateTime} from 'luxon';
import {debounce} from 'lodash';
import {getCurrentChannel, getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/common';

import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {useUpdateRun} from 'src/graphql/hooks';
import {createPlaybookRun} from 'src/client';
import {HamburgerButton} from 'src/components/assets/icons/three_dots_icon';
import {openPlaybookRunModal, openUpdateRunChannelModal} from 'src/actions';
import Profile from 'src/components/profile/profile';
import DotMenu, {DotMenuButton, DropdownMenuItem, TitleButton} from 'src/components/dot_menu';
import {TertiaryButton} from 'src/components/assets/buttons';
import {RHSTitleRemoteRender} from 'src/rhs_title_remote_render';
import EmptyState from 'src/components/fusion/empty_state';
import FusionIcon from 'src/components/fusion/icon';
import Tip from 'src/components/fusion/tip';
import {FUSION} from 'src/components/fusion/web_ui';
import LoadingSpinner from 'src/components/assets/loading_spinner';
import PlaybooksProductIcon from 'src/components/assets/icons/playbooks_product_icon';
import {navigateToPluginUrl} from 'src/browser_routing';
import {useToaster} from 'src/components/backstage/toast_banner';
import {ToastStyle} from 'src/components/backstage/toast';

import {PlaybookRunType, RunStatus} from 'src/graphql/generated/graphql';
import {useTextOverflow} from 'src/hooks';
import {RunPermissionFields, useCanModifyRun} from 'src/hooks/run_permissions';

import {UserList} from './rhs_participants';
import {RHSTitleText} from './rhs_title_common';

interface PlaybookToDisplay {
    title: string
}

interface RunToDisplay {
    id: string
    name: string
    participantIDs: string[]
    ownerUserID: string
    playbookID: string
    playbook?: Maybe<PlaybookToDisplay>
    numTasksClosed: number
    numTasks: number
    lastUpdatedAt: number
    type: PlaybookRunType
    currentStatus: RunStatus
    channelID: string
    teamID: string
}

export enum FilterType {
    InProgress,
    Finished,
}

export interface RunListOptions {
    sort: string
    direction: string
    filter: FilterType
}

interface Props {
    runs: RunToDisplay[];
    onSelectRun: (runID: string) => void;
    onRunCreated: (runID: string, channelId: string, statsData: object) => void;
    getMore: () => Promise<any>;
    hasMore: boolean;

    options: RunListOptions;
    setOptions: React.Dispatch<React.SetStateAction<RunListOptions>>;
    numInProgress: number;
    numFinished: number;
}

const RHSRunList = (props: Props) => {
    const {formatMessage} = useIntl();
    const dispatch = useAppDispatch();
    const currentTeamId = useAppSelector(getCurrentTeamId);
    const currentChannelId = useAppSelector(getCurrentChannelId);
    const currentUserId = useAppSelector(getCurrentUserId);
    const [loadingMore, setLoadingMore] = useState(false);
    const debouncedSetLoadingMore = useMemo(() => debounce(setLoadingMore, 100), [setLoadingMore]);
    const getMore = async () => {
        debouncedSetLoadingMore(true);
        await props.getMore();
        debouncedSetLoadingMore(false);
    };
    const currentChannel = useAppSelector(getCurrentChannel);
    const currentChannelName = currentChannel?.display_name;
    const filterMenuTitleText = props.options.filter === FilterType.InProgress ? formatMessage({defaultMessage: 'In progress'}) : formatMessage({defaultMessage: 'Finished'});
    const showNoRuns = props.runs.length === 0;

    const handleStartRun = () => {
        dispatch(openPlaybookRunModal({
            onRunCreated: props.onRunCreated,
            triggerChannelId: currentChannelId,
            teamId: currentTeamId,
        }));
    };

    const handleCreateBlankChecklist = async () => {
        try {
            const newRun = await createPlaybookRun(
                '', // No playbook ID for blank checklist
                currentUserId,
                currentTeamId,
                formatMessage({defaultMessage: 'Untitled checklist'}),
                '',
                currentChannelId,
                undefined
            );

            // Call the onRunCreated callback with the new run
            // Pass a flag to indicate we should auto-add a task
            props.onRunCreated(newRun.id, newRun.channel_id, {
                playbookId: '',
                channelMode: 'link_existing_channel',
                hasPlaybookChanged: false,
                hasNameChanged: false,
                hasSummaryChanged: false,
                hasChannelModeChanged: false,
                hasChannelIdChanged: false,
                autoAddTask: true,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to create blank checklist:', error);
        }
    };

    // The panel's list of everything in Playbooks: all runs, all playbooks, your tasks (the full page's sidebar).
    const handleGoToPlaybooks = () => {
        navigateToPluginUrl('/browse');
    };
    const browseLabel = formatMessage({defaultMessage: 'Browse runs, playbooks and tasks', description: 'Playbooks side panel: the title bar button that opens the list of all runs, all playbooks and the user\'s tasks.'});

    return (
        <>
            <RHSTitleRemoteRender>
                <TitleContainer>
                    <PlaybooksProductIcon
                        size={24}
                        colored={true}
                    />
                    <RHSTitleText>
                        {/* product name; don't translate */}
                        {/* eslint-disable-next-line formatjs/no-literal-string-in-jsx */}
                        {'Playbooks'}
                    </RHSTitleText>
                    <VerticalLine/>
                    <ChannelNameText>
                        {currentChannelName}
                    </ChannelNameText>
                    <Tip
                        id='playbooks-browse-button'
                        title={browseLabel}
                    >
                        <BrowseButton
                            type='button'
                            onClick={handleGoToPlaybooks}
                            aria-label={browseLabel}
                            data-testid='playbooks-browse-button'
                        >
                            <FusionIcon
                                name='apps'
                                size={18}
                            />
                        </BrowseButton>
                    </Tip>
                </TitleContainer>
            </RHSTitleRemoteRender>
            <Container>
                {(
                    <Header>
                        <DotMenu
                            dotMenuButton={TitleButton}
                            placement='bottom-start'
                            icon={
                                <FilterMenuTitle data-testid='rhs-runs-filter-menu'>
                                    {filterMenuTitleText}
                                    <FusionIcon
                                        name='chev'
                                        size='sm'
                                        className='icon-chevron-down'
                                    />
                                </FilterMenuTitle>
                            }
                        >
                            <FilterMenuItem
                                onClick={() => props.setOptions((oldOptions) => ({...oldOptions, filter: FilterType.InProgress}))}
                            >
                                {formatMessage({defaultMessage: 'In progress'})}
                                <FilterMenuNumericValue>
                                    {props.numInProgress}
                                </FilterMenuNumericValue>
                            </FilterMenuItem>
                            <FilterMenuItem
                                onClick={() => props.setOptions((oldOptions) => ({...oldOptions, filter: FilterType.Finished}))}
                            >
                                {formatMessage({defaultMessage: 'Finished'})}
                                <FilterMenuNumericValue>
                                    {props.numFinished}
                                </FilterMenuNumericValue>
                            </FilterMenuItem>
                        </DotMenu>
                        <Spacer/>
                        <SegmentedButtonContainer>
                            <PrimaryActionButton
                                onClick={handleCreateBlankChecklist}
                                data-testid='create-blank-checklist'
                            >
                                <FusionIcon
                                    name='plus'
                                    size='sm'
                                />
                                {formatMessage({defaultMessage: 'New checklist'})}
                            </PrimaryActionButton>
                            <DotMenu
                                dotMenuButton={DropdownTriggerButton}
                                placement='bottom-start'
                                icon={(
                                    <FusionIcon
                                        name='chev'
                                        size='sm'
                                        className='icon-chevron-down'
                                    />
                                )}
                            >
                                <CreateChecklistMenuItem
                                    onClick={handleStartRun}
                                    data-testid='create-from-playbook'
                                >
                                    <MenuItemIcon>
                                        <FusionIcon
                                            name='runbook'
                                            size={18}
                                        />
                                    </MenuItemIcon>
                                    <FormattedMessage defaultMessage='Run a playbook'/>
                                </CreateChecklistMenuItem>
                                <Separator/>
                                <CreateChecklistMenuItem
                                    onClick={handleGoToPlaybooks}
                                    data-testid='go-to-playbooks'
                                >
                                    <MenuItemIcon>
                                        <FusionIcon
                                            name='playbook'
                                            size={18}
                                        />
                                    </MenuItemIcon>
                                    <FormattedMessage defaultMessage='Go to Playbooks'/>
                                </CreateChecklistMenuItem>
                            </DotMenu>
                        </SegmentedButtonContainer>
                        <DotMenu
                            dotMenuButton={SortDotMenuButton}
                            placement='bottom-start'
                            icon={(
                                <FusionIcon
                                    name='rank'
                                    size={18}
                                />
                            )}
                        >
                            <SortMenuTitle>{formatMessage({defaultMessage: 'Sort by'})}</SortMenuTitle>
                            <SortMenuItem
                                label={formatMessage({defaultMessage: 'Recently created'})}
                                sortItem={'create_at'}
                                sortDirection={'DESC'}
                                options={props.options}
                                setOptions={props.setOptions}
                            />
                            <SortMenuItem
                                label={formatMessage({defaultMessage: 'Last status update'})}
                                sortItem={'last_status_update_at'}
                                sortDirection={'DESC'}
                                options={props.options}
                                setOptions={props.setOptions}
                            />
                            <SortMenuItem
                                label={formatMessage({defaultMessage: 'Alphabetically'})}
                                sortItem={'name'}
                                sortDirection={'ASC'}
                                options={props.options}
                                setOptions={props.setOptions}
                            />
                        </DotMenu>
                    </Header>
                )}
                {showNoRuns &&
                    <NoRunsWrapper>
                        <NoRuns
                            active={props.options.filter === FilterType.InProgress}
                            numInProgress={props.numInProgress}
                            numFinished={props.numFinished}
                            setOptions={props.setOptions}
                            onCreateChecklistClicked={handleCreateBlankChecklist}
                        />
                    </NoRunsWrapper>
                }
                {!showNoRuns &&
                    <Scrollbars
                        autoHide={true}
                        autoHideTimeout={500}
                        autoHideDuration={500}
                    >
                        <RunsList data-testid='rhs-runs-list'>
                            {props.runs.map((run: RunToDisplay) => (
                                <RHSRunListCard
                                    key={run.id}
                                    onClick={() => props.onSelectRun(run.id)}
                                    {...run}
                                />
                            ))}
                            {props.hasMore && !loadingMore &&
                                <TertiaryButton
                                    onClick={getMore}
                                >
                                    {formatMessage({defaultMessage: 'Show more'})}
                                </TertiaryButton>
                            }
                            {loadingMore &&
                                <StyledLoadingSpinner/>
                            }
                        </RunsList>
                    </Scrollbars>
                }
            </Container>
        </>
    );
};

const Container = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    gap: 4px;
`;

const RunsList = styled.div`
    display: flex;
    min-height: calc(100% - 65px);
    flex-direction: column;
    padding: 0 16px;
    gap: 12px;
`;
const NoRunsWrapper = styled.div`
    display: flex;
    min-height: calc(100% - 123px);
`;

const FilterMenuTitle = styled.div`
    display: flex;
    align-items: center;
    font-family: var(--am-font-display, Metropolis), sans-serif;
    font-size: 16px;
    font-weight: 600;
    gap: 4px;
    line-height: 24px;

    ${FUSION} & {
        font-size: 15px;
    }
`;

const Spacer = styled.div`
    flex-grow: 1;
`;

const StyledLoadingSpinner = styled(LoadingSpinner)`
    width: 20px;
    height: 20px;
    align-self: center;
    margin-top: 12px;
`;

const TitleContainer = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const BrowseButton = styled.button`
    display: flex;
    width: 32px;
    height: 32px;
    flex: none;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    margin-left: auto;
    background: none;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
        color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
    }

    /* The title bar's icon buttons in the Fusion UI (.sidebar--right__header .btn-icon). */
    ${FUSION} & {
        border-radius: 8px;
        color: var(--am-muted);
    }

    ${FUSION} &:hover {
        background: var(--am-hover);
        color: var(--am-text);
    }
`;

const VerticalLine = styled.div`
    height: 24px;
    border-left: 1px solid var(--center-channel-color);
    opacity: 0.16;

    /* Fusion's dividers: its line colour, opaque. */
    ${FUSION} & {
        border-left-color: var(--am-line);
        opacity: 1;
    }
`;

const ChannelNameText = styled.div`
    overflow: hidden;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-family: var(--am-font-ui, "Open Sans"), sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
    text-overflow: ellipsis;
`;

const SegmentedButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 32px;
    border-radius: 4px;
`;

const PrimaryActionButton = styled.button`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px 12px;
    border: 0;
    background: rgba(var(--button-bg-rgb), 0.08);
    color: var(--button-bg);
    font-size: 12px;
    font-weight: 600;
    gap: 4px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-right: 1px solid rgba(var(--button-bg-rgb), 0.16);
    cursor: pointer;
    height: 100%;

    &:hover {
        background: rgba(var(--button-bg-rgb), 0.12);
    }

    &:active {
        background: rgba(var(--button-bg-rgb), 0.16);
    }

    /* Fusion's soft accent buttons (the selected tools of its toolbars). */
    ${FUSION} & {
        border-right-color: color-mix(in srgb, var(--am-matter) 24%, transparent);
        background: var(--am-matter-soft);
        border-bottom-left-radius: 8px;
        border-top-left-radius: 8px;
        color: var(--am-matter);
        font-family: var(--am-font-ui), sans-serif;
        font-size: 12.5px;
    }

    ${FUSION} &:hover {
        background: color-mix(in srgb, var(--am-matter) 26%, transparent);
    }
`;

const DropdownTriggerButton = styled(TitleButton)`
    && {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 2px;
        width: 24px;
        height: 100%;
        border-radius: 0 4px 4px 0;
        background: rgba(var(--button-bg-rgb), 0.08);
        color: var(--button-bg);
        font-size: 12px;

        &:hover {
            background: rgba(var(--button-bg-rgb), 0.12);
        }

        &:active {
            background: rgba(var(--button-bg-rgb), 0.16);
        }

        i {
            font-size: 18px;
        }
    }

    ${FUSION} && {
        border-radius: 0 8px 8px 0;
        background: var(--am-matter-soft);
        color: var(--am-matter);
    }

    ${FUSION} &&:hover {
        background: color-mix(in srgb, var(--am-matter) 26%, transparent);
    }
`;

const CreateChecklistMenuItem = styled(DropdownMenuItem)`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    min-height: 40px;
`;

const MenuItemIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    flex-shrink: 0;
    width: 24px;

    i {
        font-size: 18px;
    }
`;

const SortDotMenuButton = styled(DotMenuButton)`
    align-items: center;
    justify-content: center;
`;

const SortMenuTitle = styled.div`
    margin: 5px 18px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    text-transform: uppercase;

    /* Fusion's menu headings. */
    ${FUSION} & {
        margin: 4px 10px 6px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.07em;
    }
`;

const FilterMenuItem = styled(DropdownMenuItem)`
    display: flex;
    min-width: 182px;
    flex-direction: row;
    justify-content: space-between;
`;

const StyledDropdownMenuSort = styled(DropdownMenuItem)`
    display: flex;
    min-width: 190px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

interface SortMenuItemProps {
    label: string
    sortItem: string
    sortDirection: string
    options: RunListOptions
    setOptions: React.Dispatch<React.SetStateAction<RunListOptions>>
}

const SortMenuItem = (props: SortMenuItemProps) => {
    return (
        <StyledDropdownMenuSort
            onClick={() => props.setOptions((oldOptions) => ({...oldOptions, sort: props.sortItem, direction: props.sortDirection}))}
        >
            {props.label}
            {props.sortItem === props.options.sort &&
                <BlueCheckmark/>
            }
        </StyledDropdownMenuSort>
    );
};

const FilterMenuNumericValue = styled.div`
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
`;

const BlueCheckmark = () => (
    <Checkmark>
        <FusionIcon
            name='check'
            size={18}
        />
    </Checkmark>
);

const Checkmark = styled.span`
    display: flex;
    color: var(--am-matter, var(--button-bg));
`;

interface RHSRunListCardProps extends RunToDisplay {
    onClick: () => void;
}

const RHSRunListCard = (props: RHSRunListCardProps) => {
    const {formatMessage} = useIntl();
    const [removed, setRemoved] = useState(false);
    const {add: addToastMessage} = useToaster();
    const currentUserId = useAppSelector(getCurrentUserId);
    const titleRef = useRef<HTMLDivElement>(null);
    const isTitleOverflowing = useTextOverflow(titleRef);

    // Create a minimal run object with only the fields needed for permission checking
    const runForPermissions: RunPermissionFields = {
        type: props.type,
        channel_id: props.channelID,
        team_id: props.teamID,
        owner_user_id: props.ownerUserID,
        participant_ids: props.participantIDs,
        current_status: props.currentStatus,
    };

    const canEditRun = useCanModifyRun(runForPermissions, currentUserId);

    const participatIDsWithoutOwner = props.participantIDs.filter((id) => id !== props.ownerUserID);
    const [movedChannel, setMovedChannel] = useState({channelId: '', channelName: ''});
    const updateRun = useUpdateRun(props.id);
    const isPlaybookRun = props.type === PlaybookRunType.Playbook;
    const icon = (
        <FusionIcon
            name={isPlaybookRun ? 'runbook' : 'checkbox'}
            size={20}
        />
    );

    return (
        <CardWrapper
            progress={(props.numTasksClosed / props.numTasks) * 100}
            className={removed ? 'removed' : ''}
            onAnimationEnd={() => {
                if (!movedChannel.channelId) {
                    return;
                }
                updateRun({channelID: movedChannel.channelId});
                addToastMessage({
                    content: isPlaybookRun ? formatMessage({defaultMessage: 'Run moved to {channel}'}, {channel: movedChannel.channelName}) : formatMessage({defaultMessage: 'Checklist moved to {channel}'}, {channel: movedChannel.channelName}),
                    toastStyle: ToastStyle.Success,
                });
            }}
        >
            <CardContainer
                onClick={props.onClick}
                data-testid='run-list-card'
            >
                <CardTitleContainer>
                    <IconWrapper $margin='6px'>
                        {icon}
                    </IconWrapper>
                    {isTitleOverflowing ? (
                        <Tip
                            id={`run-title-tooltip-${props.id}`}
                            title={props.name}
                        >
                            <TitleRow ref={titleRef}>{props.name}</TitleRow>
                        </Tip>
                    ) : (
                        <TitleRow ref={titleRef}>{props.name}</TitleRow>
                    )}
                    <Spacer/>
                    <ContextMenu
                        runType={props.type}
                        playbookID={props.playbookID}
                        playbookTitle={props.playbook?.title || ''}
                        playbookRunID={props.id}
                        teamID={props.teamID}
                        canSeePlaybook={Boolean(props.playbook?.title)}
                        canEditRun={canEditRun}
                        onClick={props.onClick}
                        onUpdateName={(newName) => {
                            updateRun({name: newName});
                        }}
                        onUpdateChannel={(newChannelId: string, newChannelName: string) => {
                            setRemoved(true);
                            setMovedChannel({
                                channelId: newChannelId,
                                channelName: newChannelName,
                            });
                        }}
                    />
                </CardTitleContainer>
                {isPlaybookRun &&
                    <PeopleRow>
                        <OwnerProfileChip userId={props.ownerUserID}/>
                        <ParticipantsProfiles>
                            <UserList
                                userIds={participatIDsWithoutOwner}
                                sizeInPx={20}
                            />
                        </ParticipantsProfiles>
                    </PeopleRow>
                }
                {!isPlaybookRun && props.numTasks > 0 &&
                    <TasksDone>
                        <TasksDoneNumbers>
                            {/* eslint-disable formatjs/no-literal-string-in-jsx */}
                            {props.numTasksClosed + '/' + props.numTasks}
                        </TasksDoneNumbers>
                        <TasksDoneText>
                            {formatMessage({defaultMessage: 'tasks done'})}
                        </TasksDoneText>
                    </TasksDone>
                }
                <InfoRow>
                    <LastUpdatedText>
                        {formatMessage(
                            {defaultMessage: 'Last updated {time}'},
                            {time: DateTime.fromMillis(props.lastUpdatedAt).toRelative()}
                        )}
                    </LastUpdatedText>
                    {props.playbook && isPlaybookRun &&
                        <Tip
                            id={`playbook-chip-${props.id}`}
                            title={formatMessage(
                                {defaultMessage: 'Checklist created from {playbook} playbook'},
                                {playbook: props.playbook.title}
                            )}
                        >
                            <PlaybookChip>
                                <FusionIcon
                                    name='playbook'
                                    size={12}
                                />
                                <PlaybookChipText>{props.playbook.title}</PlaybookChipText>
                            </PlaybookChip>
                        </Tip>
                    }
                </InfoRow>
            </CardContainer>
        </CardWrapper>
    );
};
const CardWrapper = styled.div<{ progress: number }>`
    position: relative;
    padding:0;
    border-radius: 4px;
    margin: 0;

    &::after {
        position: absolute;
        right: calc(${({progress}) => 100 - progress}% + 1px);
        bottom: 1px;
        left: 1px;
        display: block;
        border-bottom: 2px solid var(--am-ok, var(--online-indicator));
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: ${({progress}) => (progress < 100 ? 0 : 'inherit')};
        content: ''
    }

    ${FUSION} & {
        border-radius: 10px;
    }

    &.removed {
        animation: disapear 0.7s;
        animation-fill-mode: forwards;
    }

    @keyframes disapear{
        35% {
            transform: translateY(5%);
        }

        100% {
            transform: translateY(-1000%);
        }
    }
`;

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px 20px 20px;
    border: 1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.08));
    border-radius: 4px;
    box-shadow: 0 2px 3px 0 rgba(0 0 0 / 0.08);
    cursor: pointer;
    gap: 8px;

    &:hover {
        box-shadow: 0 4px 6px 0 rgba(0 0 0 / 0.12);
    }

    &:active {
        box-shadow: inset 0 2px 3px rgba(0 0 0 / 0.08);
    }

    /* A row of the Fusion UI's app panels (.am-app-row): flat, on the side surface. */
    ${FUSION} & {
        padding: 12px 14px 14px;
        border-color: var(--am-line);
        border-radius: 10px;
        background: var(--am-side);
        box-shadow: none;
    }

    ${FUSION} &:hover {
        background: var(--am-raise);
        box-shadow: none;
    }
`;
const CardTitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

`;
const TitleRow = styled.div`
    overflow: hidden;
    color: var(--am-text, inherit);
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;
const PeopleRow = styled.div`
    display: flex;
    flex-direction: row;
    gap: 4px;
`;
const InfoRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;
const LastUpdatedText = styled.div`
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));
    font-size: 11px;
    font-weight: 400;
    line-height: 16px;
`;
const PlaybookChip = styled.div`
    display: flex;
    max-width: 40%;
    flex-direction: row;
    align-items: center;
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(var(--center-channel-color-rgb), 0.08);
    color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
    gap: 4px;

    ${FUSION} & {
        padding: 1px 7px;
        border-radius: 10px;
        background: var(--am-raise-2);
    }
`;
const PlaybookChipText = styled.span`
    overflow: hidden;
    color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const OwnerProfileChip = styled(Profile)`
    flex-grow: 0;
    padding: 2px 10px 2px 2px;
    border-radius: 12px;
    background: var(--am-raise-2, rgba(var(--center-channel-color-rgb), 0.08));
    font-size: 11px;
    font-weight: 400;
    line-height: 15px;

    > .image {
        width: 16px;
        height: 16px;
    }
`;
const ParticipantsProfiles = styled.div`
    display: flex;
    flex-direction: row;
`;

const ThreeDotsIcon = styled(HamburgerButton)`
    margin-left: 1px;
    font-size: 18px;
`;

const StyledDotMenuButton = styled(DotMenuButton)`
    width: 28px;
    height: 28px;
`;

const StyledDropdownMenuItem = styled(DropdownMenuItem)`
    display: flex;
    align-items: center;
`;

const Separator = styled.hr`
    display: flex;
    width: 100%;
    align-content: center;
    border-top: 1px solid var(--am-line, var(--center-channel-color-08));
    margin: 5px auto;
`;

const IconWrapper = styled.div<{$margin?: string}>`
    display: flex;
    align-items: center;
    margin-right: ${({$margin}) => ($margin || '11px')};
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));

    svg {
        vertical-align: middle;
    }
`;

interface NoRunsProps {
    active: boolean
    numInProgress: number;
    numFinished: number;
    onCreateChecklistClicked: () => void;
    setOptions: React.Dispatch<React.SetStateAction<RunListOptions>>
}

// NoRuns is what the list shows when the filter leaves nothing: a Fusion empty state, with the other filter's runs
// one click away when there are some.
export const NoRuns = (props: NoRunsProps) => {
    const {formatMessage} = useIntl();

    let title = formatMessage({
        defaultMessage: 'No checklists in this channel yet',
        description: 'Playbooks side panel: the title shown when a channel has no checklist or run at all.',
    });
    let text = formatMessage({
        defaultMessage: 'Start a checklist to track tasks here, or run a playbook.',
        description: 'Playbooks side panel: the text under the title shown when a channel has no checklist or run at all.',
    });

    // DM/GM channels now support checklists, so use the same messaging
    if (props.active && props.numFinished > 0) {
        title = formatMessage({
            defaultMessage: 'Nothing in progress',
            description: 'Playbooks side panel: the title shown when a channel has only finished checklists and runs.',
        });
        text = formatMessage({
            defaultMessage: 'Every checklist in this channel is finished.',
            description: 'Playbooks side panel: the text shown when a channel has only finished checklists and runs.',
        });
    } else if (!props.active) {
        title = formatMessage({
            defaultMessage: 'Nothing finished yet',
            description: 'Playbooks side panel: the title shown in the list of finished checklists when there is none.',
        });
        text = formatMessage({
            defaultMessage: 'Finished checklists of this channel will show here.',
            description: 'Playbooks side panel: the text shown in the list of finished checklists when there is none.',
        });
    }

    let secondary;
    if (props.active && props.numFinished > 0) {
        secondary = {
            label: formatMessage({defaultMessage: 'View finished'}),
            onClick: () => props.setOptions((oldOptions) => ({...oldOptions, filter: FilterType.Finished})),
            testId: 'view-finished-runs',
        };
    } else if (!props.active && props.numInProgress > 0) {
        secondary = {
            label: formatMessage({defaultMessage: 'View in progress'}),
            onClick: () => props.setOptions((oldOptions) => ({...oldOptions, filter: FilterType.InProgress})),
            testId: 'view-in-progress-runs',
        };
    }

    return (
        <EmptyState
            data-testid='no-active-runs'
            icon='checkbox'
            title={title}
            text={text}
            fill={true}
            action={{
                label: formatMessage({defaultMessage: 'New checklist'}),
                icon: 'plus',
                onClick: props.onCreateChecklistClicked,
                testId: 'create-blank-checklist',
            }}
            secondary={secondary}
        />
    );
};

interface ContextMenuProps {
    runType: PlaybookRunType;
    playbookID?: string;
    teamID: string;
    playbookRunID: string;
    playbookTitle?: string;
    canSeePlaybook?: boolean;
    canEditRun: boolean;
    onClick: () => void;
    onUpdateChannel: (channelId: string, channelName: string) => void;
    onUpdateName: (name: string) => void;
}
const ContextMenu = (props: ContextMenuProps) => {
    const dispatch = useAppDispatch();
    const overviewURL = `/runs/${props.playbookRunID}?from=channel_rhs_dotmenu`;
    const playbookURL = props.playbookID ? `/playbooks/${props.playbookID}` : '';

    const isPlaybookRun = props.runType === PlaybookRunType.Playbook;

    return (
        <DotMenu
            dotMenuButton={StyledDotMenuButton}
            placement='bottom-start'
            icon={<ThreeDotsIcon/>}
        >
            <StyledDropdownMenuItem onClick={props.onClick}>
                <IconWrapper>
                    <FusionIcon
                        name={isPlaybookRun ? 'runbook' : 'checkbox'}
                        size={18}
                    />
                </IconWrapper>
                <FormattedMessage defaultMessage='Open'/>
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => navigateToPluginUrl(overviewURL)}>
                <IconWrapper>
                    <FusionIcon
                        name='eye'
                        size={18}
                    />
                </IconWrapper>
                <FormattedMessage defaultMessage='Go to overview'/>
            </StyledDropdownMenuItem>
            {isPlaybookRun && props.playbookID && props.canSeePlaybook && (
                <StyledDropdownMenuItem onClick={() => navigateToPluginUrl(playbookURL)}>
                    <RowContainer>
                        <ColContainer>
                            <IconWrapper>
                                <FusionIcon
                                    name='playbook'
                                    size={18}
                                />
                            </IconWrapper>
                            <FormattedMessage defaultMessage='Go to playbook'/>
                        </ColContainer>
                        <MenuItemSubTitle>{props.playbookTitle}</MenuItemSubTitle>
                    </RowContainer>
                </StyledDropdownMenuItem>
            )}
            {props.canEditRun && (
                <>
                    <Separator/>
                    <StyledDropdownMenuItem
                        onClick={() => dispatch(openUpdateRunChannelModal(props.playbookRunID, props.teamID, props.runType, props.onUpdateChannel))}
                    >
                        <IconWrapper>
                            <FusionIcon
                                name='link'
                                size={18}
                            />
                        </IconWrapper>
                        <FormattedMessage defaultMessage='Move to a different channel'/>
                    </StyledDropdownMenuItem>
                </>
            )}
        </DotMenu>
    );
};

const ColContainer = styled.div`
    display: flex;
    flex-direction: row;
`;

const RowContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const MenuItemSubTitle = styled.div`
    overflow: hidden;

    /* don't let the playbook title make context menu grow too wide */
    max-width: 220px;
    margin-left: 29px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const TasksDone = styled.div`
    display: flex;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));
    font-size: 11px;
`;

const TasksDoneNumbers = styled.div`
    margin-right: 6px;
    font-weight: 600;
`;

const TasksDoneText = styled.div`
    font-weight: 400;
`;

export default RHSRunList;
