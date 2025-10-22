# 🎵 Guide de démarrage rapide - Module Spotify

## 📝 Résumé

Le module Spotify a été créé avec succès ! Il permet l'authentification OAuth et l'accès à l'API Spotify.

## ⚡ Configuration rapide

### 1. Ajouter les credentials Spotify

Éditez votre fichier `.env` :

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret  
SPOTIFY_REDIRECT_URI=http://localhost:8080/api/auth/spotify/callback
```

### 2. Obtenir les credentials

1. Allez sur https://developer.spotify.com/dashboard
2. Cliquez sur "Create an App"
3. Remplissez le nom et la description
4. Une fois créée, copiez :
   - **Client ID** → `SPOTIFY_CLIENT_ID`
   - **Client Secret** (cliquez sur "Show Client Secret") → `SPOTIFY_CLIENT_SECRET`
5. Dans "Edit Settings", ajoutez l'URL de redirection :
   - `http://localhost:8080/api/auth/spotify/callback`

### 3. Démarrer le projet

```bash
# Avec Docker (recommandé)
docker compose --profile dev up --build

# Ou en local
cd backend
npm run dev
```

### 4. Tester l'authentification

1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:8080/api/auth/spotify`
3. Autorisez l'application Spotify
4. Vous serez redirigé avec un token JWT

## ✅ Vérification

Le module apparaîtra automatiquement dans :
- `/api/about.json` - Liste des modules
- Base de données - Tables `services`, `service_actions`, `service_reactions`

## 🔧 Structure créée

```
backend/src/
├── modules/spotify/
│   ├── service.ts           # Module principal
│   ├── SpotifyApiService.ts # API Spotify
│   ├── config.ts            # Configuration
│   └── README.md            # Documentation
└── shared/auth/oauth/providers/
    └── SpotifyProvider.ts   # OAuth provider
```

## 🎯 Prochaines étapes

Vous pouvez maintenant créer des **triggers** et **actions** :

### Exemple de trigger à créer

Créez `backend/src/modules/spotify/triggers/OnTrackChanged.ts` :

```typescript
import { BaseTrigger } from '../../_base/BaseTrigger';

export class OnTrackChangedTrigger extends BaseTrigger {
    getName(): string {
        return 'on_track_changed';
    }

    getDisplayName(): string {
        return 'New Track Playing';
    }

    getDescription(): string {
        return 'Triggers when a new track starts playing';
    }

    // Implémentation du polling toutes les X secondes
    async start(areaId: string, config: any): Promise<void> {
        // TODO: Poll Spotify API
    }

    async stop(areaId: string): Promise<void> {
        // TODO: Arrêter le polling
    }
}
```

Puis l'enregistrer dans `service.ts` :

```typescript
import { OnTrackChangedTrigger } from './triggers/OnTrackChanged';

async initialize(): Promise<void> {
    this.registerTrigger(new OnTrackChangedTrigger());
}
```

### Exemple d'action à créer

Créez `backend/src/modules/spotify/actions/SaveCurrentTrack.ts` :

```typescript
import { BaseAction } from '../../_base/BaseAction';

export class SaveCurrentTrackAction extends BaseAction {
    getName(): string {
        return 'save_current_track';
    }

    getDisplayName(): string {
        return 'Save Current Track';
    }

    getDescription(): string {
        return 'Saves the currently playing track to your library';
    }

    async execute(config: any, context: ActionContext): Promise<any> {
        const apiService = // Obtenir le service
        const accessToken = // Obtenir le token de l'utilisateur
        const currentTrack = await apiService.getCurrentlyPlayingTrack(accessToken);
        
        if (currentTrack) {
            await apiService.saveTrack(accessToken, currentTrack.id);
            return { success: true, trackId: currentTrack.id };
        }
        
        return { success: false, message: 'No track playing' };
    }
}
```

## 📚 Documentation complète

- Module : `backend/src/modules/spotify/README.md`
- Implémentation : `SPOTIFY_MODULE_IMPLEMENTATION.md`
- API Spotify : https://developer.spotify.com/documentation/web-api

## 🆘 Dépannage

### Le module n'apparaît pas
- Vérifiez que le backend redémarre correctement
- Vérifiez les logs : `[Spotify] Initializing Spotify module...`

### OAuth ne fonctionne pas
- Vérifiez que l'URL de redirection est identique dans Spotify Dashboard et `.env`
- Assurez-vous que les credentials sont corrects
- Vérifiez que l'app Spotify est en mode "Development" (limitée à 25 utilisateurs)

### Token expiré
Les tokens Spotify expirent après 1 heure. Le refresh token permet de les renouveler automatiquement (à implémenter dans les actions/triggers si nécessaire).

## 🎉 C'est tout !

Le module OAuth Spotify est **entièrement fonctionnel**. Vous pouvez maintenant créer vos propres triggers et actions selon vos besoins ! 🚀
