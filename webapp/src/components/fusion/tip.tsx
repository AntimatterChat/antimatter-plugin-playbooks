// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ComponentProps} from 'react';
import {WithTooltip as ClassicTooltip} from '@mattermost/shared/components/tooltip';

import {isFusionUI} from './web_ui';

type Props = {
    title: string;
    id: string;
    children: React.ReactElement;
};

// Whether an element passes a data- attribute on to the page: a DOM element, or a styled component.
const takesDataAttributes = (element: React.ReactElement) => typeof element.type === 'string' || Boolean((element.type as unknown as {styledComponentId?: string})?.styledComponentId);

/**
 * Tip gives its child a tooltip: the Fusion UI's (a data-am-tip attribute, which Fusion shows above any element under
 * the pointer or the keyboard, and below it when there's no room above, as in the panel's toolbar at the top of the
 * window) under Fusion, the classic tooltip (which flips the same way) under the classic UI.
 */
const Tip = ({title, id, children}: Props) => {
    if (isFusionUI() && takesDataAttributes(children)) {
        return React.cloneElement(children, {'data-am-tip': title} as Record<string, string>);
    }

    return (
        <ClassicTooltip
            id={id}
            title={title}
        >
            {children}
        </ClassicTooltip>
    );
};

/**
 * WithTooltip is the classic UI's tooltip (@mattermost/shared), which shows Fusion's under the Fusion UI when it can:
 * a plain text tooltip on an element that takes a data-am-tip attribute. Others (with a hint, a shortcut, an emoji,
 * or rich content) keep the classic one.
 */
export const WithTooltip = (props: ComponentProps<typeof ClassicTooltip>) => {
    const {title, hint, shortcut, emoji, disabled, children} = props;
    const plain = typeof title === 'string' && !hint && !shortcut && !emoji;
    if (isFusionUI() && plain && !disabled && React.isValidElement(children) && takesDataAttributes(children)) {
        return React.cloneElement(children, {'data-am-tip': title} as Record<string, string>);
    }

    return <ClassicTooltip {...props}/>;
};

export default Tip;
