// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import styled from 'styled-components';

import React, {useRef, useState} from 'react';
import {useIntl} from 'react-intl';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import {CheckAllIcon, PlayOutlineIcon} from '@mattermost/compass-icons/components';

import {WithTooltip} from 'src/components/fusion/tip';
import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {useTextOverflow} from 'src/hooks';
import {useCanModifyRun} from 'src/hooks/run_permissions';
import Dropdown from 'src/components/dropdown';
import {DropdownMenu, TitleButton} from 'src/components/dot_menu';

import {useLHSRefresh} from 'src/components/backstage/lhs_navigation';
import {panelHistory} from 'src/panel/history';
import {navigateToUrl, pluginUrl} from 'src/browser_routing';
import {PlaybookRun} from 'src/types/playbook_run';
import {SemiBoldHeading} from 'src/styles/headings';
import {useManageRunMembership} from 'src/graphql/hooks';
import {useToaster} from 'src/components/backstage/toast_banner';
import {ToastStyle} from 'src/components/backstage/toast';
import {Role, Separator} from 'src/components/backstage/playbook_runs/shared';
import ConfirmModal from 'src/components/widgets/confirmation_modal';
import {PlaybookRunType} from 'src/graphql/generated/graphql';
import RunActionsModal from 'src/components/run_actions_modal';
import {hideRunActionsModal} from 'src/actions';
import {isRunActionsModalVisible} from 'src/selectors';

import {
    CopyRunLinkMenuItem,
    ExportChannelLogsMenuItem,
    FavoriteRunMenuItem,
    FinishRunMenuItem,
    LeaveRunMenuItem,
    RenameRunItem,
    RestoreRunMenuItem,
    RunActionsMenuItem,
    SaveAsPlaybookMenuItem,
    ToggleRunRetrospectiveMenuItem,
    ToggleRunStatusUpdateMenuItem,
} from './controls';

export const CONTEXT_MENU_LOCATION = {
    RHS: 'rhs',
    BACKSTAGE: 'backstage',
} as const;

export type ContextMenuLocation = typeof CONTEXT_MENU_LOCATION[keyof typeof CONTEXT_MENU_LOCATION];

interface Props {
    playbookRun: PlaybookRun;
    role: Role;
    isFavoriteRun: boolean;
    isFollowing: boolean;
    hasPermanentViewerAccess: boolean;
    toggleFavorite: () => void;
    onRenameClick: () => void;
    location?: ContextMenuLocation;
    ownerGroupOnlyActions?: boolean;
}

export const ContextMenu = ({playbookRun, hasPermanentViewerAccess, role, isFavoriteRun, isFollowing, toggleFavorite, onRenameClick, location = CONTEXT_MENU_LOCATION.BACKSTAGE, ownerGroupOnlyActions}: Props) => {
    const dispatch = useAppDispatch();
    const currentUserId = useAppSelector(getCurrentUserId);
    const {leaveRunConfirmModal, showLeaveRunConfirm} = useLeaveRun(hasPermanentViewerAccess, playbookRun.id, playbookRun.owner_user_id, isFollowing);
    const showRunActionsFromRedux = useAppSelector(isRunActionsModalVisible);
    const [showRunActionsFromMenu, setShowRunActionsFromMenu] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const titleTextRef = useRef<HTMLSpanElement>(null);
    const isTitleOverflowing = useTextOverflow(titleTextRef);

    // Show modal if either Redux state or local state is true
    const showRunActionsModal = showRunActionsFromRedux || showRunActionsFromMenu;

    const canModify = useCanModifyRun(playbookRun, currentUserId);

    const isPlaybookRun = playbookRun.type === PlaybookRunType.Playbook;
    const icon = isPlaybookRun ? <PlayOutlineIcon size={18}/> : <CheckAllIcon size={18}/>;

    const titleButton = (
        <TitleButton
            $isActive={isMenuOpen}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
            }}
            tabIndex={0}
            role='button'
            data-testid='menuButton'
        >
            <Title>
                <IconWrapper>
                    {icon}
                </IconWrapper>
                <TitleText ref={titleTextRef}>{playbookRun.name}</TitleText>
            </Title>
            <i
                className='icon icon-chevron-down'
                data-testid='runDropdown'
            />
        </TitleButton>
    );

    const menuButton = (
        <MenuButtonWrapper>
            {isTitleOverflowing ? (
                <WithTooltip
                    id={`run-title-tooltip-${playbookRun.id}`}
                    title={playbookRun.name}
                >
                    {titleButton}
                </WithTooltip>
            ) : titleButton}
        </MenuButtonWrapper>
    );

    return (
        <>
            <Dropdown
                isOpen={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                target={menuButton}
                placement='bottom-start'
            >
                <DropdownMenu
                    data-testid='dropdownmenu'
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                    }}
                >
                    <FavoriteRunMenuItem
                        isFavoriteRun={isFavoriteRun}
                        toggleFavorite={toggleFavorite}
                    />
                    <CopyRunLinkMenuItem
                        playbookRunId={playbookRun.id}
                    />
                    <RenameRunItem
                        playbookRun={playbookRun}
                        role={role}
                        onClick={onRenameClick}
                    />
                    <Separator/>
                    <RunActionsMenuItem
                        onClick={() => setShowRunActionsFromMenu(true)}
                        playbookRun={playbookRun}
                        role={role}
                    />
                    <ExportChannelLogsMenuItem
                        channelId={playbookRun.channel_id}
                    />
                    <SaveAsPlaybookMenuItem
                        playbookRun={playbookRun}
                    />
                    <FinishRunMenuItem
                        playbookRun={playbookRun}
                        role={role}
                        location={location}
                        ownerGroupOnlyActions={ownerGroupOnlyActions}
                        isOwner={playbookRun.owner_user_id === currentUserId}
                    />
                    <RestoreRunMenuItem
                        playbookRun={playbookRun}
                        role={role}
                        location={location}
                        ownerGroupOnlyActions={ownerGroupOnlyActions}
                        isOwner={playbookRun.owner_user_id === currentUserId}
                    />
                    <ToggleRunStatusUpdateMenuItem
                        playbookRun={playbookRun}
                        role={role}
                    />
                    {location !== CONTEXT_MENU_LOCATION.RHS && (
                        <ToggleRunRetrospectiveMenuItem
                            playbookRun={playbookRun}
                        />
                    )}
                    <LeaveRunMenuItem
                        isFollowing={isFollowing}
                        role={role}
                        showLeaveRunConfirm={showLeaveRunConfirm}
                    />
                </DropdownMenu>
            </Dropdown>
            <RunActionsModal
                playbookRun={playbookRun}
                readOnly={!canModify}
                show={showRunActionsModal}
                onHide={() => {
                    setShowRunActionsFromMenu(false);
                    dispatch(hideRunActionsModal());
                }}
            />
            {leaveRunConfirmModal}
        </>
    );
};

