// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useRouteMatch} from 'react-router-dom';

import EmptyState from 'src/components/fusion/empty_state';
import {navigateToUrl} from 'src/browser_routing';

// NoMetricsPlaceholder is a playbook's reports without metrics: a Fusion empty state (it was a Mattermost
// illustration), with the way to configure them for those who can edit the playbook.
const NoMetricsPlaceholder = ({canEdit = true}: {canEdit?: boolean}) => {
    const match = useRouteMatch();
    const {formatMessage} = useIntl();

    return (
        <EmptyState
            data-testid='no-metrics-placeholder'
            icon='flag'
            title={formatMessage({defaultMessage: 'Track key metrics and measure value'})}
            text={formatMessage({defaultMessage: 'Use metrics to understand patterns and progress across runs, and track performance.'})}
            action={canEdit ? {
                label: formatMessage({defaultMessage: 'Configure metrics in Retrospective'}),
                onClick: () => {
                    navigateToUrl(match.url.replace('/reports', '/outline#retrospective'));
                },
            } : undefined}
        />
    );
};

export default NoMetricsPlaceholder;
