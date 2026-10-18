// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The view of a channel's runs (the panel's first view, PANEL_HOME) the person was last on, by channel: a run's
// checklist, or the list of the channel's runs. It outlives the view (going to another view of the panel and back)
// and the panel (closing it and opening it again), for the page's life, so that the panel shows what the person
// chose instead of opening the channel's run again.
//
// The panel opens a channel's only run in progress by itself just once: the first time it shows the channel's runs,
// if the channel has one then. Going back to the list is a choice too, which stays.

export type ChannelView = {

    // The run whose checklist shows; none for the list of the channel's runs.
    runId?: string;
};

const views = new Map<string, ChannelView>();

// getChannelView is the view the person was last on in a channel, if any.
export function getChannelView(channelId: string): ChannelView | undefined {
    return views.get(channelId);
}

// setChannelView remembers the view a channel's runs show: a run's checklist, or the list (no runId).
export function setChannelView(channelId: string, runId?: string) {
    if (channelId) {
        views.set(channelId, {runId});
    }
}

// firstChannelView is the view a channel's runs start on the first time the panel shows them, once its runs in
// progress are known and before the person chose a view there: its only run in progress, or the list. Undefined
// when the channel already has its view (or its runs aren't known yet): the panel then never opens a run by itself.
export function firstChannelView(channelId: string, runsInProgress?: Array<{id: string}>): ChannelView | undefined {
    if (!channelId || !runsInProgress || views.has(channelId)) {
        return undefined;
    }
    return {runId: runsInProgress.length === 1 ? runsInProgress[0].id : undefined};
}

// forgetChannelViews forgets every channel's view (for the tests).
export function forgetChannelViews() {
    views.clear();
}
