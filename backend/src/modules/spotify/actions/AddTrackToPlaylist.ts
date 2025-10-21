import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to add a track to a specified Spotify playlist by track ID
 */
export class AddTrackToPlaylistAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'add_track_to_playlist';
    }

    getDescription(): string {
        return 'Add a track to a playlist given a track ID';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['playlistId', 'trackId'],
            properties: {
                playlistId: {
                    type: 'string',
                    title: 'Playlist ID',
                    description: 'Spotify playlist ID (from playlist URL: spotify.com/playlist/[ID])'
                },
                trackId: {
                    type: 'string',
                    title: 'Track ID',
                    description: 'Spotify track ID or URI to add to the playlist'
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
                playlistId: { type: 'string', description: 'Playlist ID where track was added' },
                trackUri: { type: 'string', description: 'URI of the track that was added' }
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
        if (!config.trackId || typeof config.trackId !== 'string' || config.trackId.trim() === '') {
            throw new Error('trackId is required and must be a non-empty string');
        }
        return true;
    }

    /**
     * Execute the add track to playlist action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[AddTrackToPlaylist] Executing action for user ${context.userId}`.cyan);

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

            // Replace variables in playlistId and trackId
            let playlistId = this.replaceVariables(config.playlistId, context);
            let trackId = this.replaceVariables(config.trackId, context);

            // Convert track ID to URI if needed
            let trackUri = trackId;
            if (!trackUri.startsWith('spotify:track:')) {
                trackUri = `spotify:track:${trackId}`;
            }

            // Add track to playlist
            await apiService.addTrackToPlaylist(accessToken, playlistId, trackUri);

            console.log(`[AddTrackToPlaylist] ✅ Successfully added track ${trackUri} to playlist ${playlistId}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully added track to playlist',
                    playlistId: playlistId,
                    trackUri: trackUri
                }
            };
        } catch (error: any) {
            console.error(`[AddTrackToPlaylist] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to add track to playlist'
            };
        }
    }
}
