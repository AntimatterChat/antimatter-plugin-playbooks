// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ComponentProps, useState} from 'react';
import styled, {css} from 'styled-components';

import {useUpdateEffect} from 'react-use';

import type {Button} from '@mattermost/shared/components/button';

import {WithTooltip} from 'src/components/fusion/tip';
import {useUniqueId} from 'src/utils';
import {FUSION} from 'src/components/fusion/web_ui';

import Dropdown from './dropdown';

export const DotMenuButton = styled.button<{$isActive?: boolean}>`
    display: inline-flex;
    width: 3.2rem;
    height: 3.2rem;
    padding: 0;
    border: none;
    border-radius: 4px;
    background-color: ${(props) => (props.$isActive ? 'rgba(var(--button-bg-rgb), 0.08)' : 'transparent')};
    color: ${(props) => (props.$isActive ? 'var(--button-bg)' : 'rgba(var(--center-channel-color-rgb), 0.56)')};
    cursor: pointer;
    fill: rgba(var(--center-channel-color-rgb), 0.56);

    &:hover {
        background-color: ${(props) => (props.$isActive ? 'rgba(var(--button-bg-rgb), 0.08)' : 'rgba(var(--center-channel-color-rgb), 0.08)')};
        color: ${(props) => (props.$isActive ? 'var(--button-bg)' : 'rgba(var(--center-channel-color-rgb), 0.56)')};
    }

    /* Fusion's icon buttons (.am-icon-btn). */
    ${FUSION} & {
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background-color: ${(props) => (props.$isActive ? 'var(--am-hover)' : 'transparent')};
        color: ${(props) => (props.$isActive ? 'var(--am-text)' : 'var(--am-muted)')};
    }

    ${FUSION} &:hover {
        background-color: var(--am-hover);
        color: var(--am-text);
    }
`;

export const DropdownMenu = styled.div`
    z-index: 12;
    display: flex;
    width: max-content;
    min-width: 16rem;
    flex-direction: column;
    padding: 10px 0;
    border: 1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.16));
    border-radius: 4px;
    background: var(--center-channel-bg);
    box-shadow: 0 8px 24px rgba(0 0 0 / 0.12);
    color: var(--am-text, var(--center-channel-color));
    font-family: var(--am-font-ui, "Open Sans"), sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: normal;
    line-height: 20px;
    list-style: none;
    text-align: left;

    /* Fusion's menus: the raised surface, rounder, a little padding around the items. */
    ${FUSION} & {
        padding: 6px;
        border-color: var(--am-line);
        border-radius: 12px;
        background: var(--am-raise);
        box-shadow: var(--am-shadow);
        color: var(--am-text);
        font-size: 13.5px;
    }

    ${FUSION} & hr {
        border-color: var(--am-line);
    }
`;

type DotMenuProps = {
    children: React.ReactNode;
    icon: JSX.Element;
    dotMenuButton?: typeof DotMenuButton | typeof Button;
    dropdownMenu?: typeof DropdownMenu;
    title?: string;
    disabled?: boolean;
    className?: string;
    isActive?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    closeOnClick?: boolean;
};

type DropdownProps = Omit<ComponentProps<typeof Dropdown>, 'target' | 'children'>;

const DotMenu = ({
    children,
    icon,
    title,
    className,
    disabled,
    isActive,
    closeOnClick = true,
    dotMenuButton: MenuButton = DotMenuButton,
    dropdownMenu: Menu = DropdownMenu,
    onOpenChange,
    ...props
}: DotMenuProps & DropdownProps) => {
    const [isOpen, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen(!isOpen);
    };
    useUpdateEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen]);

    const button = (
        <MenuButton
            title={title}
            $isActive={(isActive ?? false) || isOpen}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleOpen();
            }}
            onKeyDown={(e) => {
                // Handle Enter and Space as clicking on the button
                if (e.key === 'Space' || e.key === 'Enter') {
                    e.stopPropagation();
                    toggleOpen();
                }
            }}
            tabIndex={0}
            className={className}
            role={'button'}
            disabled={disabled ?? false}
            data-testid={'menuButton' + (title ?? '')}
        >
            {icon}
        </MenuButton>
    );

    return (
        <Dropdown
            {...props}
            isOpen={isOpen}
            onOpenChange={setOpen}
            target={button}
        >
            <Menu
                data-testid='dropdownmenu'
                onClick={(e) => {
                    e.stopPropagation();
                    if (closeOnClick) {
                        setOpen(false);
                    }
                }}
            >
                {children}
            </Menu>
        </Dropdown>
    );
};

