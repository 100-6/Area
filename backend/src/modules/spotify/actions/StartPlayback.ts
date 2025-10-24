import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to start or resume playback on Spotify
 * Only available for Spotify Premium accounts
 */
export class StartPlaybackAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'start_playback';
    }

    getDescription(): string {
        return 'Start a new context or resume current playback on Spotify (Premium only)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    title: 'Device ID (Optional)',
                    description: 'Specific device ID to start playback on. If not provided, uses the currently active device.'
                },
                contextUri: {
                    type: 'string',
                    title: 'Context URI (Optional)',
                    description: 'Spotify URI of context to play (album, artist, playlist). Leave empty to resume current playback.'
                },
                trackUris: {
                    type: 'array',
                    title: 'Track URIs (Optional)',
                    description: 'Array of Spotify track URIs to play. Alternative to contextUri.',
                    items: { type: 'string' }
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether playback started successfully' },
                message: { type: 'string', description: 'Status message' },
                deviceId: { type: 'string', description: 'Device ID where playback started' },
                contextUri: { type: 'string', description: 'Context URI that was played (if provided)' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['user-modify-playback-state'];
    }

    validate(config: ActionConfig): boolean {
        // All parameters are optional - can just resume playback
        return true;
    }

    /**
     * Execute the start playback action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[StartPlayback] Executing action for user ${context.userId}`.cyan);

            // Get user's Spotify access token
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'spotify'
            );

            if (!spotifyAuth || !spotifyAuth.access_token) {
                throw new Error('Spotify not connected. Please authenticate with Spotify.');
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Replace variables
            let deviceId = config.deviceId;
            if (deviceId) {
                deviceId = this.replaceVariables(deviceId, context);
            }

            let contextUri = config.contextUri;
            if (contextUri) {
                contextUri = this.replaceVariables(contextUri, context);
            }

            // Start or resume playback
            await apiService.startPlayback(accessToken, deviceId, contextUri, config.trackUris);

            const message = contextUri 
                ? `Successfully started playback with context: ${contextUri}`
                : config.trackUris && config.trackUris.length > 0
                    ? `Successfully started playback with ${config.trackUris.length} track(s)`
                    : 'Successfully resumed playback';

            console.log(`[StartPlayback] ✅ ${message}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: message,
                    deviceId: deviceId || 'active device',
                    contextUri: contextUri
                }
            };
        } catch (error: any) {
            console.error(`[StartPlayback] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to start playback'
            };
        }
    }
}
