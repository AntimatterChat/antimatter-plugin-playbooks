// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import styled, {createGlobalStyle, css} from 'styled-components';
import Select from 'react-select';
import Creatable from 'react-select/creatable';
import {Button} from '@mattermost/shared/components/button';

import {FUSION} from 'src/components/fusion/web_ui';

export const Banner = styled.div`
    position: fixed;
    z-index: 8;
    top: 0;
    left: 0;
    overflow: hidden;
    width: 100%;
    padding: 1rem 2.4rem;
    background-color: var(--button-bg);
    color: var(--button-color);
    text-align: center;
`;

export const BackstageSubheader = styled.header`
    color: var(--am-text, var(--center-channel-color));
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
`;

export const BackstageSubheaderDescription = styled.div`
    margin: 4px 0 16px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));
    font-size: 14px;
    font-weight: normal;
    line-height: 20px;
`;

export const StyledTextarea = styled.textarea`
    width: 100%;
    height: 160px;
    padding: 10px 25px 0 16px;
    border: none;
    border-radius: 4px;
    background-color: rgba(var(--center-channel-bg-rgb));
    box-shadow: inset 0 0 0 1px var(--am-line, rgba(var(--center-channel-color-rgb), 0.16));
    font-size: 14px;
    line-height: 20px;
    resize: none;
    transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s, -webkit-box-shadow ease-in-out .15s;

    &:focus {
        box-shadow: inset 0 0 0 2px var(--button-bg);
    }

    /* Fusion's fields (.am-field). */
    ${FUSION} & {
        border-radius: 9px;
        background-color: var(--am-side);
        box-shadow: inset 0 0 0 1px var(--am-line);
        color: var(--am-text);
    }

    ${FUSION} &:focus {
        box-shadow: inset 0 0 0 1px var(--am-matter);
    }
`;

const selectGlobalStyles = (classNamePrefix: string) => css`
    .${classNamePrefix}__control.${classNamePrefix}__control {
        width: 100%;
        border: none;
        border-radius: 4px;
        background-color: transparent;
        box-shadow: inset 0 0 0 1px var(--am-line, rgba(var(--center-channel-color-rgb), 0.16));
        font-size: 14px;
        transition: all 0.15s ease;
        transition-delay: 0s;

        &--is-focused {
            box-shadow: inset 0 0 0 2px var(--button-bg);
        }
    }

    .${classNamePrefix}__control--is-disabled {
        opacity: 0.56;
    }

    .${classNamePrefix}__control,
    .${classNamePrefix}__menu {
        .${classNamePrefix}__menu-list {
            border: none;
            border-radius: var(--radius-s);
            background-color: var(--center-channel-bg);
        }

        .${classNamePrefix}__input {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__option {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__option--is-selected {
            background-color: rgba(var(--center-channel-color-rgb), 0.08);
            color: inherit;
        }

        .${classNamePrefix}__option--is-focused {
            background-color: rgba(var(--center-channel-color-rgb), 0.16);
        }

        .${classNamePrefix}__option {
            &:active {
                background-color: rgba(var(--center-channel-color-rgb), 0.08);
            }
        }

        .${classNamePrefix}__single-value {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__multi-value {
            height: 20px;
            padding-left: 8px;
            border-radius: 10px;
            background-color: rgba(var(--center-channel-color-rgb), 0.08);
            line-height: 19px;

            .${classNamePrefix}__multi-value__label {
                padding: 0;
                color: var(--am-text, var(--center-channel-color));
            }

            .${classNamePrefix}__multi-value__remove {
                color: rgba(var(--center-channel-bg-rgb), 0.80);
            }
        }
    }

    /* Fusion's fields and menus. */
    ${FUSION} .${classNamePrefix}__control.${classNamePrefix}__control {
        border-radius: 9px;
        background-color: var(--am-side);
        box-shadow: inset 0 0 0 1px var(--am-line);
    }

    ${FUSION} .${classNamePrefix}__control.${classNamePrefix}__control--is-focused {
        box-shadow: inset 0 0 0 1px var(--am-matter);
    }

    ${FUSION} .${classNamePrefix}__menu {
        overflow: hidden;
        border: 1px solid var(--am-line);
        border-radius: 12px;
        background-color: var(--am-raise);
        box-shadow: var(--am-shadow);
    }

    ${FUSION} .${classNamePrefix}__menu .${classNamePrefix}__menu-list {
        padding: 6px;
        background-color: var(--am-raise);
    }

    ${FUSION} .${classNamePrefix}__menu .${classNamePrefix}__option {
        border-radius: 7px;
        color: var(--am-text);
    }

    ${FUSION} .${classNamePrefix}__menu .${classNamePrefix}__option--is-focused {
        background-color: var(--am-matter);
        color: #fff;
    }

    ${FUSION} .${classNamePrefix}__menu .${classNamePrefix}__option--is-selected {
        background-color: var(--am-select);
        color: var(--am-text);
    }

    ${FUSION} .${classNamePrefix}__multi-value {
        background-color: var(--am-raise-2);
    }
`;

