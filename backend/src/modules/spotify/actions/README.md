# Actions Spotify

Ce dossier contiendra les actions (réactions) pour le module Spotify.

## Structure

Chaque action doit :
1. Hériter de `BaseAction`
2. Implémenter `execute()`
3. Définir `getConfigSchema()` et `getOutputSchema()`

## Exemples d'actions à créer

### SaveCurrentTrack
Sauvegarde le titre en cours de lecture.

```typescript
export class SaveCurrentTrackAction extends BaseAction {
    getName(): string {
        return 'save_current_track';
    }
    
    getDisplayName(): string {
        return 'Save Current Track';
    }
    
    async execute(config: any, context: ActionContext): Promise<any> {
        // Obtenir le token de l'utilisateur
        const authProvider = await UserAuthProvider.findByUserAndProvider(
            context.userId,
            'spotify'
        );
        
        if (!authProvider?.access_token) {
            throw new Error('Spotify not connected');
        }
        
        // Utiliser l'API
        const apiService = spotifyModule.getApiService();
        const track = await apiService.getCurrentlyPlayingTrack(authProvider.access_token);
        
        if (track) {
            await apiService.saveTrack(authProvider.access_token, track.id);
            return { success: true, trackId: track.id, trackName: track.name };
        }
        
        return { success: false, message: 'No track playing' };
    }
}
```

### AddToPlaylist
Ajoute un titre à une playlist.

### ControlPlayback
Contrôle la lecture (play/pause/next/previous).

### SetVolume
Règle le volume.

### SearchTrack
Recherche un titre et le joue.

## Utilisation

1. Créer le fichier de l'action
2. Implémenter la logique
3. L'enregistrer dans `service.ts` :
   ```typescript
   this.registerAction(new SaveCurrentTrackAction());
   ```

## Accès au token utilisateur

```typescript
const authProvider = await UserAuthProvider.findByUserAndProvider(
    context.userId,
    'spotify'
);

if (!authProvider?.access_token) {
    throw new Error('User has not connected Spotify');
}

// Utiliser le token
const result = await apiService.someMethod(authProvider.access_token);
```

## Refresh token

Si le token expire, vous pouvez le renouveler :

```typescript
if (authProvider.refresh_token) {
    // TODO: Implémenter le refresh token
    // const newTokens = await spotifyRefreshToken(authProvider.refresh_token);
    // await UserAuthProvider.updateTokens(userId, 'spotify', newTokens.access_token, newTokens.refresh_token);
}
```
