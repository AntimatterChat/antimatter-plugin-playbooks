// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Root, createRoot} from 'react-dom/client';
import {Unsubscribe} from 'redux';

import {WebSocketEvents} from '@mattermost/client';
import {GlobalState} from '@mattermost/types/store';
import {Client4} from 'mattermost-redux/client';
import {General} from 'mattermost-redux/constants';
import {FormattedMessage} from 'react-intl';
import {ApolloClient, NormalizedCacheObject} from '@apollo/client';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {Store} from 'src/types/store';

import {playbooksAppIconURL} from 'src/components/assets/icons/playbooks_product_icon';
import {GlobalSelectStyle} from 'src/components/backstage/styles';
import LoginHook from 'src/components/login_hook';
import BetaFeaturesSetting from 'src/components/backstage/beta_features_setting';
import {isConfiguredForDevelopment, isPlaybookRunRHSOpen} from 'src/selectors';
import {makeRHSOpener} from 'src/rhs_opener';
import {makeWelcomeMessagePoster} from 'src/welcome_message_poster';
import {makeSlashCommandHook} from 'src/slash_command';
import {RetrospectiveFirstReminder, RetrospectiveReminder} from 'src/components/retrospective_reminder_posts';
import manifest from 'src/manifest';
import {ChannelHeaderButton, ChannelHeaderText, ChannelHeaderTooltip} from 'src/components/channel_header';
import {makeAttachToPlaybookRunAction, makeStartPlaybookRunAction} from 'src/components/post_menu';
import ChannelActionsModal from 'src/components/channel_actions_modal';
import {
    actionSetGlobalSettings,
    publishTemplates,
    setToggleRHSAction,
    showChannelActionsModal,
} from 'src/actions';
import reducer from 'src/reducer';
import {
    handleReconnect,
    handleWebsocketChannelUpdated,
    handleWebsocketConditionCreated,
    handleWebsocketConditionDeleted,
    handleWebsocketConditionUpdated,
    handleWebsocketPlaybookArchived,
    handleWebsocketPlaybookCreated,
    handleWebsocketPlaybookRestored,
    handleWebsocketPlaybookRunCreated,
    handleWebsocketPlaybookRunUpdated,
    handleWebsocketPlaybookRunUpdatedIncremental,
    handleWebsocketPostEditedOrDeleted,
    handleWebsocketSettingsChanged,
    handleWebsocketUserAdded,
    handleWebsocketUserRemoved,
} from 'src/websocket_events';
import {
    WEBSOCKET_CONDITION_CREATED,
    WEBSOCKET_CONDITION_DELETED,
    WEBSOCKET_CONDITION_UPDATED,
    WEBSOCKET_PLAYBOOK_ARCHIVED,
    WEBSOCKET_PLAYBOOK_CREATED,
    WEBSOCKET_PLAYBOOK_RESTORED,
    WEBSOCKET_PLAYBOOK_RUN_CREATED,
    WEBSOCKET_PLAYBOOK_RUN_UPDATED,
    WEBSOCKET_PLAYBOOK_RUN_UPDATED_INCREMENTAL,
    WEBSOCKET_SETTINGS_CHANGED,
} from 'src/types/websocket_events';
import {
    fetchGlobalSettings,
    fetchSiteStats,
    getMyTopPlaybooks,
    getSiteUrl,
    getTeamTopPlaybooks,
    notifyConnect,
    setSiteUrl,
} from 'src/client';
import PlaybooksPanel from 'src/panel/panel';
import OldUrlRedirect from 'src/panel/old_urls';
import {openPanel, setPanelControls} from 'src/panel/history';
import {installLinkInterceptor} from 'src/panel/link_interceptor';
import {UpdatePost} from 'src/components/update_post';
import UpdateRequestPost from 'src/components/update_request_post';

import {RetrospectivePost} from './components/retrospective_post';

import {setPlaybooksGraphQLClient} from './graphql_client';
import {ApolloWrapper, makeGraphqlClient} from './graphql/apollo';
import PresetTemplates from './components/templates/template_data';

type WindowObject = {
    location: {
        origin: string;
        protocol: string;
        hostname: string;
        port: string;
    };
    basename?: string;
}

// From mattermost-webapp/utils
function getSiteURLFromWindowObject(obj: WindowObject): string {
    let siteURL = '';
    if (obj.location.origin) {
        siteURL = obj.location.origin;
    } else {
        siteURL = obj.location.protocol + '//' + obj.location.hostname + (obj.location.port ? ':' + obj.location.port : '');
    }

    if (siteURL[siteURL.length - 1] === '/') {
        siteURL = siteURL.substring(0, siteURL.length - 1);
    }

    if (obj.basename) {
        siteURL += obj.basename;
    }

    if (siteURL[siteURL.length - 1] === '/') {
        siteURL = siteURL.substring(0, siteURL.length - 1);
    }

    return siteURL;
}

function getSiteURL(): string {
    return getSiteURLFromWindowObject(window);
}

