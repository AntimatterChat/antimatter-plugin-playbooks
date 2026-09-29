// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package bot

import (
	"encoding/json"
	"fmt"

	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"

	"github.com/mattermost/mattermost/server/public/model"
)

// PostMessage posts a message to a specified channel.
func (b *Bot) PostMessage(channelID, format string, args ...interface{}) (*model.Post, error) {
	post := &model.Post{
		Message:   fmt.Sprintf(format, args...),
		UserId:    b.botUserID,
		ChannelId: channelID,
	}
	if err := b.pluginAPI.Post.CreatePost(post); err != nil {
		return nil, err
	}
	return post, nil
}

// Post posts a custom post. The Message and ChannelId fields should be provided in the specified
// post
func (b *Bot) Post(post *model.Post) error {
	if post.Message == "" {
		return fmt.Errorf("the post does not contain a message")
	}

	if !model.IsValidId(post.ChannelId) {
		return fmt.Errorf("the post does not contain a valid ChannelId")
	}

	post.UserId = b.botUserID

	return b.pluginAPI.Post.CreatePost(post)
}

// PostMessageToThread posts a message to a specified thread identified by rootPostID.
// If the rootPostID is blank, or the rootPost is deleted, it will create a standalone post. The
// overwritten post's RootID will be the correct rootID (save that if you want to continue the thread).
func (b *Bot) PostMessageToThread(rootPostID string, post *model.Post) error {
	rootID := ""
	if rootPostID != "" {
		root, err := b.pluginAPI.Post.GetPost(rootPostID)
		if err == nil && root != nil && root.DeleteAt == 0 {
			rootID = root.Id
		}
	}

	post.UserId = b.botUserID
	post.RootId = rootID

	return b.pluginAPI.Post.CreatePost(post)
}

// PostMessageWithAttachments posts a formatted message with attachments []*model.MessageAttachment to channelID.
// The message is formatted using format and args, and the created *model.Post is returned on success.
func (b *Bot) PostMessageWithAttachments(channelID string, attachments []*model.MessageAttachment, format string, args ...interface{}) (*model.Post, error) {
	post := &model.Post{
		Message:   fmt.Sprintf(format, args...),
		UserId:    b.botUserID,
		ChannelId: channelID,
	}
	model.ParseMessageAttachment(post, attachments)
	if err := b.pluginAPI.Post.CreatePost(post); err != nil {
		return nil, err
	}
	return post, nil
}

func (b *Bot) PostCustomMessageWithAttachments(channelID, customType string, attachments []*model.MessageAttachment, message string) (*model.Post, error) {
	post := &model.Post{
		Message:   message,
		UserId:    b.botUserID,
		ChannelId: channelID,
		Type:      customType,
	}
	model.ParseMessageAttachment(post, attachments)
	if err := b.pluginAPI.Post.CreatePost(post); err != nil {
		return nil, err
	}
	return post, nil
}

func (b *Bot) PostCustomMessageWithAttachmentsf(channelID, customType string, attachments []*model.MessageAttachment, format string, args ...interface{}) (*model.Post, error) {
	return b.PostCustomMessageWithAttachments(channelID, customType, attachments, fmt.Sprintf(format, args...))
}

// DM sends a DM from the plugin bot to the specified user
func (b *Bot) DM(userID string, post *model.Post) error {
	channel, err := b.pluginAPI.Channel.GetDirect(userID, b.botUserID)
	if err != nil {
		return errors.Wrapf(err, "failed to get bot DM channel with user_id %s", userID)
	}
	post.ChannelId = channel.Id
	post.UserId = b.botUserID

	return b.pluginAPI.Post.CreatePost(post)
}

// EphemeralPost sends an ephemeral message to a user
func (b *Bot) EphemeralPost(userID, channelID string, post *model.Post) {
	post.UserId = b.botUserID
	post.ChannelId = channelID

	b.pluginAPI.Post.SendEphemeralPost(userID, post)
}

