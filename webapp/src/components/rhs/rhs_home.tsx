// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import styled from 'styled-components';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {useIntl} from 'react-intl';

import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {PresetTemplates} from 'src/components/templates/template_data';
import TemplateRow from 'src/components/templates/template_row';
import EmptyState from 'src/components/fusion/empty_state';
import {DraftPlaybookWithChecklist} from 'src/types/playbook';
import {displayPlaybookCreateModal} from 'src/actions';
import {useCanCreatePlaybooksInTeam} from 'src/hooks';

/**
 * RHSHome is the panel's first view outside a channel: what Playbooks is, the button to create a playbook, and the
 * templates to start one from. It's drawn as the Fusion UI's app panels: a small empty state, then a list of rows
 * (it was a large Mattermost illustration over a grid of cards).
 */
const RHSHome = () => {
    const {formatMessage} = useIntl();
    const dispatch = useAppDispatch();
    const currentTeamId = useAppSelector(getCurrentTeamId);
    const canCreatePlaybooks = useCanCreatePlaybooksInTeam(currentTeamId || '');
    const newPlaybook = (template?: DraftPlaybookWithChecklist) => {
        dispatch(displayPlaybookCreateModal({startingTemplate: template?.title}));
    };

    // No toolbar: the panel's header already names the app.
    return (
        <Panel
            className='am-app-panel'
            data-testid='playbooks-rhs-home'
        >
            <EmptyState
                icon='runbook'
                data-testid='playbooks-rhs-welcome'
                title={formatMessage({
                    defaultMessage: 'Welcome to Playbooks',
                    description: 'Playbooks side panel: the title of its first view, shown outside a channel.',
                })}
                text={formatMessage({
                    defaultMessage: 'A playbook is a checklist you can run again and again, with its own automations. Each run keeps a record of what happened.',
                    description: 'Playbooks side panel: what a playbook is, under the welcome title.',
                })}
                action={canCreatePlaybooks ? {
                    label: formatMessage({defaultMessage: 'Create playbook'}),
                    icon: 'plus',
                    onClick: () => newPlaybook(),
                    testId: 'playbooks-rhs-create',
                } : undefined}
                note={canCreatePlaybooks ? undefined : formatMessage({
                    defaultMessage: 'You can’t create playbooks in this community.',
                    description: 'Playbooks side panel: shown instead of the create button to people without the permission to create playbooks.',
                })}
            />
            {canCreatePlaybooks && (
                <>
                    <Heading className='am-app-h'>
                        {formatMessage({
                            defaultMessage: 'Start from a template',
                            description: 'Playbooks side panel: the heading of the list of templates a new playbook can start from.',
                        })}
                    </Heading>
                    {PresetTemplates.map(({title, icon, template}) => (
                        <TemplateRow
                            key={title}
                            title={title}
                            icon={icon}
                            template={template}
                            onSelect={() => newPlaybook(template)}
                        />
                    ))}
                </>
            )}
        </Panel>
    );
};

// The Fusion UI styles .am-app-panel and .am-app-h; these are the classic UI's look for them.
const Panel = styled.div`
    display: grid;
    align-content: start;
    padding: 10px 12px 16px;
    gap: 6px;
`;

const Heading = styled.h4`
    display: flex;
    align-items: center;
    margin: 6px 2px 0;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 11px;
    font-weight: 700;
    gap: 8px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
`;

export default RHSHome;
