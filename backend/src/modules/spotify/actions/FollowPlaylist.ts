import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to follow a Spotify playlist
 * Accepts Spotify Playlist IDs
 */
export class FollowPlaylistAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'follow_playlist';
    }

    getDescription(): string {
        return 'Follow a playlist you specify (accepts Spotify Playlist IDs)';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['playlistId'],
            properties: {
                playlistId: {
                    type: 'string',
                    title: 'Playlist ID',
                    description: 'Spotify playlist ID to follow (from playlist URL: spotify.com/playlist/[ID])'
                },
                isPublic: {
                    type: 'boolean',
                    title: 'Follow Publicly',
                    default: true,
                    description: 'Whether to follow the playlist publicly (visible to followers) or privately'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the playlist was followed successfully' },
                message: { type: 'string', description: 'Status message' },
                playlistId: { type: 'string', description: 'ID of the followed playlist' },
                isPublic: { type: 'boolean', description: 'Whether the follow is public' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['playlist-modify-public', 'playlist-modify-private'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.playlistId || typeof config.playlistId !== 'string' || config.playlistId.trim() === '') {
            throw new Error('playlistId is required and must be a non-empty string');
        }
        return true;
    }

    /**
     * Execute the follow playlist action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[FollowPlaylist] Executing action for user ${context.userId}`.cyan);

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

            // Replace variables in playlistId
            const playlistId = this.replaceVariables(config.playlistId, context);
            const isPublic = config.isPublic !== undefined ? config.isPublic : true;

            // Follow the playlist
            await apiService.followPlaylist(accessToken, playlistId, isPublic);

            console.log(`[FollowPlaylist] ✅ Successfully followed playlist: ${playlistId}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully followed playlist',
                    playlistId: playlistId,
                    isPublic: isPublic
                }
            };
        } catch (error: any) {
            console.error(`[FollowPlaylist] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to follow playlist'
            };
        }
    }
}