export const DropdownMenuItemStyled = styled.a`
    && {
        padding: 10px 20px;
        color: var(--am-text, var(--center-channel-color));
        font-family: var(--am-font-ui, 'Open Sans'), sans-serif;
        font-size: 14px;
        font-style: normal;
        font-weight: normal;
        text-decoration: unset;

        &:hover {
            background: rgba(var(--center-channel-color-rgb), 0.08);
            color: var(--am-text, var(--center-channel-color));
        }

        &:focus {
            color: inherit;
            text-decoration: none;
        }
    }

    /* Fusion's menu items: rounded, the accent colour under the pointer. */
    ${FUSION} &&& {
        padding: 7px 10px;
        border-radius: 7px;
        color: var(--am-text);
        font-size: 13.5px;
    }

    ${FUSION} &&&:hover,
    ${FUSION} &&&:focus-visible {
        background: var(--am-matter);
        color: #fff;
    }

    ${FUSION} &&&:hover :is(svg, i, span, div) {
        color: inherit;
    }
`;

export const DisabledDropdownMenuItemStyled = styled.div`
    && {
        padding: 8px 20px;
        color: var(--center-channel-color-40);
        cursor: default;
        font-family: var(--am-font-ui, 'Open Sans'), sans-serif;
        font-size: 14px;
        font-style: normal;
        font-weight: normal;
        text-decoration: unset;
    }

    ${FUSION} &&& {
        padding: 7px 10px;
        color: var(--am-faint);
        font-size: 13.5px;
    }
`;

// fusionDangerMenuItem makes a menu item a Fusion danger item (delete...): red, white on red under the pointer.
export const fusionDangerMenuItem = css`
    ${FUSION} &&&& {
        color: var(--am-danger);
    }

    ${FUSION} &&&&:hover {
        background: var(--am-danger);
        color: #fff;
    }
`;

export const iconSplitStyling = css`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const DropdownMenuItem = (props: { children: React.ReactNode, onClick: () => void, className?: string, disabled?: boolean, disabledAltText?: string, 'data-testid'?: string }) => {
    const tooltipId = useUniqueId();
    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        props.onClick();
    };

    if (props.disabled) {
        return (
            <WithTooltip
                id={tooltipId}
                title={props.disabledAltText}
            >
                <DisabledDropdownMenuItemStyled
                    className={props.className}
                    data-testid={props['data-testid']}
                >
                    {props.children}
                </DisabledDropdownMenuItemStyled>
            </WithTooltip>
        );
    }

    return (
        <DropdownMenuItemStyled
            href='#'
            onClick={onClick}
            className={props.className}
            role={'button'}
            data-testid={props['data-testid']}

            // Prevent trigger icon (parent) from propagating title prop to options
            // Menu items use to be full text (not just icons) so don't need title
            title=''
        >
            {props.children}
        </DropdownMenuItemStyled>
    );
};

// Alternate dot menu button. Use `dotMenuButton={TitleButton}` for this style.
export const TitleButton = styled.button<{$isActive?: boolean}>`
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
    padding: 2px 2px 2px 6px;
    border-radius: 4px;
    background: ${({$isActive}) => ($isActive ? 'rgba(var(--button-bg-rgb), 0.08)' : 'none')};
    color: ${({$isActive}) => ($isActive ? 'var(--button-bg)' : 'var(--center-channel-color)')};
    border: none;

    &:hover {
        background: ${({$isActive}) => ($isActive ? 'rgba(var(--button-bg-rgb), 0.08)' : 'rgba(var(--center-channel-color-rgb), 0.08)')};
    }

    ${FUSION} & {
        border-radius: 8px;
        background: ${({$isActive}) => ($isActive ? 'var(--am-hover)' : 'none')};
        color: var(--am-text);
    }

    ${FUSION} &:hover {
        background: var(--am-hover);
    }
`;

export default DotMenu;
