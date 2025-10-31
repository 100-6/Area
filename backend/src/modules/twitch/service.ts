import { BaseModule } from '../_base/BaseModule';
import { TwitchApiService } from './TwitchApiService';
import twitchConfig from './config';
import {
    OnStreamStartTrigger,
    OnNewFollowerTrigger,
    OnRaidTrigger,
    OnSubscriptionTrigger,
    OnViewerMilestoneTrigger,
    OnChannelPointsRedemptionTrigger
} from './triggers/_index';
import {
    SendChatMessageAction,
    UpdateStreamTitleAction,
    CreateClipAction,
    CreatePollAction,
    SendShoutoutAction,
    BanUserAction,
    CreatePredictionAction,
    UpdateChatSettingsAction
} from './actions/_index';
import 'colors';

/**
 * Main Twitch Module - Handles complete Twitch integration
 *
 * This module orchestrates all Twitch-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 */
export class TwitchModule extends BaseModule {
    private apiService: TwitchApiService;

    constructor() {
        super({
            name: twitchConfig.name,
            displayName: twitchConfig.displayName,
            description: twitchConfig.description,
            iconUrl: twitchConfig.iconUrl,
            color: twitchConfig.color,
            authType: twitchConfig.authType as 'oauth2',
            isActive: twitchConfig.isActive
        });

        this.apiService = new TwitchApiService();
    }

    getName(): string {
        return 'twitch';
    }

    /**
     * Get the Twitch API service instance
     */
    getApiService(): TwitchApiService {
        return this.apiService;
    }

    /**
     * Initializes the Twitch module at server startup
     */
    async initialize(): Promise<void> {
        console.log('[Twitch] Initializing Twitch module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnStreamStartTrigger(this.apiService));
            this.registerTrigger(new OnNewFollowerTrigger(this.apiService));
            this.registerTrigger(new OnRaidTrigger(this.apiService));
            this.registerTrigger(new OnSubscriptionTrigger(this.apiService));
            this.registerTrigger(new OnViewerMilestoneTrigger(this.apiService));
            this.registerTrigger(new OnChannelPointsRedemptionTrigger(this.apiService));

            // Register actions
            this.registerAction(new SendChatMessageAction(this.apiService));
            this.registerAction(new UpdateStreamTitleAction(this.apiService));
            this.registerAction(new CreateClipAction(this.apiService));
            this.registerAction(new CreatePollAction(this.apiService));
            this.registerAction(new SendShoutoutAction(this.apiService));
            this.registerAction(new BanUserAction(this.apiService));
            this.registerAction(new CreatePredictionAction(this.apiService));
            this.registerAction(new UpdateChatSettingsAction(this.apiService));

            console.log('[Twitch] ✓ Module initialized successfully'.green);
        } catch (error) {
            console.error('[Twitch] ✗ Module initialization failed:'.red, error);
            throw error;
        }
    }

    /**
     * Cleanup resources when module is stopped
     */
    async cleanup(): Promise<void> {
        console.log('[Twitch] Shutting down Twitch module...'.yellow);
        // Stop all active triggers
        await super.cleanup();
        console.log('[Twitch] ✓ Module shutdown complete'.green);
    }
}
