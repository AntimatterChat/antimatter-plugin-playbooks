// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import FusionEmptyState from 'src/components/fusion/empty_state';

interface Props {
    title: React.ReactNode;
    description: React.ReactNode;
    buttonText?: React.ReactNode;
    onButtonClick?: () => void;
}

// EmptyState is a playbook's attributes before there are any: the app's Fusion empty state.
const EmptyState = ({
    title,
    description,
    buttonText,
    onButtonClick,
}: Props) => (
    <FusionEmptyState
        data-testid='attributes-empty-state'
        icon='tag'
        title={title}
        text={description}
        action={buttonText && onButtonClick ? {
            label: buttonText,
            icon: 'plus',
            onClick: onButtonClick,
        } : undefined}
    />
);

export default EmptyState;
