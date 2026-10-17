// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import styled from 'styled-components';

import qs from 'qs';

import {FormattedMessage} from 'react-intl';

import EmptyState from 'src/components/fusion/empty_state';
import {ErrorPageTypes} from 'src/constants';
import {pluginUrl} from 'src/browser_routing';

// Antimatter: a view of the side panel (it was a full page): it no longer styles the whole page as an error page.
const ErrorPage = () => {
    const queryString = useLocation().search.substr(1);
    const params = qs.parse(queryString);

    let title: React.ReactNode = (
        <FormattedMessage
            defaultMessage='Page not found'
            description='Playbooks side panel: the title shown for a link to a Playbooks page that does not exist.'
        />
    );
    let message: React.ReactNode = (
        <FormattedMessage
            defaultMessage='The page you were trying to reach does not exist.'
            description='Playbooks side panel: the text shown for a link to a Playbooks page that does not exist.'
        />
    );
    let returnTo = pluginUrl('/browse');
    let returnToMsg: React.ReactNode = <FormattedMessage defaultMessage='Back to playbooks'/>;

    switch (params.type) {
    case ErrorPageTypes.PLAYBOOK_RUNS:
        title = <FormattedMessage defaultMessage='Run not found'/>;
        message = <FormattedMessage defaultMessage="The run you're requesting is private or does not exist."/>;
        returnTo = pluginUrl('/runs');
        returnToMsg = (
            <FormattedMessage
                defaultMessage='Back to runs'
                description='Playbooks side panel: the link from a missing run back to the list of runs.'
            />
        );
        break;
    case ErrorPageTypes.PLAYBOOKS:
        title = (
            <FormattedMessage
                defaultMessage='Playbook not found'
                description='Playbooks side panel: the title shown for a link to a playbook that is private or does not exist.'
            />
        );
        message = <FormattedMessage defaultMessage="The playbook you're requesting is private or does not exist."/>;
        returnTo = pluginUrl('/playbooks');
        returnToMsg = <FormattedMessage defaultMessage='Back to playbooks'/>;
        break;
    }

    // A Fusion empty state in the error colour, with the way back to the list.
    return (
        <EmptyState
            data-testid='playbooks-panel-error'
            icon='ban'
            tone='danger'
            title={<span data-testid='errorMessageTitle'>{title}</span>}
            text={message}
            note={(
                <BackLink to={returnTo}>
                    {returnToMsg}
                </BackLink>
            )}
        />
    );
};

const BackLink = styled(Link)`
    &&& {
        color: var(--am-anti, var(--link-color));
        font-weight: 600;
    }
`;

export default ErrorPage;
