// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {createContext, useContext, useState} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

// The Playbooks panel's toolbar: the row at the top of the panel's body where the view shown puts its title, its back
// button and its actions (the channel's checklists and the button to browse runs, playbooks and tasks; a checklist's
// title and Follow...). It's the app's own row, under the host's header: the header of an app's panel is the host's
// (its icon and name, its size, a new window, close), and nothing of the app goes in it.

// The row the views fill, once it's drawn: undefined outside a panel (a view drawn on its own draws its toolbar in
// place), null while the row isn't drawn yet.
const ToolbarSlot = createContext<HTMLElement | null | undefined>(undefined);

/**
 * PanelToolbarRow is the panel's toolbar row, above the views (and not scrolling with them), with the views given as
 * children able to fill it with PanelToolbar. The row takes no room when the view puts nothing in it.
 */
export const PanelToolbarRow = ({children}: {children: React.ReactNode}) => {
    const [slot, setSlot] = useState<HTMLDivElement | null>(null);

    return (
        <>
            <ToolbarRow
                ref={setSlot}
                data-testid='playbooks-panel-toolbar'
            />
            <ToolbarSlot.Provider value={slot}>
                {children}
            </ToolbarSlot.Provider>
        </>
    );
};

/**
 * PanelToolbar puts its children in the panel's toolbar row: a view's title, back button and actions.
 */
export const PanelToolbar = ({children}: {children: React.ReactNode}) => {
    const slot = useContext(ToolbarSlot);
    if (slot === undefined) {
        return <ToolbarRow data-testid='playbooks-panel-toolbar'>{children}</ToolbarRow>;
    }
    if (!slot) {
        return null;
    }
    return ReactDOM.createPortal(children, slot);
};

// Fusion's toolbar rows in the apps' panels: a slim row with a line under it; the classic UI's look otherwise.
const ToolbarRow = styled.div`
    display: flex;
    min-width: 0;
    min-height: 44px;
    flex: none;
    align-items: center;
    padding: 6px 8px 6px 16px;
    border-bottom: 1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.08));
    background: var(--am-main, var(--center-channel-bg));
    gap: 8px;

    &:empty {
        display: none;
    }
`;
