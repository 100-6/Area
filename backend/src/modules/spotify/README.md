# Spotify Module

## Description

Le module Spotify permet d'intégrer et d'automatiser vos interactions avec Spotify. Il utilise OAuth 2.0 pour l'authentification et offre un accès complet à l'API Spotify Web.

## Configuration

### Variables d'environnement requises

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8080/api/auth/spotify/callback
```

### Obtenir les credentials Spotify

1. Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Connectez-vous avec votre compte Spotify
3. Cliquez sur "Create an App"
4. Remplissez les informations de votre application
5. Une fois créée, vous obtiendrez :
   - **Client ID** : Copiez-le dans `SPOTIFY_CLIENT_ID`
   - **Client Secret** : Cliquez sur "Show Client Secret" et copiez-le dans `SPOTIFY_CLIENT_SECRET`
6. Dans les paramètres de l'app, ajoutez l'URL de redirection :
   - Development: `http://localhost:8080/api/auth/spotify/callback`
   - Production: `https://votre-domaine.com/api/auth/spotify/callback`

## Permissions OAuth (Scopes)

Le module demande les permissions suivantes :

- `user-read-private` : Lire les informations du profil
- `user-read-email` : Accéder à l'email de l'utilisateur
- `user-library-read` : Lire la bibliothèque de l'utilisateur
- `user-library-modify` : Modifier la bibliothèque de l'utilisateur
- `playlist-read-private` : Lire les playlists privées
- `playlist-read-collaborative` : Lire les playlists collaboratives
- `playlist-modify-public` : Modifier les playlists publiques
- `playlist-modify-private` : Modifier les playlists privées
- `user-read-playback-state` : Lire l'état de lecture
- `user-modify-playback-state` : Contrôler la lecture
- `user-read-currently-playing` : Lire le titre en cours
- `user-read-recently-played` : Lire l'historique d'écoute
- `user-top-read` : Lire les tops de l'utilisateur

## Fonctionnalités de l'API

Le service `SpotifyApiService` offre les méthodes suivantes :

### Informations utilisateur
- `getCurrentUser(accessToken)` - Obtenir le profil de l'utilisateur

### Lecture en cours
- `getCurrentPlayback(accessToken)` - État de lecture actuel
- `getCurrentlyPlayingTrack(accessToken)` - Titre en cours de lecture
- `getRecentlyPlayedTracks(accessToken, limit)` - Historique d'écoute

### Playlists
- `getUserPlaylists(accessToken, limit)` - Liste des playlists

### Contrôle de lecture
- `pausePlayback(accessToken, deviceId?)` - Mettre en pause
- `resumePlayback(accessToken, deviceId?)` - Reprendre la lecture
- `skipToNext(accessToken, deviceId?)` - Passer au titre suivant
- `skipToPrevious(accessToken, deviceId?)` - Revenir au titre précédent
- `setVolume(accessToken, volumePercent, deviceId?)` - Régler le volume

### Bibliothèque
- `saveTrack(accessToken, trackId)` - Sauvegarder un titre
- `addTrackToPlaylist(accessToken, playlistId, trackUri)` - Ajouter à une playlist

### Appareils
- `getAvailableDevices(accessToken)` - Liste des appareils disponibles

## Architecture

```
backend/src/modules/spotify/
├── service.ts              # Module principal (SpotifyModule)
├── SpotifyApiService.ts    # Service API Spotify
└── config.ts               # Configuration du module
```

## Intégration OAuth

Le flux OAuth est géré automatiquement :

1. **Initiation** : `GET /api/auth/spotify`
2. **Callback** : `GET /api/auth/spotify/callback`
3. **Tokens** : Stockés dans `user_auth_providers` table

### Routes disponibles

- `/api/auth/spotify` - Démarre le flux OAuth
- `/api/auth/spotify/callback` - Endpoint de callback Spotify

## Utilisation dans les workflows

### Exemple de trigger (à implémenter)
```typescript
// Déclenchement quand un nouveau titre est joué
on_track_changed: {
    name: 'on_track_changed',
    displayName: 'New Track Playing',
    description: 'Triggers when a new track starts playing',
    outputSchema: {
        trackName: string,
        artistName: string,
        albumName: string,
        trackUri: string
    }
}
```

### Exemple d'action (à implémenter)
```typescript
// Sauvegarder le titre actuel
save_current_track: {
    name: 'save_current_track',
    displayName: 'Save Current Track',
    description: 'Saves the currently playing track to your library',
    configSchema: {}
}
```

## Développement futur

### Triggers à créer
- `on_track_changed` - Nouveau titre en lecture
- `on_playlist_updated` - Playlist modifiée
- `on_new_saved_track` - Nouveau titre sauvegardé

### Actions à créer
- `save_current_track` - Sauvegarder le titre actuel
- `add_to_playlist` - Ajouter un titre à une playlist
- `control_playback` - Contrôler la lecture (pause/play/skip)
- `set_volume` - Régler le volume
- `search_track` - Rechercher un titre

## Notes importantes

- **Refresh tokens** : Spotify fournit des refresh tokens, conservés dans la base de données
- **Rate limiting** : Respectez les limites de l'API Spotify (non implémenté actuellement)
- **Devices** : Certaines actions nécessitent un appareil Spotify actif
- **Premium** : Certaines fonctionnalités nécessitent Spotify Premium (contrôle de lecture)

## Ressources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
- [Spotify API Console](https://developer.spotify.com/console/)

## Support

Pour toute question ou problème :
1. Vérifiez que vos credentials sont corrects
2. Assurez-vous que l'URL de redirection est bien configurée
3. Vérifiez les logs du backend pour les erreurs détaillées
