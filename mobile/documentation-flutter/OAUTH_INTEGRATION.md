# 🔐 Intégration OAuth Mobile

## ✅ Providers OAuth disponibles

L'application mobile supporte maintenant **4 providers OAuth** connectés au backend :

| Provider | Couleur | Icône |
|----------|---------|-------|
| **Google** | Bleu (#4285F4) | G |
| **GitHub** | Noir (#181717) | Code |
| **GitLab** | Orange (#FC6D26) | Source |
| **Discord** | Violet (#5865F2) | Discord |

---

## 📦 Dépendances ajoutées

```yaml
# OAuth / URL Launcher
url_launcher: ^6.3.1
webview_flutter: ^4.10.0

# Icons & SVG
flutter_svg: ^2.0.10+1
```

---

## 📁 Fichiers créés

### 1. **Service OAuth** (`lib/core/services/oauth_service.dart`)
- `OAuthService` : Gère les connexions OAuth
- `OAuthProvider` : Énumération des providers disponibles
- `OAuthResult` : Résultat d'une opération OAuth

### 2. **Widgets OAuth** (`lib/shared/widgets/oauth_button.dart`)
- `OAuthButton` : Bouton OAuth pleine largeur
- `CompactOAuthButton` : Bouton OAuth compact (carré)
- `OAuthButtons` : Widget avec tous les boutons pleins
- `CompactOAuthButtons` : Grille de boutons compacts ⭐ (utilisé dans l'app)

---

## 🎨 Intégration dans l'UI

### Écran de Login (`login_screen.dart`)

```dart
// Boutons OAuth compacts affichés sous le formulaire
CompactOAuthButtons(
  onProviderSelected: (provider) {
    // Callback quand un provider est sélectionné
  },
)
```

### Écran de Signup (`signup_screen.dart`)

```dart
// Même chose dans l'écran d'inscription
CompactOAuthButtons(
  onProviderSelected: (provider) {
    // Callback quand un provider est sélectionné
  },
)
```

---

## 🔄 Flux OAuth

### 1. Utilisateur clique sur un bouton OAuth

```dart
CompactOAuthButton(
  provider: OAuthProvider.google,
  onPressed: () => _handleOAuthLogin(OAuthProvider.google),
)
```

### 2. L'app ouvre le navigateur

```dart
Future<OAuthResult> signInWithProvider(OAuthProvider provider) async {
  final authUrl = _getAuthUrl(provider); // Ex: http://10.68.254.55:8080/api/auth/google
  final uri = Uri.parse(authUrl);
  
  await launchUrl(uri, mode: LaunchMode.externalApplication);
  
  return OAuthResult.pending();
}
```

### 3. Le navigateur redirige vers le backend

```
User → Mobile App → Browser → Backend OAuth → Provider (Google/GitHub/etc.)
```

### 4. Après authentification

Le provider redirige vers le callback du backend :
```
Provider → Backend Callback → JWT Token généré
```

### 5. ⚠️ Retour à l'app (À IMPLÉMENTER)

**Actuellement**, le flux OAuth ouvre le navigateur mais **ne revient pas automatiquement** à l'app.

**Pour compléter l'implémentation**, vous devez configurer :

#### Option A : Deep Linking (Recommandé)

1. **Configurer un scheme personnalisé** dans `AndroidManifest.xml` :

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="myapp"
        android:host="oauth-callback" />
</intent-filter>
```

2. **Modifier le backend** pour rediriger vers `myapp://oauth-callback?token=...`

3. **Écouter le deep link** dans Flutter avec `uni_links` ou `app_links`

#### Option B : WebView intégrée

Utiliser `webview_flutter` pour afficher l'OAuth dans l'app au lieu du navigateur externe.

---

## 🛠️ Configuration du Backend

Les endpoints OAuth sont déjà configurés dans le backend :

```typescript
// backend/src/core/routes/auth.ts
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

router.get('/discord', authController.discordLogin);
router.get('/discord/callback', authController.discordCallback);

router.get('/github', authController.gitHubLogin);
router.get('/github/callback', authController.gitHubCallback);

router.get('/gitlab', authController.gitLabLogin);
router.get('/gitlab/callback', authController.gitLabCallback);
```

---

## 🧪 Test

### 1. Lancer le backend

```bash
docker compose --profile dev up -d
```

### 2. Vérifier l'URL de l'API

Dans `lib/core/constants/api_constants.dart` :
```dart
static const String baseUrl = 'http://10.68.254.55:8080'; // Votre IP
```

### 3. Lancer l'app mobile

```bash
cd mobile
flutter run
```

### 4. Tester OAuth

1. Aller sur l'écran de login
2. Cliquer sur un des boutons OAuth (Google, GitHub, GitLab, Discord)
3. Le navigateur s'ouvre et redirige vers le provider
4. ⚠️ Actuellement, après authentification, vous devez revenir manuellement à l'app

---

## 📊 État actuel vs État final

| Fonctionnalité | État Actuel | À Implémenter |
|----------------|-------------|---------------|
| Boutons OAuth | ✅ Créés et stylisés | - |
| Ouverture navigateur | ✅ Fonctionne | - |
| Redirection backend | ✅ Configuré | - |
| Retour à l'app | ❌ Manuel | Deep linking |
| Récupération token | ❌ Non géré | Callback handler |
| Stockage token | ✅ Service prêt | Intégration finale |

---

## 🚀 Prochaines étapes recommandées

### 1. Configurer Deep Linking

**Android** (`android/app/src/main/AndroidManifest.xml`) :
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="votre-domaine.com"
        android:pathPrefix="/oauth-callback" />
</intent-filter>
```

**iOS** (`ios/Runner/Info.plist`) :
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

### 2. Ajouter le package de deep linking

```bash
flutter pub add app_links
# ou
flutter pub add uni_links
```

### 3. Écouter les deep links

```dart
// Dans main.dart ou AuthProvider
import 'package:app_links/app_links.dart';

class _MyAppState extends State<MyApp> {
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    _appLinks.uriLinkStream.listen((uri) {
      if (uri.path == '/oauth-callback') {
        final token = uri.queryParameters['token'];
        // Sauvegarder le token et rediriger
      }
    });
  }
}
```

### 4. Modifier le backend pour deep link

```typescript
// backend/src/core/controllers/AuthController.ts
res.redirect(`myapp://oauth-callback?token=${token}&refreshToken=${refreshToken}`);
```

---

## 💡 Alternative : WebView intégrée

Si vous ne voulez pas gérer le deep linking, vous pouvez afficher l'OAuth dans une WebView :

```dart
import 'package:webview_flutter/webview_flutter.dart';

class OAuthWebView extends StatefulWidget {
  final String url;
  final Function(String token) onSuccess;

  // ...
  
  WebView(
    initialUrl: widget.url,
    javascriptMode: JavascriptMode.unrestricted,
    navigationDelegate: (navigation) {
      if (navigation.url.contains('/oauth-callback')) {
        // Extraire le token de l'URL
        // Appeler onSuccess
        return NavigationDecision.prevent;
      }
      return NavigationDecision.navigate;
    },
  )
}
```

---

## 📚 Documentation des providers

- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitLab OAuth](https://docs.gitlab.com/ee/api/oauth2.html)
- [Discord OAuth](https://discord.com/developers/docs/topics/oauth2)

---

## ✅ Résumé

**Ce qui fonctionne actuellement** :
- ✅ 4 boutons OAuth stylisés et fonctionnels
- ✅ Ouverture du navigateur pour OAuth
- ✅ Backend configuré pour tous les providers
- ✅ Design responsive et animations

**Ce qui reste à faire** :
- ⚠️ Deep linking pour revenir à l'app
- ⚠️ Gestion du callback OAuth
- ⚠️ Stockage du token reçu

**Bon développement ! 🚀**

