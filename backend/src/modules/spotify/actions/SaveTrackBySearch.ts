import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SpotifyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to search for a track and save it to user's Spotify library
 * Saves the first matching result to Your Music
 */
export class SaveTrackBySearchAction extends BaseAction {
    private spotifyModule: SpotifyModule;

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'save_track_by_search';
    }

    getDescription(): string {
        return 'Search for a track and save the first matching result to Your Music on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['searchQuery'],
            properties: {
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
                success: { type: 'boolean', description: 'Whether the track was saved successfully' },
                message: { type: 'string', description: 'Status message' },
                trackId: { type: 'string', description: 'ID of the saved track' },
                trackName: { type: 'string', description: 'Name of the saved track' },
                artists: { 
                    type: 'array', 
                    description: 'Array of artist names',
                    items: { type: 'string' }
                },
                uri: { type: 'string', description: 'Spotify URI of the saved track' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['user-library-modify'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.searchQuery || typeof config.searchQuery !== 'string' || config.searchQuery.trim() === '') {
            throw new Error('searchQuery is required and must be a non-empty string');
        }
        return true;
    }

    /**
     * Execute the save track by search action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SaveTrackBySearch] Executing action for user ${context.userId}`.cyan);

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

            // Replace variables in search query
            const searchQuery = this.replaceVariables(config.searchQuery, context);

            // Search for the track
            const tracks = await apiService.searchTracks(accessToken, searchQuery, 1);

            if (!tracks || tracks.length === 0) {
                throw new Error(`No tracks found for search query: "${searchQuery}"`);
            }

            const track = tracks[0];

            // Save the track
            await apiService.saveTrack(accessToken, track.id);

            console.log(`[SaveTrackBySearch] ✅ Successfully saved track: "${track.name}" by ${track.artists.map((a: any) => a.name).join(', ')}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully saved track to Your Music',
                    trackId: track.id,
                    trackName: track.name,
                    artists: track.artists.map((a: any) => a.name),
                    uri: track.uri
                }
            };
        } catch (error: any) {
            console.error(`[SaveTrackBySearch] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to save track'
            };
        }
    }
}