// ts-prune-ignore-next
export default class Plugin {
    removeRHSListener?: Unsubscribe;
    removeChannelSwitcherListener?: Unsubscribe;
    removeLinkInterceptor?: () => void;
    activityFunc?: () => void;

    stylesContainer?: Element;
    stylesRoot?: Root;

    doRegistrations(registry: any, store: Store, graphqlClient: ApolloClient<NormalizedCacheObject>): void {
        registry.registerReducer(reducer);

        registry.registerTranslations((locale: string) => {
            try {
                // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports, no-warning-comments
                return require(`../i18n/${locale}.json`); // TODO make async, this increases bundle size exponentially
            } catch {
                return {};
            }
        });

        // Antimatter: Playbooks is an app of the side panel, without a full page (registerProduct): its runs, a run's
        // overview, its playbooks and their editor, your tasks are views of the panel. Links to the old pages open them
        // there (OldUrlRedirect and the link interceptor below).
        // The host passes its pop-out panel state (Fusion), so that the panel in a new window starts on the same view.
        // eslint-disable-next-line react/require-optimization
        const RHSWrapped = (props: {setPanelState?: (state: string | null) => void; initialPanelState?: string}) => (
            <ApolloWrapper
                component={<PlaybooksPanel {...props}/>}
                client={graphqlClient}
            />
        );
        // RHS Registration. Its title is the app's name, which the host's panel header shows: each view's title, back
        // button and actions are in the panel's own toolbar row (src/panel/panel_toolbar.tsx), not in the header.
        // The product name isn't translated.
        const {toggleRHSPlugin, showRHSPlugin} = registry.registerRightHandSidebarComponent(RHSWrapped, 'Playbooks');

        // The channel header button and the app bar icon open the panel on the view the person was last on.
        const boundToggleRHSAction = (): void => {
            openPanel(getCurrentTeamId(store.getState()));
            store.dispatch(toggleRHSPlugin);
        };
        setPanelControls({
            isOpen: () => isPlaybookRunRHSOpen(store.getState()),
            show: () => store.dispatch(showRHSPlugin),
        });

        // Store the toggleRHS action to use later
        store.dispatch(setToggleRHSAction(boundToggleRHSAction));

        // Buttons and menus
        const shouldRender = (state : GlobalState) => {
            const currentChannel = getCurrentChannel(state);
            return currentChannel && currentChannel.type !== General.GM_CHANNEL && currentChannel.type !== General.DM_CHANNEL;
        };
        registry.registerChannelHeaderButtonAction(ChannelHeaderButton, boundToggleRHSAction, ChannelHeaderText, ChannelHeaderTooltip);

        // "Channel automation", not "Channel Actions": it opens the channel's automation rules (welcome message,
        // sidebar category, playbook suggestions on keywords), not a menu of actions like a message's "More actions".
        registry.registerChannelHeaderMenuAction(<FormattedMessage defaultMessage='Channel automation…'/>, () => store.dispatch(showChannelActionsModal()), shouldRender);
        registry.registerPostDropdownMenuAction(makeStartPlaybookRunAction(store));
        registry.registerPostDropdownMenuAction(makeAttachToPlaybookRunAction(store));
        registry.registerRootComponent(ChannelActionsModal);
        registry.registerRootComponent(LoginHook);

        // System Console: Beta Features accordion (must be last among plugin settings)
        if (registry.registerAdminConsoleCustomSetting) {
            registry.registerAdminConsoleCustomSetting('BetaFeatures', BetaFeaturesSetting, {showTitle: false});
        }

        // App Bar icon
        if (registry.registerAppBarComponent) {
            registry.registerAppBarComponent(playbooksAppIconURL, boundToggleRHSAction, ChannelHeaderTooltip);
        }

        // Site statistics handler
        if (registry.registerSiteStatisticsHandler) {
            registry.registerSiteStatisticsHandler(async () => {
                const siteStats = await fetchSiteStats();
                return {
                    playbook_count: {
                        name: <FormattedMessage defaultMessage={'Total Playbooks'}/>,
                        id: 'total_playbooks',
                        icon: 'fa-book', // font-awesome-4.7.0 handler
                        value: siteStats?.total_playbooks,
                    },
                    playbook_run_count: {
                        name: <FormattedMessage defaultMessage={'Total Playbook Runs'}/>,
                        id: 'total_playbook_runs',
                        icon: 'fa-list-alt', // font-awesome-4.7.0 handler
                        value: siteStats?.total_playbook_runs,
                    },
                };
            });
        }

        // Websocket listeners
        registry.registerReconnectHandler(handleReconnect(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_RUN_UPDATED, handleWebsocketPlaybookRunUpdated(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_RUN_UPDATED_INCREMENTAL, handleWebsocketPlaybookRunUpdatedIncremental(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_RUN_CREATED, handleWebsocketPlaybookRunCreated(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_CREATED, handleWebsocketPlaybookCreated(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_ARCHIVED, handleWebsocketPlaybookArchived(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_PLAYBOOK_RESTORED, handleWebsocketPlaybookRestored(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_SETTINGS_CHANGED, handleWebsocketSettingsChanged(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_CONDITION_CREATED, handleWebsocketConditionCreated(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_CONDITION_UPDATED, handleWebsocketConditionUpdated(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WEBSOCKET_CONDITION_DELETED, handleWebsocketConditionDeleted(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WebSocketEvents.UserAdded, handleWebsocketUserAdded(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WebSocketEvents.UserRemoved, handleWebsocketUserRemoved(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WebSocketEvents.PostDeleted, handleWebsocketPostEditedOrDeleted(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WebSocketEvents.PostEdited, handleWebsocketPostEditedOrDeleted(store.getState, store.dispatch));
        registry.registerWebSocketEventHandler(WebSocketEvents.ChannelUpdated, handleWebsocketChannelUpdated(store.getState, store.dispatch));

        // Local slash commands
        registry.registerSlashCommandWillBePostedHook(makeSlashCommandHook(store));

        // The old full-page URLs (/playbooks/..., sent to /<team>/playbooks/... by the web app) open the side panel
        registry.registerNeedsTeamRoute('/', OldUrlRedirect);

        // Custom post types
        registry.registerPostTypeComponent('custom_retro_rem_first', RetrospectiveFirstReminder);
        registry.registerPostTypeComponent('custom_retro_rem', RetrospectiveReminder);
        registry.registerPostTypeComponent('custom_run_update', UpdatePost);
        registry.registerPostTypeComponent('custom_update_status', UpdateRequestPost);
        registry.registerPostTypeComponent('custom_retro', RetrospectivePost);

        // Insights handler
        if (registry.registerInsightsHandler) {
            registry.registerInsightsHandler(async (timeRange: string, page: number, perPage: number, teamId: string, insightType: string) => {
                if (insightType === 'MY') {
                    const data = await getMyTopPlaybooks(timeRange, page, perPage, teamId);

                    return data;
                }

                const data = await getTeamTopPlaybooks(timeRange, page, perPage, teamId);

                return data;
            });
        }
    }

    userActivityWatch(): void {
        // Listen for new activity to trigger a call to the server
        // Hat tip to the Github plugin
        let lastActivityTime = Number.MAX_SAFE_INTEGER;
        const activityTimeout = 60 * 60 * 1000; // 1 hour

        this.activityFunc = () => {
            const now = new Date().getTime();
            if (now - lastActivityTime > activityTimeout) {
                notifyConnect();
            }
            lastActivityTime = now;
        };
        document.addEventListener('click', this.activityFunc);
    }

    public initialize(registry: any, store: Store): void {
        this.stylesContainer = document.createElement('div');
        document.body.appendChild(this.stylesContainer);
        this.stylesRoot = createRoot(this.stylesContainer);
        this.stylesRoot.render(<><GlobalSelectStyle/></>);

        // Consume the SiteURL so that the client is subpath aware. We also do this for Client4
        // in our version of the mattermost-redux, since webapp only does it in its copy.
        const siteUrl = getSiteURL();
        setSiteUrl(siteUrl);
        Client4.setUrl(siteUrl);

        // Setup our graphql client
        const isDev = isConfiguredForDevelopment(store.getState());
        const graphqlClient = makeGraphqlClient(isDev);

        // Store graphql client for bad modals.
        setPlaybooksGraphQLClient(graphqlClient);

        this.doRegistrations(registry, store, graphqlClient);

        // MM-48872
        // This is handled by LoginHook, but it doesn't seem compatible with e2e tests.
        // Grab global settings
        const getGlobalSettings = async () => {
            store.dispatch(actionSetGlobalSettings(await fetchGlobalSettings()));
        };
        getGlobalSettings();

        this.userActivityWatch();

        // Links to the old full page, in messages and dialogs, open the side panel.
        this.removeLinkInterceptor = installLinkInterceptor({getSiteURL: getSiteUrl});

        // Listen for channel changes and open the RHS when appropriate.
        this.removeRHSListener = store.subscribe(makeRHSOpener(store, graphqlClient));

        // Listen for channel changes to trigger welcome actions when appropriate.
        this.removeChannelSwitcherListener = store.subscribe(makeWelcomeMessagePoster(store));

        // publish templates
        store.dispatch(publishTemplates(PresetTemplates));
    }

    public uninitialize() {
        if (this.removeRHSListener) {
            this.removeRHSListener();
            delete this.removeRHSListener;
        }
        if (this.removeChannelSwitcherListener) {
            this.removeChannelSwitcherListener();
            delete this.removeChannelSwitcherListener;
        }
        if (this.removeLinkInterceptor) {
            this.removeLinkInterceptor();
            delete this.removeLinkInterceptor;
        }
        setPanelControls(null);
        if (this.activityFunc) {
            document.removeEventListener('click', this.activityFunc);
            delete this.activityFunc;
        }
        if (this.stylesRoot) {
            this.stylesRoot.unmount();
            delete this.stylesRoot;
        }
    }
}

// @ts-ignore
window.registerPlugin(manifest.id, new Plugin());
