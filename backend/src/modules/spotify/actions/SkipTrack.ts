import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to skip to the next track in Spotify playback queue
 * Only available for Spotify Premium accounts
 */
export class SkipTrackAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'skip_track';
    }

    getDescription(): string {
        return 'Skip to next track in the current playback queue on Spotify (Premium only)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    title: 'Device ID (Optional)',
                    description: 'Specific device ID to skip on. If not provided, uses the currently active device.'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the skip was successful' },
                message: { type: 'string', description: 'Status message' },
                deviceId: { type: 'string', description: 'Device ID where track was skipped' }
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
     * Execute the skip track action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SkipTrack] Executing action for user ${context.userId}`.cyan);

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

            // Skip to next track
            await apiService.skipToNext(accessToken, deviceId);

            console.log(`[SkipTrack] ✅ Successfully skipped to next track`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully skipped to next track',
                    deviceId: deviceId || 'active device'
                }
            };
        } catch (error: any) {
            console.error(`[SkipTrack] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to skip track'
            };
        }
    }
}
