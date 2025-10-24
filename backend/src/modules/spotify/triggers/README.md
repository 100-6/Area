# Triggers Spotify

Ce dossier contiendra les triggers (déclencheurs) pour le module Spotify.

## Structure

Chaque trigger doit :
1. Hériter de `BaseTrigger`
2. Implémenter les méthodes requises
3. Émettre des événements via `emitTrigger()`

## Exemples de triggers à créer

### OnTrackChanged
Déclenché quand un nouveau titre est joué.

```typescript
export class OnTrackChangedTrigger extends BaseTrigger {
    getName(): string {
        return 'on_track_changed';
    }
    
    getDisplayName(): string {
        return 'New Track Playing';
    }
    
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                trackName: { type: 'string' },
                artistName: { type: 'string' },
                albumName: { type: 'string' },
                trackUri: { type: 'string' }
            }
        };
    }
}
```

### OnPlaylistUpdated
Déclenché quand une playlist est modifiée.

### OnNewSavedTrack
Déclenché quand un titre est ajouté aux favoris.

## Utilisation

1. Créer le fichier du trigger
2. Implémenter la logique
3. L'enregistrer dans `service.ts` :
   ```typescript
   this.registerTrigger(new OnTrackChangedTrigger());
   ```
