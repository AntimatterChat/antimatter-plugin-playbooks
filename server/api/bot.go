// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/pkg/errors"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-plugin-playbooks/server/app"
	"github.com/mattermost/mattermost-plugin-playbooks/server/bot"
	"github.com/mattermost/mattermost-plugin-playbooks/server/config"
	"github.com/mattermost/mattermost/server/public/model"

	"github.com/mattermost/mattermost/server/public/pluginapi"
)

type BotHandler struct {
	*ErrorHandler
	pluginAPI          *pluginapi.Client
	poster             bot.Poster
	config             config.Service
	playbookRunService app.PlaybookRunService
	userInfoStore      app.UserInfoStore
}

func NewBotHandler(router *mux.Router, api *pluginapi.Client, poster bot.Poster, config config.Service, playbookRunService app.PlaybookRunService, userInfoStore app.UserInfoStore) *BotHandler {
	handler := &BotHandler{
		ErrorHandler:       &ErrorHandler{},
		pluginAPI:          api,
		poster:             poster,
		config:             config,
		playbookRunService: playbookRunService,
		userInfoStore:      userInfoStore,
	}

	botRouter := router.PathPrefix("/bot").Subrouter()

	botRouter.HandleFunc("/connect", withContext(handler.connect)).Methods(http.MethodGet)

	return handler
}

type DigestSenderParams struct {
	isWeekly bool
}

// connect handles the GET /bot/connect endpoint (a notification sent when the client wakes up or reconnects)
func (h *BotHandler) connect(c *Context, w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-ID")

	info, err := h.userInfoStore.Get(userID)
	if errors.Is(err, app.ErrNotFound) {
		info = app.UserInfo{
			ID: userID,
		}
	} else if err != nil {
		h.HandleError(w, c.logger, err)
		return
	}

	var timezone *time.Location
	offset, _ := strconv.Atoi(r.Header.Get("X-Timezone-Offset"))
	timezone = time.FixedZone("local", offset*60*60)

	sendRegularDigest := h.createDigestSender(c, w, userID, &info)

	// we want to first try a weekly digest
	// if we have already sent it this week, try with a daily one
	currentTime := time.UnixMilli(model.GetMillis()).In(timezone)
	if app.ShouldSendWeeklyDigestMessage(info, timezone, currentTime) {
		sendRegularDigest(DigestSenderParams{isWeekly: true})
	} else if app.ShouldSendDailyDigestMessage(info, timezone, currentTime) {
		sendRegularDigest(DigestSenderParams{isWeekly: false})
	}
}

func (h *BotHandler) createDigestSender(c *Context, w http.ResponseWriter, userID string, userInfo *app.UserInfo) func(DigestSenderParams) {
	return func(params DigestSenderParams) {
		regulartity := "daily"
		if params.isWeekly {
			regulartity = "weekly"
		}

		if err := h.playbookRunService.DMTodoDigestToUser(userID, false, params.isWeekly); err != nil {
			h.HandleError(w, c.logger, errors.Wrapf(err, "failed to send '%s' DMTodoDigest to userID '%s'", regulartity, userID))
			return
		}

		// Only stamp LastDailyTodoDMAt after a successful send so a failed DM is retried
		// on the next connect (e.g. post-too-long or transient CreatePost errors).
		userInfo.LastDailyTodoDMAt = model.GetMillis()
		if err := h.userInfoStore.Upsert(*userInfo); err != nil {
			h.HandleError(w, c.logger, err)
			return
		}
	}
}
