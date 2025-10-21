import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to search for a track and add it to a playlist
 * Adds the first matching result to the specified playlist
 */
export class AddTrackToPlaylistBySearchAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'add_track_to_playlist_by_search';
    }

    getDescription(): string {
        return 'Search for a track and add the first matching result to a playlist you specify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['playlistId', 'searchQuery'],
            properties: {
                playlistId: {
                    type: 'string',
                    title: 'Playlist ID',
                    description: 'Spotify playlist ID to add the track to (from playlist URL: spotify.com/playlist/[ID])'
                },
                searchQuery: {
                    type: 'string',
                    title: 'Track Search Query',
                    description: 'Search query for the track (e.g., "Bohemian Rhapsody Queen", "artist:Drake track:Hotline Bling")'
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
                trackId: { type: 'string', description: 'ID of the added track' },
                trackName: { type: 'string', description: 'Name of the added track' },
                artists: { 
                    type: 'array', 
                    description: 'Array of artist names',
                    items: { type: 'string' }
                },
                trackUri: { type: 'string', description: 'Spotify URI of the added track' }
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
        if (!config.searchQuery || typeof config.searchQuery !== 'string' || config.searchQuery.trim() === '') {
            throw new Error('searchQuery is required and must be a non-empty string');
        }
        return true;
    }

    /**
     * Execute the add track to playlist by search action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[AddTrackToPlaylistBySearch] Executing action for user ${context.userId}`.cyan);

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
            const playlistId = this.replaceVariables(config.playlistId, context);
            const searchQuery = this.replaceVariables(config.searchQuery, context);

            // Search for the track
            const tracks = await apiService.searchTracks(accessToken, searchQuery, 1);

            if (!tracks || tracks.length === 0) {
                throw new Error(`No tracks found for search query: "${searchQuery}"`);
            }

            const track = tracks[0];
            const trackUri = track.uri;

            // Add track to playlist
            await apiService.addTrackToPlaylist(accessToken, playlistId, trackUri);

            console.log(`[AddTrackToPlaylistBySearch] ✅ Successfully added track "${track.name}" by ${track.artists.map((a: any) => a.name).join(', ')} to playlist ${playlistId}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully added track to playlist',
                    playlistId: playlistId,
                    trackId: track.id,
                    trackName: track.name,
                    artists: track.artists.map((a: any) => a.name),
                    trackUri: trackUri
                }
            };
        } catch (error: any) {
            console.error(`[AddTrackToPlaylistBySearch] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to add track to playlist'
            };
        }
    }
}
