// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import EmptyState from 'src/components/fusion/empty_state';

// GettingStarted is the playbooks list with no playbook yet: what a playbook is, and the way to the templates under
// it. It's a Fusion empty state (it was a Mattermost illustration with a large title).
const GettingStarted = (props: {canCreatePlaybooks: boolean, scrollToNext: () => void}) => {
    const {formatMessage} = useIntl();

    return (
        <EmptyState
            data-testid='playbooks-getting-started'
            icon='playbook'
            title={formatMessage({
                defaultMessage: 'No playbooks yet',
                description: 'Playbooks side panel: the title of the list of playbooks when there is none.',
            })}
            text={formatMessage({
                defaultMessage: 'Playbooks make important procedures repeatable and accountable. Each run keeps its own record and retrospective.',
                description: 'Playbooks side panel: what playbooks are, in the list of playbooks when there is none.',
            })}
            action={props.canCreatePlaybooks ? {
                label: formatMessage({defaultMessage: 'Choose a template'}),
                onClick: props.scrollToNext,
                testId: 'playbooks-getting-started-templates',
            } : undefined}
            note={props.canCreatePlaybooks ? undefined : formatMessage({
                defaultMessage: 'You can’t create playbooks in this community.',
                description: 'Playbooks side panel: shown instead of the create button to people without the permission to create playbooks.',
            })}
        />
    );
};

export default GettingStarted;
