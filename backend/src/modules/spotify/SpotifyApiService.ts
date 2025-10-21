import 'colors';

interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string }>;
    };
    duration_ms: number;
    uri: string;
}

interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    owner: { display_name: string };
    tracks: { total: number };
    public: boolean;
    uri: string;
}

interface SpotifyPlaybackState {
    is_playing: boolean;
    item: SpotifyTrack | null;
    progress_ms: number;
    device: {
        id: string;
        name: string;
        type: string;
        volume_percent: number;
    };
}

interface SpotifyDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

interface SpotifyShow {
    id: string;
    name: string;
    publisher: string;
    description: string;
    images: Array<{ url: string }>;
    total_episodes: number;
    uri: string;
    external_urls: { spotify: string };
}

interface SpotifyEpisode {
    id: string;
    name: string;
    description: string;
    duration_ms: number;
    release_date: string;
    images: Array<{ url: string }>;
    uri: string;
    external_urls: { spotify: string };
    show: {
        id: string;
        name: string;
        publisher: string;
    };
}

interface SpotifySavedTrack {
    added_at: string;
    track: SpotifyTrack;
}

/**
 * Spotify API Service
 * Handles all interactions with Spotify Web API
 */
export class SpotifyApiService {
    private readonly BASE_URL = 'https://api.spotify.com/v1';

    /**
     * Get current user's profile
     * @param accessToken - User's access token
     * @returns User profile data
     */
    async getCurrentUser(accessToken: string): Promise<any> {
        try {
            const response = await fetch(`${this.BASE_URL}/me`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get user: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Spotify] Error getting current user:'.red, error);
            throw error;
        }
    }