export const GlobalSelectStyle = createGlobalStyle`
    ${selectGlobalStyles('playbooks-rselect')}
    ${selectGlobalStyles('property-select')}
`;

const commonSelectStyle = css`
    flex-grow: 1;
    background-color: var(--center-channel-bg);
`;

export const StyledSelect = styled(Select).attrs((props) => {
    return {
        classNamePrefix: 'playbooks-rselect',
        ...props,
    };
})`
    ${commonSelectStyle}

    ${({classNamePrefix}) => css`
        .${classNamePrefix}__multi-value {
            padding-left: 6px;
        }
    `}

`;

export const StyledCreatable = styled(Creatable)`
    ${commonSelectStyle}

    ${({classNamePrefix}) => css`
        .${classNamePrefix}__control {
            border: 1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.16));
            background-color: var(--center-channel-bg);
        }

        .${classNamePrefix}__input {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__control.${classNamePrefix}__control--is-disabled {
            background-color: rgba(var(--center-channel-bg-rgb), 0.16);
        }

        .${classNamePrefix}__single-value {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__multi-value {
            padding-left: 6px;
        }

        .${classNamePrefix}__menu-list {
            border: 1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.16));
            border-radius: 4px;
            background-color: var(--center-channel-bg);
        }

        .${classNamePrefix}__option {
            color: var(--am-text, var(--center-channel-color));
        }

        .${classNamePrefix}__option--is-focused {
            background-color: rgba(var(--center-channel-color-rgb), 0.1);
        }

        .${classNamePrefix}__option--is-selected {
            background-color: rgba(var(--center-channel-color-rgb), 0.2);
        }
    `}

`;

export const RadioInput = styled.input`
    && {
        width: 16px;
        height: 16px;
        margin: 0 8px 0 0;
    }
`;

export const CenteredRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
`;

export const InfoLine = styled.div`
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 11px;
    font-style: normal;
    font-weight: normal;
    line-height: 16px;
`;
export const FilterButton = styled(Button).attrs({emphasis: 'quaternary'})<{$active?: boolean;}>`
    && {
        background: transparent;
        color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));

        &:hover {
            background: rgba(var(--center-channel-color-rgb), 0.08);
            color: var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.72));
        }

        &:active {
            background: rgba(var(--button-bg-rgb), 0.08);
            color: var(--button-bg);
        }

        ${(props) => props.$active && css`
            background: rgba(var(--button-bg-rgb), 0.08);
            color: var(--button-bg);
        `}
    }
`;
export const HorizontalSpacer = styled.div<{$size: number}>`
    margin-left: ${(props) => props.$size}px;
`;

export const VerticalSpacer = styled.div<{$size: number}>`
    margin-top: ${(props) => props.$size}px;
`;
