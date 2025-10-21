/**
 * Spotify Triggers
 * 
 * This file will export all Spotify triggers when they are implemented.
 * 
 * Example triggers:
 * - OnTrackChanged: Fires when the currently playing track changes
 * - OnPlaybackStarted: Fires when playback starts
 * - OnPlaybackPaused: Fires when playback is paused
 * - OnPlaylistUpdated: Fires when a playlist is updated
 * - OnNewSavedTrack: Fires when a track is saved to library
 */

// Export all Spotify triggers
export { OnNewFollowedShowTrigger } from './OnNewFollowedShow';
export { OnNewSavedEpisodeTrigger } from './OnNewSavedEpisode';
export { OnNewSavedTrackTrigger } from './OnNewSavedTrack';
export { OnNewShowFromSearchTrigger } from './OnNewShowFromSearch';
export { OnNewRecentlyPlayedTrackTrigger } from './OnNewRecentlyPlayedTrack';
export { OnNewSavedAlbumTrigger } from './OnNewSavedAlbum';
export { OnNewEpisodeFromFollowedShowTrigger } from './OnNewEpisodeFromFollowedShow';
export { OnNewEpisodeFromSearchTrigger } from './OnNewEpisodeFromSearch';
export { OnNewTrackAddedToPlaylistTrigger } from './OnNewTrackAddedToPlaylist';
