// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {createPath, parsePath} from 'history';

import {isPanelPath, openPlaybooksPanel} from 'src/panel/history';

// @ts-ignore
const WebappUtils = window.WebappUtils;

type PathLike = {
    pathname: string;
    search: string;
}

// Antimatter: Playbooks' pages (/playbooks/...) are views of its side panel: going to one opens the panel on it, in
// the current channel. The other paths are the app's.
export const navigateToUrl = (urlPath: string | PathLike) => {
    const path = typeof urlPath === 'string' ? urlPath : createPath(urlPath);
    if (isPanelPath(parsePath(path).pathname ?? '')) {
        openPlaybooksPanel(path);
        return;
    }
    WebappUtils.browserHistory.push(urlPath);
};

export const pluginUrl = (urlPath: string) => {
    return '/playbooks' + urlPath;
};

export const navigateToPluginUrl = (urlPath: string) => {
    openPlaybooksPanel(pluginUrl(urlPath));
};

/**
 * Navigate to channel given a channelId and teamName
 */
export const navigateToChannel = async (teamName: string, channelId: string) => {
    navigateToUrl(`/${teamName}/channels/${channelId}`);
};

export const pluginErrorUrl = (type: string) => {
    return pluginUrl(`/error?type=${type}`);
};

export const handleFormattedTextClick = (e: React.MouseEvent<HTMLElement, MouseEvent>, currentRelativeTeamUrl: string) => {
    // @ts-ignore
    const channelMentionAttribute = e.target.getAttributeNode('data-channel-mention');

    if (channelMentionAttribute) {
        e.preventDefault();
        navigateToUrl(currentRelativeTeamUrl + '/channels/' + channelMentionAttribute.value);
    }
};
