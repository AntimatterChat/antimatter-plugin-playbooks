// Copyright (c) 2026-present Antimatter contributors. See LICENSE.txt for license information.

import React, {createContext, useContext, useLayoutEffect, useRef, useState} from 'react';

import {COMPACT_LIST_WIDTH, DEFAULT_PANEL_WIDTH} from './constants';

// The width of the Playbooks panel's views. The views that were full pages lay themselves out by it rather than by
// the window's width (media queries): the panel is narrow on a wide screen, and wider when the editor expands it.
// Undefined outside the panel (a dialog), where a view has the window's room.
const PanelWidthContext = createContext<number | undefined>(undefined);

export const usePanelWidth = () => useContext(PanelWidthContext);

// useCompactList tells the lists (runs, playbooks) to show one line per item, in a panel narrower than their table.
export const useCompactList = () => {
    const width = usePanelWidth();
    return width !== undefined && width < COMPACT_LIST_WIDTH;
};

type Props = {
    children: React.ReactNode;
    className?: string;

    // The width to start with, before the panel is measured (and in tests, where nothing is).
    initialWidth?: number;
} & React.HTMLAttributes<HTMLDivElement>;

// PanelWidthProvider measures its element and gives its width to the views in it.
export const PanelWidthProvider = ({children, initialWidth = DEFAULT_PANEL_WIDTH, ...rest}: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(initialWidth);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return undefined;
        }

        const measure = () => {
            const measured = element.getBoundingClientRect().width;

            // Nothing is laid out yet (or in tests): keep the width we have.
            if (measured > 0) {
                setWidth(Math.round(measured));
            }
        };
        measure();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);
            return () => window.removeEventListener('resize', measure);
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            {...rest}
        >
            <PanelWidthContext.Provider value={width}>
                {children}
            </PanelWidthContext.Provider>
        </div>
    );
};
