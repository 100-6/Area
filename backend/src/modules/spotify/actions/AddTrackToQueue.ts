import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to add a track to the end of the current playback queue on Spotify
 * Only available for Spotify Premium accounts
 */
export class AddTrackToQueueAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'add_track_to_queue';
    }

    getDescription(): string {
        return 'Add a track to the end of current playback queue on Spotify (Premium only)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['trackUri'],
            properties: {
                trackUri: {
                    type: 'string',
                    title: 'Track URI',
                    description: 'Spotify track URI (e.g., spotify:track:6rqhFgbbKwnb9MLmUQDhG6) or track ID'
                },
                deviceId: {
                    type: 'string',
                    title: 'Device ID (Optional)',
                    description: 'Specific device ID to add track to queue. If not provided, uses the currently active device.'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the track was added successfully' },
                message: { type: 'string', description: 'Status message' },
                trackUri: { type: 'string', description: 'URI of the track that was added' },
                deviceId: { type: 'string', description: 'Device ID where track was added' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['user-modify-playback-state'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.trackUri || typeof config.trackUri !== 'string' || config.trackUri.trim() === '') {
            throw new Error('trackUri is required and must be a non-empty string');
        }
        return true;
    }

    /**
     * Execute the add track to queue action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[AddTrackToQueue] Executing action for user ${context.userId}`.cyan);

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

            // Replace variables in trackUri and deviceId
            let trackUri = this.replaceVariables(config.trackUri, context);
            let deviceId = config.deviceId;
            if (deviceId) {
                deviceId = this.replaceVariables(deviceId, context);
            }

            // Convert track ID to URI if needed
            if (!trackUri.startsWith('spotify:track:')) {
                trackUri = `spotify:track:${trackUri}`;
            }

            // Add track to queue
            await apiService.addToQueue(accessToken, trackUri, deviceId);

            console.log(`[AddTrackToQueue] ✅ Successfully added track to queue: ${trackUri}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully added track to queue',
                    trackUri: trackUri,
                    deviceId: deviceId || 'active device'
                }
            };
        } catch (error: any) {
            console.error(`[AddTrackToQueue] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to add track to queue'
            };
        }
    }
}
