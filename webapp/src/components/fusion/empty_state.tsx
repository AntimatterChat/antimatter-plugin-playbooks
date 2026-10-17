// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled, {css} from 'styled-components';

import {PrimaryButton, TertiaryButton} from 'src/components/assets/buttons';

import FusionIcon, {FusionIconName} from './icon';
import {APP_COLOR, FUSION} from './web_ui';

type Action = {
    label: React.ReactNode;
    onClick: () => void;
    icon?: FusionIconName;
    testId?: string;
};

type Props = {
    icon: FusionIconName;
    title: React.ReactNode;
    text?: React.ReactNode;

    // The one thing to do from here (create, start...), as the primary button.
    action?: Action;

    // Another way out (see the finished runs...), as a plain button under it.
    secondary?: Action;

    // What's left to say, under the buttons (no permission to create...).
    note?: React.ReactNode;

    // 'danger' for errors (a missing run or playbook).
    tone?: 'app' | 'danger';

    // Fills the height it's given and centres itself in it, for a view with nothing else to show.
    fill?: boolean;
    className?: string;
    'data-testid'?: string;
};

/**
 * EmptyState is what Playbooks shows where there's nothing yet, drawn as the Fusion UI's empty states: a small line
 * icon in the app's colour, a short title, a sentence and at most one primary action. It replaces the Mattermost
 * illustrations the app had.
 */
const EmptyState = ({
    icon,
    title,
    text,
    action,
    secondary,
    note,
    tone = 'app',
    fill = false,
    className,
    'data-testid': testId,
}: Props) => (
    <Container
        className={className}
        $fill={fill}
        data-testid={testId}
        data-empty-state={true}
    >
        <IconTile
            $tone={tone}
            data-testid='empty-state-icon'
        >
            <FusionIcon
                name={icon}
                size={22}
            />
        </IconTile>
        <Title>{title}</Title>
        {text && <Text>{text}</Text>}
        {action && (
            <Actions>
                <PrimaryButton
                    onClick={action.onClick}
                    data-testid={action.testId}
                >
                    {action.icon && (
                        <FusionIcon
                            name={action.icon}
                            size='sm'
                        />
                    )}
                    {action.label}
                </PrimaryButton>
            </Actions>
        )}
        {secondary && (
            <PlainButton
                onClick={secondary.onClick}
                data-testid={secondary.testId}
            >
                {secondary.label}
            </PlainButton>
        )}
        {note && <Note>{note}</Note>}
    </Container>
);

const Container = styled.div<{$fill: boolean}>`
    display: grid;
    box-sizing: border-box;
    padding: 28px 18px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));
    font-family: var(--am-font-ui, 'Open Sans'), sans-serif;
    gap: 8px;
    justify-items: center;
    text-align: center;

    ${({$fill}) => $fill && css`
        width: 100%;
        min-height: 100%;
        align-content: center;
    `}
`;

const IconTile = styled.span<{$tone: 'app' | 'danger'}>`
    display: grid;
    width: 44px;
    height: 44px;
    margin-bottom: 4px;
    border-radius: 12px;
    background: rgba(var(--button-bg-rgb), 0.08);
    color: var(--button-bg);
    place-items: center;

    ${FUSION} & {
        background: color-mix(in srgb, ${APP_COLOR} 16%, transparent);
        color: ${APP_COLOR};
    }

    ${({$tone}) => $tone === 'danger' && css`
        &&& {
            background: color-mix(in srgb, var(--am-danger, var(--error-text)) 14%, transparent);
            color: var(--am-danger, var(--error-text));
        }
    `}
`;

const Title = styled.h3`
    margin: 0;
    color: var(--am-text, var(--center-channel-color));
    font-family: var(--am-font-display, Metropolis), sans-serif;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
`;

const Text = styled.p`
    max-width: 300px;
    margin: 0;
    font-size: 13.5px;
    line-height: 1.45;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 8px;
`;

const PlainButton = styled(TertiaryButton)`
    &&& {
        background: none;
        color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.72));
    }

    &&&:hover {
        background: var(--am-hover, rgba(var(--center-channel-color-rgb), 0.08));
        color: var(--am-text, var(--center-channel-color));
    }
`;

const Note = styled.p`
    max-width: 300px;
    margin: 4px 0 0;
    color: var(--am-faint, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 12.5px;
    line-height: 1.4;
`;

export default EmptyState;
