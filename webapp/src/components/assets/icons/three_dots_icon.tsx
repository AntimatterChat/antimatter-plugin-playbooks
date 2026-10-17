// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';

import FusionIcon from 'src/components/fusion/icon';
import {isFusionUI} from 'src/components/fusion/web_ui';

// The ⋯ of the menus: Fusion's under the Fusion UI, the classic vertical dots under the classic UI.
const ThreeDotsIcon = (props: React.PropsWithoutRef<JSX.IntrinsicElements['i']>): JSX.Element => {
    if (isFusionUI()) {
        return (
            <FusionIcon
                name='dots'
                size={18}
                className={props.className}
            />
        );
    }

    return (
        <i
            className={`icon icon-dots-vertical ${props.className}`}
        />
    );
};

export const HamburgerButton = styled(ThreeDotsIcon)`
    position: relative;
    font-size: 24px;
`;