    /**
     * Get current playback state
     * @param accessToken - User's access token
     * @returns Current playback state or null if nothing playing
     */
    async getCurrentPlayback(accessToken: string): Promise<SpotifyPlaybackState | null> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/player`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (response.status === 204) {
                return null; // No active playback
            }

            if (!response.ok) {
                throw new Error(`Failed to get playback: ${response.statusText}`);
            }

            const data = await response.json();
            return data as SpotifyPlaybackState;
        } catch (error) {
            console.error('[Spotify] Error getting playback:'.red, error);
            throw error;
        }
    }

    /**
     * Get user's playlists
     * @param accessToken - User's access token
     * @param limit - Maximum number of playlists to return
     * @returns Array of playlists
     */
    async getUserPlaylists(accessToken: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/playlists?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get playlists: ${response.statusText}`);
            }

            const data: any = await response.json();
            return (data.items || []) as SpotifyPlaylist[];
        } catch (error) {
            console.error('[Spotify] Error getting playlists:'.red, error);
            throw error;
        }
    }

    /**
     * Get currently playing track
     * @param accessToken - User's access token
     * @returns Currently playing track or null
     */
    async getCurrentlyPlayingTrack(accessToken: string): Promise<SpotifyTrack | null> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/player/currently-playing`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (response.status === 204) {
                return null; // Nothing playing
            }

            if (!response.ok) {
                throw new Error(`Failed to get currently playing track: ${response.statusText}`);
            }

            const data: any = await response.json();
            return data.item as SpotifyTrack | null;
        } catch (error) {
            console.error('[Spotify] Error getting currently playing track:'.red, error);
            throw error;
        }
    }

    /**
     * Get user's recently played tracks
     * @param accessToken - User's access token
     * @param limit - Maximum number of tracks to return
     * @returns Array of recently played tracks
     */
    async getRecentlyPlayedTracks(accessToken: string, limit: number = 20): Promise<any[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/player/recently-played?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get recently played tracks: ${response.statusText}`);
            }

            const data: any = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('[Spotify] Error getting recently played tracks:'.red, error);
            throw error;
        }
    }

    /**
     * Get available devices
     * @param accessToken - User's access token
     * @returns Array of available devices
     */
    async getAvailableDevices(accessToken: string): Promise<SpotifyDevice[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/player/devices`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get devices: ${response.statusText}`);
            }

            const data: any = await response.json();
            return (data.devices || []) as SpotifyDevice[];
        } catch (error) {
            console.error('[Spotify] Error getting devices:'.red, error);
            throw error;
        }
    }

    /**
     * Pause playback
     * @param accessToken - User's access token
     * @param deviceId - Optional device ID
     */
    async pausePlayback(accessToken: string, deviceId?: string): Promise<void> {
        try {
            const url = deviceId 
                ? `${this.BASE_URL}/me/player/pause?device_id=${deviceId}`
                : `${this.BASE_URL}/me/player/pause`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to pause playback: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Playback paused'.green);
        } catch (error) {
            console.error('[Spotify] Error pausing playback:'.red, error);
            throw error;
        }
    }

    /**
     * Resume playback
     * @param accessToken - User's access token
     * @param deviceId - Optional device ID
     */
    async resumePlayback(accessToken: string, deviceId?: string): Promise<void> {
        try {
            const url = deviceId 
                ? `${this.BASE_URL}/me/player/play?device_id=${deviceId}`
                : `${this.BASE_URL}/me/player/play`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to resume playback: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Playback resumed'.green);
        } catch (error) {
            console.error('[Spotify] Error resuming playback:'.red, error);
            throw error;
        }
    }

    /**
     * Skip to next track
     * @param accessToken - User's access token
     * @param deviceId - Optional device ID
     */
    async skipToNext(accessToken: string, deviceId?: string): Promise<void> {
        try {
            const url = deviceId 
                ? `${this.BASE_URL}/me/player/next?device_id=${deviceId}`
                : `${this.BASE_URL}/me/player/next`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to skip to next track: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Skipped to next track'.green);
        } catch (error) {
            console.error('[Spotify] Error skipping to next track:'.red, error);
            throw error;
        }
    }

    /**
     * Skip to previous track
     * @param accessToken - User's access token
     * @param deviceId - Optional device ID
     */
    async skipToPrevious(accessToken: string, deviceId?: string): Promise<void> {
        try {
            const url = deviceId 
                ? `${this.BASE_URL}/me/player/previous?device_id=${deviceId}`
                : `${this.BASE_URL}/me/player/previous`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to skip to previous track: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Skipped to previous track'.green);
        } catch (error) {
            console.error('[Spotify] Error skipping to previous track:'.red, error);
            throw error;
        }
    }

    /**
     * Set playback volume
     * @param accessToken - User's access token
     * @param volumePercent - Volume level (0-100)
     * @param deviceId - Optional device ID
     */
    async setVolume(accessToken: string, volumePercent: number, deviceId?: string): Promise<void> {
        try {
            const url = deviceId 
                ? `${this.BASE_URL}/me/player/volume?volume_percent=${volumePercent}&device_id=${deviceId}`
                : `${this.BASE_URL}/me/player/volume?volume_percent=${volumePercent}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`Failed to set volume: ${response.statusText}`);
            }

            console.log(`[Spotify] ✓ Volume set to ${volumePercent}%`.green);
        } catch (error) {
            console.error('[Spotify] Error setting volume:'.red, error);
            throw error;
        }
    }

    /**
     * Add track to user's saved tracks
     * @param accessToken - User's access token
     * @param trackId - Spotify track ID
     */
    async saveTrack(accessToken: string, trackId: string): Promise<void> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/tracks`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: [trackId] })
            });

            if (!response.ok && response.status !== 200) {
                throw new Error(`Failed to save track: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Track saved'.green);
        } catch (error) {
            console.error('[Spotify] Error saving track:'.red, error);
            throw error;
        }
    }

    /**
     * Add track to a playlist
     * @param accessToken - User's access token
     * @param playlistId - Spotify playlist ID
     * @param trackUri - Spotify track URI
     */
    async addTrackToPlaylist(accessToken: string, playlistId: string, trackUri: string): Promise<void> {
        try {
            const response = await fetch(`${this.BASE_URL}/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uris: [trackUri] })
            });

            if (!response.ok) {
                throw new Error(`Failed to add track to playlist: ${response.statusText}`);
            }

            console.log('[Spotify] ✓ Track added to playlist'.green);
        } catch (error) {
            console.error('[Spotify] Error adding track to playlist:'.red, error);
            throw error;
        }
    }

    /**
     * Get user's saved (followed) shows
     * @param accessToken - User's access token
     * @param limit - Maximum number of shows to return
     * @returns Array of saved shows
     */
    async getSavedShows(accessToken: string, limit: number = 20): Promise<SpotifyShow[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/shows?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get saved shows: ${response.statusText}`);
            }

            const data: any = await response.json();
            return (data.items || []).map((item: any) => item.show) as SpotifyShow[];
        } catch (error) {
            console.error('[Spotify] Error getting saved shows:'.red, error);
            throw error;
        }
    }

        /**
     * Get user's saved episodes
     * @param accessToken - Spotify access token
     * @param limit - Number of episodes to retrieve (max 50)
     * @returns Array of saved episodes with show information
     */
    async getSavedEpisodes(accessToken: string, limit: number = 50): Promise<any[]> {
        const response = await fetch(
            `https://api.spotify.com/v1/me/episodes?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get saved episodes: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.items.map((item: any) => ({
            id: item.episode.id,
            name: item.episode.name,
            description: item.episode.description,
            duration_ms: item.episode.duration_ms,
            release_date: item.episode.release_date,
            uri: item.episode.uri,
            external_urls: item.episode.external_urls,
            images: item.episode.images,
            show: {
                id: item.episode.show.id,
                name: item.episode.show.name,
                publisher: item.episode.show.publisher
            },
            added_at: item.added_at
        }));
    }

    /**
     * Search for shows on Spotify
     * @param accessToken - Spotify access token
     * @param query - Search query
     * @param limit - Number of results to retrieve (max 50)
     * @returns Array of shows matching the search query
     */
    async searchShows(accessToken: string, query: string, limit: number = 20): Promise<any[]> {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodedQuery}&type=show&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to search shows: ${response.statusText}`);
        }

        const data: any = await response.json();
        return data.shows.items.map((show: any) => ({
            id: show.id,
            name: show.name,
            publisher: show.publisher,
            description: show.description,
            images: show.images,
            total_episodes: show.total_episodes,
            uri: show.uri,
            external_urls: show.external_urls
        }));
    }

    /**
     * Get user's saved tracks
     * @param accessToken - User's access token
     * @param limit - Maximum number of tracks to return
     * @returns Array of saved tracks with timestamps
     */
    async getSavedTracks(accessToken: string, limit: number = 20): Promise<SpotifySavedTrack[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/me/tracks?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to get saved tracks: ${response.statusText}`);
            }

            const data: any = await response.json();
            return (data.items || []) as SpotifySavedTrack[];
        } catch (error) {
            console.error('[Spotify] Error getting saved tracks:'.red, error);
            throw error;
        }
    }
}
