// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import styled from 'styled-components';

import qs from 'qs';

import {FormattedMessage} from 'react-intl';

import WarningIcon from 'src/components/assets/icons/warning_icon';
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
        title = <FormattedMessage defaultMessage='Playbook Not Found'/>;
        message = <FormattedMessage defaultMessage="The playbook you're requesting is private or does not exist."/>;
        returnTo = pluginUrl('/playbooks');
        returnToMsg = <FormattedMessage defaultMessage='Back to playbooks'/>;
        break;
    }

    return (
        <Container data-testid='playbooks-panel-error'>
            <Icon>
                <WarningIcon/>
            </Icon>
            <h2 data-testid='errorMessageTitle'>
                <span>{title}</span>
            </h2>
            <p>
                <span>{message}</span>
            </p>
            <Link to={returnTo}>
                {returnToMsg}
            </Link>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    color: var(--center-channel-color);
    text-align: center;

    h2 {
        margin: 16px 0 8px;
        font-size: 20px;
        font-weight: 600;
    }

    p {
        margin-bottom: 16px;
        color: rgba(var(--center-channel-color-rgb), 0.72);
    }
`;

const Icon = styled.div`
    width: 48px;
    height: 48px;
    color: var(--error-text);

    svg {
        width: 100%;
        height: 100%;
    }
`;

export default ErrorPage;