export const useLeaveRun = (hasPermanentViewerAccess: boolean, playbookRunId: string, ownerUserId: string, isFollowing: boolean) => {
    const {formatMessage} = useIntl();
    const currentUserId = useAppSelector(getCurrentUserId);
    const addToast = useToaster().add;
    const [showLeaveRunConfirm, setLeaveRunConfirm] = useState(false);
    const {removeFromRun} = useManageRunMembership(playbookRunId);
    const refreshLHS = useLHSRefresh();

    const onLeaveRun = async () => {
        removeFromRun([currentUserId])
            .then(() => {
                refreshLHS();
                addToast({
                    content: formatMessage({defaultMessage: "You've left the run."}),
                    toastStyle: ToastStyle.Success,
                });

                // The run's overview is a view of the side panel: leave it if it shows this run.
                const sameRunRDP = panelHistory.location.pathname.includes('runs/' + playbookRunId);
                if (!hasPermanentViewerAccess && sameRunRDP) {
                    navigateToUrl(pluginUrl(''));
                }
            }).catch(() => addToast({
                content: formatMessage({defaultMessage: "It wasn't possible to leave the run."}),
                toastStyle: ToastStyle.Failure,
            }));
    };
    const leaveRunConfirmModal = (
        <ConfirmModal
            show={showLeaveRunConfirm}
            title={formatMessage({defaultMessage: 'Confirm leave{isFollowing, select, true { and unfollow} other {}}'}, {isFollowing})}
            message={formatMessage({
                defaultMessage: 'When you leave{isFollowing, select, true { and unfollow a run} other { a run}}, it\'s removed from your runs in the Playbooks panel. You can find it again by viewing all runs.',
                description: 'Playbooks: confirmation shown before the user leaves a run; the Playbooks panel is the app\'s side panel, which lists the user\'s runs.',
            }, {isFollowing})}
            confirmButtonText={isFollowing ? formatMessage({defaultMessage: 'Leave and unfollow'}) : formatMessage({defaultMessage: 'Leave'})}
            onConfirm={() => {
                onLeaveRun();
                setLeaveRunConfirm(false);
            }}
            onCancel={() => setLeaveRunConfirm(false)}
            stopPropagationOnClick={true}
        />
    );

    return {
        leaveRunConfirmModal,
        showLeaveRunConfirm: () => {
            if (currentUserId === ownerUserId) {
                addToast({
                    content: formatMessage({defaultMessage: 'Assign a new owner before you leave the run.'}),
                    toastStyle: ToastStyle.Failure,
                });
                return;
            }
            setLeaveRunConfirm(true);
        },
    };
};

const Title = styled.h1`
    ${SemiBoldHeading}
    letter-spacing: -0.01em;
    font-size: 16px;
    line-height: 24px;
    margin: 0;
    display: flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
`;

const TitleText = styled.span`
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
`;

const IconWrapper = styled.div`
    margin-right: 6px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    display: flex;
    align-items: center;
    flex-shrink: 0;
`;

const MenuButtonWrapper = styled.div`
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
`;

