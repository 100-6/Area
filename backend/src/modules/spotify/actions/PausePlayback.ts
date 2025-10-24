import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to pause current playback on Spotify
 * Only available for Spotify Premium accounts
 */
export class PausePlaybackAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'pause_playback';
    }

    getDescription(): string {
        return 'Pause current playback on Spotify (Premium only)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    title: 'Device ID (Optional)',
                    description: 'Specific device ID to pause. If not provided, pauses the currently active device.'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the pause was successful' },
                message: { type: 'string', description: 'Status message' },
                deviceId: { type: 'string', description: 'Device ID where playback was paused' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['user-modify-playback-state'];
    }

    validate(config: ActionConfig): boolean {
        // deviceId is optional, no strict validation needed
        return true;
    }

    /**
     * Execute the pause playback action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[PausePlayback] Executing action for user ${context.userId}`.cyan);

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

            // Replace variables in deviceId if provided
            let deviceId = config.deviceId;
            if (deviceId) {
                deviceId = this.replaceVariables(deviceId, context);
            }

            // Pause playback
            await apiService.pausePlayback(accessToken, deviceId);

            console.log(`[PausePlayback] ✅ Successfully paused playback`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully paused playback',
                    deviceId: deviceId || 'active device'
                }
            };
        } catch (error: any) {
            console.error(`[PausePlayback] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to pause playback'
            };
        }
    }
}
