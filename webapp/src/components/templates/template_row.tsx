// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';
import {useIntl} from 'react-intl';

import FusionIcon, {FusionIconName} from 'src/components/fusion/icon';
import {APP_COLOR, FUSION} from 'src/components/fusion/web_ui';
import {DraftPlaybookWithChecklist} from 'src/types/playbook';

type Props = {
    title: string;
    icon: FusionIconName;
    template: DraftPlaybookWithChecklist;
    description?: string;
    label?: string;
    onSelect: () => void;
    'data-testid'?: string;
};

/**
 * TemplateRow is one template a playbook can start from, as a row of the Fusion UI's app panels (.am-app-row): its
 * icon in the app's colour, its name, what it holds, and a button to use it. The whole row uses it too.
 */
const TemplateRow = ({title, icon, template, description, label, onSelect, 'data-testid': testId}: Props) => {
    const {formatMessage} = useIntl();
    const counts = [
        formatMessage({
            defaultMessage: '{num_checklists, plural, =0 {no checklists} one {# checklist} other {# checklists}}',
        }, {num_checklists: template.num_stages}),
        formatMessage({
            defaultMessage: '{num_actions, plural, =0 {no actions} one {# action} other {# actions}}',
        }, {num_actions: template.num_actions}),
    ].join(' · ');
    const useLabel = formatMessage({
        defaultMessage: 'Use {template}',
        description: 'Playbooks: the accessible name of the button that creates a playbook from a template, e.g. "Use Bug Bash".',
    }, {template: title});

    return (
        <Row
            className='am-app-row'
            role='button'
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect();
                }
            }}
            data-testid={testId ?? 'template-details'}
        >
            <Tile>
                <FusionIcon
                    name={icon}
                    size='sm'
                />
            </Tile>
            <Main>
                <b>
                    {title}
                    {label && <Label>{label}</Label>}
                </b>
                <span className='am-sub'>{description || counts}</span>
                {description && <span className='am-sub'>{counts}</span>}
            </Main>
            <UseButton
                type='button'
                aria-label={useLabel}
                data-testid='use-playbook'
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
            >
                {formatMessage({defaultMessage: 'Use'})}
            </UseButton>
        </Row>
    );
};

// The Fusion UI draws .am-app-row and .am-sub; these are the classic UI's look for them.
const Row = styled.div`
    display: grid;
    width: 100%;
    box-sizing: border-box;
    align-items: center;
    padding: 9px 10px;
    border-radius: 8px;
    background: rgba(var(--center-channel-color-rgb), 0.04);
    cursor: pointer;
    gap: 10px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    text-align: left;

    &:hover,
    &:focus-visible {
        background: rgba(var(--center-channel-color-rgb), 0.08);
    }

    b {
        display: block;
        overflow: hidden;
        font-size: 13.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .am-sub {
        display: block;
        overflow: hidden;
        color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64));
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const Main = styled.span`
    min-width: 0;
`;

const Tile = styled.span`
    display: grid;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(var(--button-bg-rgb), 0.08);
    color: var(--button-bg);
    place-items: center;

    ${FUSION} & {
        background: color-mix(in srgb, ${APP_COLOR} 16%, transparent);
        color: ${APP_COLOR};
    }
`;

const Label = styled.span`
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 10px;
    background: rgba(var(--away-indicator-rgb), 0.16);
    color: var(--away-indicator);
    font-size: 10.5px;
    font-weight: 700;
    vertical-align: 1px;

    ${FUSION} & {
        background: color-mix(in srgb, var(--am-spark) 18%, transparent);
        color: var(--am-spark);
    }
`;

const UseButton = styled.button`
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 4px;
    background: rgba(var(--button-bg-rgb), 0.08);
    color: var(--button-bg);
    font-size: 12px;
    font-weight: 600;

    &:hover {
        background: rgba(var(--button-bg-rgb), 0.16);
    }

    ${FUSION} & {
        border-radius: 8px;
        background: var(--am-raise);
        color: var(--am-text);
        font-family: var(--am-font-ui), sans-serif;
    }

    ${FUSION} &:hover {
        background: var(--am-raise-2);
    }
`;

export default TemplateRow;