// SystemEphemeralPost sends an ephemeral message to a user authored by the System
func (b *Bot) SystemEphemeralPost(userID, channelID string, post *model.Post) {
	post.ChannelId = channelID

	b.pluginAPI.Post.SendEphemeralPost(userID, post)
}

// EphemeralPostWithAttachments sends an ephemeral message to userID in channelID with message attachments.
func (b *Bot) EphemeralPostWithAttachments(userID, channelID, postID string, attachments []*model.MessageAttachment, format string, args ...interface{}) {
	post := &model.Post{
		Message:   fmt.Sprintf(format, args...),
		UserId:    b.botUserID,
		ChannelId: channelID,
		RootId:    postID,
	}

	model.ParseMessageAttachment(post, attachments)
	b.pluginAPI.Post.SendEphemeralPost(userID, post)
}

// publishWebsocketEvent marshals payload and dispatches the event with the given broadcast scope.
func (b *Bot) publishWebsocketEvent(event string, payload interface{}, broadcast *model.WebsocketBroadcast) {
	payloadMap := b.makePayloadMap(payload)
	b.pluginAPI.Frontend.PublishWebSocketEvent(event, payloadMap, broadcast)
}

// PublishWebsocketEventToTeam sends a websocket event with payload to teamID
func (b *Bot) PublishWebsocketEventToTeam(event string, payload interface{}, teamID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		TeamId: teamID,
	})
}

// PublishWebsocketEventToTeamReliable sends a websocket event with payload to teamID over the
// reliable, TCP-backed cluster channel. See PublishWebsocketEventToChannelReliable.
func (b *Bot) PublishWebsocketEventToTeamReliable(event string, payload interface{}, teamID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		TeamId:              teamID,
		ReliableClusterSend: true,
	})
}

// PublishWebsocketEventToChannel sends a websocket event with payload to channelID
func (b *Bot) PublishWebsocketEventToChannel(event string, payload interface{}, channelID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		ChannelId: channelID,
	})
}

// PublishWebsocketEventToChannelReliable sends a websocket event with payload to channelID over the
// reliable, TCP-backed cluster channel. Use for essential, low-frequency events that must not be
// dropped or truncated by the best-effort UDP path (which can drop packets and caps the marshalled
// event at ~49KB). Keep high-frequency events on the best-effort path so they don't saturate the
// shared reliable channel.
func (b *Bot) PublishWebsocketEventToChannelReliable(event string, payload interface{}, channelID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		ChannelId:           channelID,
		ReliableClusterSend: true,
	})
}

// PublishWebsocketEventToUser sends a websocket event with payload to userID
func (b *Bot) PublishWebsocketEventToUser(event string, payload interface{}, userID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		UserId: userID,
	})
}

// PublishWebsocketEventToUserReliable sends a websocket event with payload to userID over the
// reliable, TCP-backed cluster channel. See PublishWebsocketEventToChannelReliable.
func (b *Bot) PublishWebsocketEventToUserReliable(event string, payload interface{}, userID string) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		UserId:              userID,
		ReliableClusterSend: true,
	})
}

// PublishWebsocketEventGlobal sends a websocket event with payload to all connected users
func (b *Bot) PublishWebsocketEventGlobal(event string, payload interface{}) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{})
}

// PublishWebsocketEventGlobalReliable sends a websocket event with payload to all connected users
// over the reliable, TCP-backed cluster channel. See PublishWebsocketEventToChannelReliable.
func (b *Bot) PublishWebsocketEventGlobalReliable(event string, payload interface{}) {
	b.publishWebsocketEvent(event, payload, &model.WebsocketBroadcast{
		ReliableClusterSend: true,
	})
}

func (b *Bot) IsFromPoster(post *model.Post) bool {
	return post.UserId == b.botUserID
}

func (b *Bot) makePayloadMap(payload interface{}) map[string]interface{} {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		logrus.WithError(err).Error("could not marshall payload")
		payloadJSON = []byte("null")
	}
	return map[string]interface{}{"payload": string(payloadJSON)}
}
