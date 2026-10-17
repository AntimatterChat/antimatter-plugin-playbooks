// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {DotsVerticalIcon} from '@mattermost/compass-icons/components';

import DotMenu from 'src/components/dot_menu';
import {Separator} from 'src/components/backstage/playbook_runs/shared';

import {DotMenuButtonStyled} from './shared';
import {CopyPlaybookLinkMenuItem, FavoritePlaybookMenuItem, LeavePlaybookMenuItem} from './playbook_editor/controls';

interface Props {
    playbookId: string;
    isFavorite: boolean;

    // The icon's colour: the button colour by default (on the sidebar), the text's in the side panel.
    iconColor?: string;
}

export const LHSPlaybookDotMenu = ({playbookId, isFavorite, iconColor = 'var(--button-color)'}: Props) => {
    return (
        <>
            <DotMenu
                placement='bottom-start'
                icon={(
                    <DotsVerticalIcon
                        size={14.4}
                        color={iconColor}
                    />
                )}
                dotMenuButton={DotMenuButtonStyled}
            >
                <FavoritePlaybookMenuItem
                    playbookId={playbookId}
                    isFavorite={isFavorite}
                />
                <CopyPlaybookLinkMenuItem playbookId={playbookId}/>
                <Separator/>
                <LeavePlaybookMenuItem playbookId={playbookId}/>
            </DotMenu>
        </>
    );
};
