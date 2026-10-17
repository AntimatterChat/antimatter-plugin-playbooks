// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Link} from 'react-router-dom';
import styled from 'styled-components';

import {FUSION} from 'src/components/fusion/web_ui';

export const RHSTitleContainer = styled.div`
    display: flex;
    overflow: visible;
    flex: 1;
    align-items: center;
    justify-content: flex-start;
`;

export const RHSTitleText = styled.div`
    overflow: hidden;
    flex-shrink: 0;
    padding: 0 4px 0 0;
    font-family: var(--am-font-display, Metropolis), sans-serif;
    font-size: 16px;
    font-weight: 600;
    line-height: 32px;
    text-overflow: ellipsis;
`;

export const RHSTitle = styled.div`
    display: flex;
    overflow: hidden;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    border-radius: 4px;
    text-overflow: ellipsis;

    &&& {
        color: var(--am-text, var(--center-channel-color));
    }
`;

export const RHSTitleLink = styled(Link)`
    display: flex;
    overflow: hidden;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    border-radius: 4px;
    text-overflow: ellipsis;

    &&& {
        color: var(--am-text, var(--center-channel-color));
    }

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
        text-decoration: none;
    }

    &:active,
    &--active,
    &--active:hover {
        background: rgba(var(--button-bg-rgb), 0.08);
        color: var(--button-bg);
    }
`;

export const RHSTitleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    margin-left: -8px;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: 4px;
    cursor: pointer;
    color: var(--am-text, var(--center-channel-color));

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
    }

    &:active {
        background: rgba(var(--button-bg-rgb), 0.08);
        color: var(--button-bg);
    }

    /* The Fusion UI's panel header buttons (.sidebar--right__header .btn-icon). */
    ${FUSION} & {
        border-radius: 8px;
        color: var(--am-muted);
    }

    ${FUSION} &:hover {
        background: var(--am-hover);
        color: var(--am-text);
    }
`;

export const RHSTitleStyledButtonIcon = styled.i`
    display: flex;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
    color: rgba(var(--center-channel-color-rgb), 0.48);

    ${RHSTitleText}:hover &,
    ${RHSTitleLink}:hover & {
        color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
    }
`;
