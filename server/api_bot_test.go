// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/model"
)

func TestBotConnect(t *testing.T) {
	e := Setup(t)
	e.CreateBasic()

	// e.RegularUser already owns BasicRun from e.CreateBasic() (via CreateBasicRun()), so
	// there's something to digest here without any extra setup.
	botUser, _, err := e.ServerAdminClient.GetUserByUsername(context.Background(), "playbooks", "")
	require.NoError(t, err)

	dmChannel, _, err := e.ServerClient.CreateDirectChannel(context.Background(), botUser.Id, e.RegularUser.Id)
	require.NoError(t, err)

	var digestPost *model.Post

	t.Run("digest due for a user connecting for the first time", func(t *testing.T) {
		resp, err := e.DoPluginAPIRequestWithHeaders(context.Background(), e.ServerClient, http.MethodGet, "/api/v0/bot/connect", "", nil)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// The bot posts the digest DM synchronously within connect() (Bot.DM ->
		// pluginAPI.Post.CreatePost, no goroutine/queue), so it's already there by the
		// time the HTTP response comes back — no need to poll or wait for it.
		posts, _, err := e.ServerClient.GetPostsForChannel(context.Background(), dmChannel.Id, 0, 10, "", false, false)
		require.NoError(t, err)
		require.NotEmpty(t, posts.Order, "expected the bot to have DMed a digest")
		digestPost = posts.Posts[posts.Order[0]]
		assert.Equal(t, botUser.Id, digestPost.UserId)
		assert.NotEmpty(t, digestPost.Message)
	})

	t.Run("no digest due immediately after the first connect", func(t *testing.T) {
		require.NotNil(t, digestPost, "expected the first subtest to have found a digest post")

		// The first subtest's connect() call already persisted LastDailyTodoDMAt = now
		// after a successful DM, so calling connect() again moments later deterministically
		// finds both ShouldSendWeeklyDigestMessage (same ISO week) and
		// ShouldSendDailyDigestMessage (well under an hour elapsed) false — no need for a
		// second user or settings.
		resp, err := e.DoPluginAPIRequestWithHeaders(context.Background(), e.ServerClient, http.MethodGet, "/api/v0/bot/connect", "", nil)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// GetPostsSince is exclusive (server queries UpdateAt > since), so digestPost
		// itself won't reappear here.
		sincePosts, _, err := e.ServerClient.GetPostsSince(context.Background(), dmChannel.Id, digestPost.UpdateAt, false)
		require.NoError(t, err)
		assert.Empty(t, sincePosts.Order, "expected no digest on the second immediate connect")
	})
}
