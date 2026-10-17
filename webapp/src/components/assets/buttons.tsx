// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import styled, {css} from 'styled-components';

import {Button} from '@mattermost/shared/components/button';

import {FUSION} from 'src/components/fusion/web_ui';

// Under the Fusion UI, the buttons are Fusion's (.am-btn): rounder, in its font, the primary one in the accent colour,
// the others on the raised surface, without the classic outline. They keep their classic sizes.
const fusionButton = (emphasis: 'primary' | 'plain' | 'destructive') => css`
    ${FUSION} &&& {
        border: 0;
        border-radius: 10px;
        box-shadow: none;
        font-family: var(--am-font-ui), sans-serif;
        font-weight: 600;

        ${emphasis === 'primary' && css`
            background: var(--am-matter);
            color: #fff;
        `}

        ${emphasis === 'plain' && css`
            background: var(--am-raise);
            color: var(--am-text);
        `}

        ${emphasis === 'destructive' && css`
            background: var(--am-danger);
            color: #fff;
        `}
    }

    ${FUSION} &&&:hover:not(:disabled) {
        ${emphasis === 'plain' ? css`
            background: var(--am-raise-2);
        ` : css`
            filter: brightness(1.1);
        `}
    }

    ${FUSION} &&&:disabled {
        filter: none;
        opacity: 0.45;
    }
`;

export const PrimaryButton = styled(Button).attrs({emphasis: 'primary'})`
    /* This allows this component to be styled by other components using styled-components */
    ${fusionButton('primary')}
`;

export const TertiaryButton = styled(Button).attrs({emphasis: 'tertiary'})`
    /* This allows this component to be styled by other components using styled-components */
    ${fusionButton('plain')}
`;

export const SecondaryButton = styled(Button).attrs({emphasis: 'secondary'})`
    /* This allows this component to be styled by other components using styled-components */
    ${fusionButton('plain')}
`;

export const DestructiveButton = styled(Button).attrs({emphasis: 'primary', variant: 'destructive'})`
    /* This allows this component to be styled by other components using styled-components */
    ${fusionButton('destructive')}
`;

export const ButtonIcon = styled.button`

    display: flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    fill: rgba(var(--center-channel-color-rgb), 0.56);
    font-size: 1.6rem;

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
        color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
        fill: rgba(var(--center-channel-color-rgb), 0.72);
    }

    &:active,
    &--active,
    &--active:hover {
        background: rgba(var(--button-bg-rgb), 0.08);
        color: var(--button-bg);
        fill: var(--button-bg);
    }

    /* Fusion's icon buttons (.am-icon-btn). */
    ${FUSION} & {
        border-radius: 8px;
        color: var(--am-muted);
        fill: var(--am-muted);
    }

    ${FUSION} &:hover {
        background: var(--am-hover);
        color: var(--am-text);
        fill: var(--am-text);
    }

    ${FUSION} &:active {
        background: var(--am-matter-soft);
        color: var(--am-matter);
        fill: var(--am-matter);
    }
`;
