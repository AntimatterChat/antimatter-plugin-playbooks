// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useHistory} from 'react-router-dom';
import styled from 'styled-components';
import {WithTooltip} from '@mattermost/shared/components/tooltip';

import LeftChevron from 'src/components/assets/icons/left_chevron';
import {RHSTitleRemoteRender} from 'src/rhs_title_remote_render';
import {RHSTitleButton, RHSTitleContainer, RHSTitleText} from 'src/components/rhs/rhs_title_common';

import type {PanelHistory} from './history';

// usePanelHistory is the panel's history (its router's), with its back button's moves.
export const usePanelHistory = () => useHistory() as PanelHistory;

type Props = {
    title: React.ReactNode;
    subtitle?: React.ReactNode;

    // What the title bar shows at its right (a follow button...).
    actions?: React.ReactNode;
};

// PanelTitle is the title bar of a panel view that isn't the channel's runs: a back button, the view's name and what
// it shows (a run's or a playbook's name).
export const PanelTitle = ({title, subtitle, actions}: Props) => {
    const {formatMessage} = useIntl();
    const history = usePanelHistory();
    const backLabel = formatMessage({defaultMessage: 'Back', description: 'Playbooks side panel: the button that goes back to the previous view of the panel.'});

    return (
        <RHSTitleRemoteRender>
            <RHSTitleContainer data-testid='playbooks-panel-title'>
                <WithTooltip
                    id='playbooks-panel-back'
                    title={backLabel}
                >
                    <RHSTitleButton
                        onClick={() => history.back()}
                        aria-label={backLabel}
                        data-testid='playbooks-panel-back'
                    >
                        <LeftChevron/>
                    </RHSTitleButton>
                </WithTooltip>
                <RHSTitleText data-testid='playbooks-panel-title-text'>{title}</RHSTitleText>
                {subtitle && (
                    <>
                        <VerticalLine/>
                        <Subtitle data-testid='playbooks-panel-subtitle'>{subtitle}</Subtitle>
                    </>
                )}
                {actions && <Actions>{actions}</Actions>}
            </RHSTitleContainer>
        </RHSTitleRemoteRender>
    );
};

const VerticalLine = styled.div`
    height: 24px;
    flex: none;
    border-left: 1px solid var(--center-channel-color);
    margin: 0 8px;
    opacity: 0.16;
`;

const Subtitle = styled.div`
    overflow: hidden;
    min-width: 0;
    color: rgba(var(--center-channel-color-rgb), 0.56);
    font-size: 12px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Actions = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
`;
