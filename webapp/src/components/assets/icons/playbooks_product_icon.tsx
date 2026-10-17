// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled, {css} from 'styled-components';

import {APP_COLOR} from 'src/components/fusion/web_ui';

// The Playbooks app icon of the Antimatter UI: a runbook (checked steps and a run arrow) drawn as a stroke
// icon on a 24x24 grid, in the Playbooks app colour.
export const playbooksAppColor = APP_COLOR;

const paths = [
    'm4 6 1.5 1.5L8 5M11 6h9M4 12l1.5 1.5L8 11M11 12h5',
    'M4.5 17.5h3M11 17.5h1.5',
    'm16 15 5 3-5 3z',
];

const svgMarkup = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${playbooksAppColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">`,
    ...paths.map((d) => `<path d="${d}"/>`),
    '</svg>',
].join('');

// The app bar only takes an image URL, so it gets the icon as a data URL with the colour baked in.
export const playbooksAppIconURL = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;

interface Props {
    id?: string;
    size?: number;

    // Draw the icon in the Playbooks app colour instead of the surrounding text colour.
    colored?: boolean;
}

const Svg = styled.svg<{$colored: boolean}>`
    flex: none;
    fill: none;

    ${({$colored}) => $colored && css`
        color: ${playbooksAppColor};

        /* Stay readable on the filled background of the active channel header button. */
        .channel-header__icon--active-inverted & {
            color: inherit;
        }
    `}
`;

const PlaybooksProductIcon = React.forwardRef<SVGSVGElement, Props>(({id, size = 22, colored = false}: Props, forwardedRef) => (
    <Svg
        id={id}
        ref={forwardedRef}
        className='PlaybooksProductIcon'
        width={size}
        height={size}
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        $colored={colored}
    >
        {paths.map((d) => (
            <path
                key={d}
                d={d}
            />
        ))}
    </Svg>
));

export default PlaybooksProductIcon;
