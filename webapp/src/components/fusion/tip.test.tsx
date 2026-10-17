// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable formatjs/no-literal-string-in-jsx */

import React from 'react';
import styled from 'styled-components';
import {render, screen} from '@testing-library/react';

import Tip, {WithTooltip} from './tip';

// The classic tooltip, as a marker around its child.
jest.mock('@mattermost/shared/components/tooltip', () => ({
    WithTooltip: ({children, title}: {children: React.ReactNode, title: unknown}) => (
        <div
            data-testid='classic-tooltip'
            data-title={String(title)}
        >
            {children}
        </div>
    ),
}));

const setWebUI = (ui?: 'classic' | 'fusion') => {
    window.antimatterWebUI = ui;
    if (ui) {
        document.documentElement.dataset.amWebUi = ui;
    } else {
        delete document.documentElement.dataset.amWebUi;
    }
};

afterEach(() => setWebUI(undefined));

const StyledButton = styled.button`
    color: red;
`;

const Plain = (props: {label: string}) => <span>{props.label}</span>;

describe('Tip', () => {
    test('under Fusion, gives the element Fusion\'s tooltip (data-am-tip)', () => {
        setWebUI('fusion');
        render(
            <Tip
                id='t'
                title='Back'
            >
                <button>{'<'}</button>
            </Tip>,
        );
        expect(screen.getByRole('button').getAttribute('data-am-tip')).toBe('Back');
        expect(screen.queryByTestId('classic-tooltip')).toBeNull();
    });

    test('under the classic UI, keeps the classic tooltip', () => {
        setWebUI('classic');
        render(
            <Tip
                id='t'
                title='Back'
            >
                <button>{'<'}</button>
            </Tip>,
        );
        expect(screen.getByTestId('classic-tooltip').getAttribute('data-title')).toBe('Back');
        expect(screen.getByRole('button').hasAttribute('data-am-tip')).toBe(false);
    });
});

describe('WithTooltip', () => {
    test('under Fusion, a plain text tooltip on a styled component becomes Fusion\'s', () => {
        setWebUI('fusion');
        render(
            <WithTooltip title='Copy link'>
                <StyledButton>{'Copy'}</StyledButton>
            </WithTooltip>,
        );
        expect(screen.getByRole('button').getAttribute('data-am-tip')).toBe('Copy link');
        expect(screen.queryByTestId('classic-tooltip')).toBeNull();
    });

    test('under Fusion, keeps the classic tooltip for a hint or a component that may drop the attribute', () => {
        setWebUI('fusion');
        render(
            <>
                <WithTooltip
                    title='Search'
                    hint='Find runs'
                >
                    <button>{'Search'}</button>
                </WithTooltip>
                <WithTooltip title='Name'>
                    <Plain label='Name'/>
                </WithTooltip>
            </>,
        );
        expect(screen.getAllByTestId('classic-tooltip')).toHaveLength(2);
        expect(document.querySelector('[data-am-tip]')).toBeNull();
    });
});
