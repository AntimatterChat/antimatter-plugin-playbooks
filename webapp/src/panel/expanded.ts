// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useStore} from 'react-redux';

import {useAppDispatch} from 'src/hooks/redux';

// The web app's action and state for an expanded side panel. In the Fusion UI, an app's panel that is expanded takes
// all the room the conversation leaves it (its user can still drag its edge); in the classic UI, it covers the
// conversation.
export const SET_RHS_EXPANDED = 'SET_RHS_EXPANDED';

export const setPanelExpanded = (expanded: boolean) => ({type: SET_RHS_EXPANDED, expanded});

export const isPanelExpanded = (state: unknown) => Boolean((state as {views?: {rhs?: {isSidebarExpanded?: boolean}}})?.views?.rhs?.isSidebarExpanded);

/**
 * useExpandedPanel widens the side panel while the view that calls it shows (the playbook editor, which was a full
 * page), and gives it back its width when the view goes, unless it was already wide.
 */
export function useExpandedPanel(active = true) {
    const dispatch = useAppDispatch();
    const store = useStore();

    useEffect(() => {
        if (!active) {
            return undefined;
        }

        const wasExpanded = isPanelExpanded(store.getState());

        // After the panel's own effects: opening the panel first gives it its default width.
        const timer = window.setTimeout(() => {
            if (!isPanelExpanded(store.getState())) {
                dispatch(setPanelExpanded(true));
            }
        }, 0);

        return () => {
            window.clearTimeout(timer);
            if (!wasExpanded && isPanelExpanded(store.getState())) {
                dispatch(setPanelExpanded(false));
            }
        };
    }, [active, dispatch, store]);
}
