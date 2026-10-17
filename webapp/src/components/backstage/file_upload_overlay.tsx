// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled, {css} from 'styled-components';

import FusionIcon from 'src/components/fusion/icon';

export interface FileUploadOverlayProps {
    message: string;
    show: boolean;
    overlayType: string;
}

// FileUploadOverlay covers a list while a file is dragged over it: a dashed frame with an upload icon and what dropping
// does, in the theme's colours (it was the classic web app's overlay, with a picture of files and a logo).
export const FileUploadOverlay = (props: FileUploadOverlayProps) => {
    if (!props.show) {
        return null;
    }

    return (
        <Overlay
            $right={props.overlayType === 'right'}
            data-testid='file-upload-overlay'
        >
            <Frame>
                <FusionIcon
                    name='upload'
                    size={28}
                />
                <span>{props.message}</span>
            </Frame>
        </Overlay>
    );
};

const Overlay = styled.div<{$right: boolean}>`
    position: absolute;
    z-index: 20;
    display: grid;
    padding: 12px;
    background: color-mix(in srgb, var(--am-main, var(--center-channel-bg)) 88%, transparent);
    inset: 0;
    pointer-events: none;
    place-items: center;

    ${({$right}) => $right && css`
        left: auto;
        width: 50%;
    `}
`;

const Frame = styled.div`
    display: grid;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    align-content: center;
    border: 2px dashed var(--am-matter, var(--button-bg));
    border-radius: 12px;
    color: var(--am-text, var(--center-channel-color));
    font-size: 14px;
    font-weight: 600;
    gap: 10px;
    justify-items: center;
    text-align: center;

    svg,
    i {
        color: var(--am-matter, var(--button-bg));
    }
`;
