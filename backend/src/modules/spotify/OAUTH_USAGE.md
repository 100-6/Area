# 🎵 Spotify OAuth - Guide d'utilisation

## 🔐 Flux OAuth corrigé

Le système OAuth Spotify fonctionne maintenant exactement comme Gmail, avec support complet mobile et web.

## 📋 Prérequis

L'utilisateur **DOIT être authentifié** avant de se connecter à Spotify.

## 🚀 Utilisation

### Pour le web (frontend)

```javascript
// 1. L'utilisateur se connecte et obtient un JWT
const { token } = await login(email, password);

// 2. Rediriger vers /api/spotify/connect avec le token en query param
window.location.href = `https://area-bastian.eliasdrissi.dev/api/spotify/connect?token=${token}`;

// 3. Le navigateur est redirigé vers Spotify
// 4. L'utilisateur autorise l'application
// 5. Spotify redirige vers /api/spotify/callback
// 6. L'utilisateur est redirigé vers /services?success=spotify
```

### Pour le mobile (Flutter)

```dart
// 1. L'utilisateur se connecte et obtient un JWT
final token = await login(email, password);

// 2. Ouvrir le navigateur avec le token et mobile=true
final url = 'https://area-bastian.eliasdrissi.dev/api/spotify/connect?token=$token&mobile=true';
await launchUrl(
  Uri.parse(url),
  mode: LaunchMode.externalApplication,
);

// 3. Le navigateur système s'ouvre et redirige vers Spotify
// 4. L'utilisateur autorise l'application
// 5. Spotify redirige vers /api/spotify/callback
// 6. Le callback redirige vers autoarea://oauth?success=spotify
// 7. L'app mobile intercepte le deep link
```

## 🔄 Flux détaillé

### 1. Connexion initiale (`/api/spotify/connect`)

```
Client -> GET /api/spotify/connect?token=<jwt_token>&mobile=true

Backend:
1. Vérifie l'authentification (requireAuth middleware)
2. Récupère le token du query param
3. Détecte si mobile (User-Agent ou query param)
4. Crée un state:
   {
     token: <jwt_token>,
     isMobile: true/false
   }
5. Encode le state en base64
6. Redirige vers Spotify avec le state
```

### 2. Autorisation Spotify

```
User -> Autorise l'application sur Spotify
Spotify -> Redirige vers /api/spotify/callback?code=xxx&state=xxx
```

### 3. Callback (`/api/spotify/callback`)

```
Spotify -> GET /api/spotify/callback?code=xxx&state=xxx

Backend:
1. Décode le state (base64)
2. Extrait le JWT du state
3. Vérifie le JWT et obtient userId
4. Échange le code contre un access_token
5. Sauvegarde les tokens en DB (user_auth_providers)
6. Redirige vers:
   - Web: https://area-bastian.eliasdrissi.dev/services?success=spotify
   - Mobile: autoarea://oauth?success=spotify
```

## 🛠️ Configuration

### Variables d'environnement

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://area-bastian.eliasdrissi.dev/api/spotify/callback

# Frontend URL (pour redirections web)
FRONTEND_URL=https://area-bastian.eliasdrissi.dev
```

### Spotify Dashboard

1. Allez sur https://developer.spotify.com/dashboard
2. Settings de votre app
3. Redirect URIs: `https://area-bastian.eliasdrissi.dev/api/spotify/callback`

## 🧪 Test

### Test web (curl)

```bash
# 1. Login
curl -X POST https://area-bastian.eliasdrissi.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Response: { "token": "eyJhbG..." }

# 2. Connect Spotify (ouvrir dans un navigateur)
# https://area-bastian.eliasdrissi.dev/api/spotify/connect?token=eyJhbG...

# Vous serez redirigé vers Spotify, puis vers /services?success=spotify
```

### Test mobile

```dart
// Dans votre app Flutter
final token = await storage.read(key: 'jwt_token');
final url = 'https://area-bastian.eliasdrissi.dev/api/spotify/connect?token=$token&mobile=true';

await launchUrl(
  Uri.parse(url),
  mode: LaunchMode.externalApplication,
);

// Intercepter le deep link
// autoarea://oauth?success=spotify
```

## 📱 Deep Links (Mobile)

### iOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>autoarea</string>
    </array>
  </dict>
</array>
```

### Android (AndroidManifest.xml)

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="autoarea" android:host="oauth" />
</intent-filter>
```

## ✅ Vérification

### Vérifier que le token est sauvegardé

```sql
SELECT 
  u.email,
  uap.provider,
  uap.provider_email,
  uap.access_token IS NOT NULL as has_access_token,
  uap.refresh_token IS NOT NULL as has_refresh_token,
  uap.created_at
FROM users u
JOIN user_auth_providers uap ON u.id = uap.user_id
WHERE uap.provider = 'spotify';
```

### Vérifier les logs backend

```bash
docker compose logs backend | grep Spotify
```

Vous devriez voir :
```
[Spotify] Connect request
[Spotify] Has token: true
[Spotify] Is mobile: false
[Spotify] State created: eyJhb...
[Spotify] Redirecting to Spotify auth URL
[Spotify] Callback received
[Spotify] Code: present
[Spotify] State: present
[Spotify] Decoded state: {"token":"eyJ...","isMobile":false}
[Spotify] Parsed state data: { hasToken: true, isMobile: false }
[Spotify] Token decoded: success
[Spotify] Handling OAuth callback for user: 66199595-ebde-4ed2-8340-6b227973f3a8
[Spotify] OAuth callback successful, redirecting to services
```

## 🐛 Dépannage

### Erreur: "authentication_required"

→ Le token JWT n'est pas dans le state. Vérifiez que l'utilisateur est bien authentifié avant d'appeler `/connect`.

### Erreur: "invalid_token"

→ Le JWT est expiré ou invalide. Demandez à l'utilisateur de se reconnecter.

### Erreur: "missing_code"

→ Spotify n'a pas renvoyé de code. L'utilisateur a peut-être refusé l'autorisation.

### Pas de redirection vers le frontend

→ Vérifiez que `FRONTEND_URL` est bien configuré dans `.env`.

### Mobile: Deep link ne fonctionne pas

→ Vérifiez que le schéma `autoarea://` est bien configuré dans votre app mobile.

## 🎉 Résultat

Une fois la connexion réussie :
- ✅ Le token Spotify est sauvegardé en DB
- ✅ L'utilisateur est redirigé vers `/services?success=spotify`
- ✅ Les triggers et actions Spotify peuvent utiliser le token
- ✅ Le refresh token permet de renouveler l'accès automatiquement

## 📚 Différences avec l'ancienne implémentation

| Aspect | Avant (auth.ts) | Maintenant (spotify module) |
|--------|-----------------|------------------------------|
| Routes | `/api/auth/spotify` | `/api/spotify/connect` |
| Callback | `/api/auth/spotify/callback` | `/api/spotify/callback` |
| Token | N/A | Query param `?token=xxx` |
| Auth required | Non | Oui (requireAuth middleware) |
| Pattern | Centralisé dans AuthController | Module isolé comme Gmail |

---

**Le système OAuth Spotify est maintenant 100% fonctionnel !** 🚀🎵
