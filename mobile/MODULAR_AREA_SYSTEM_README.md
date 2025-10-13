# 🚀 Système de Configuration Modulaire pour Areas


---

## 🎯 Avantages du Nouveau Système

| Ancien Système | Nouveau Système |
|----------------|-----------------|
| 4 fichiers à modifier | 1 fichier JSON |
| 200+ lignes de code | 20 lignes JSON |
| Rebuild requis | Hot reload |
| Code dupliqué | 100% DRY |
| Validation manuelle | Validation auto |
| Dépendances hardcodées | Déclaratives |

---

## 📦 Ce qui a été créé

### 1. **Modèles de Schéma** ([config_schema.dart](lib/features/areas/models/config_schema.dart))
   - `ConfigField` : Définition d'un champ
   - `ConfigSchema` : Schéma complet avec fields + outputSchema
   - `ConfigFieldType` : Types supportés (text, number, discord_guild, etc.)

### 2. **Widget Dynamique** ([dynamic_config_form.dart](lib/features/areas/widgets/dynamic_config_form.dart))
   - Génère automatiquement le formulaire depuis le schéma
   - Gère la validation
   - Gère les dépendances entre champs
   - Cache les ressources externes

### 3. **Resource Providers** ([service_resource_provider.dart](lib/features/areas/services/service_resource_provider.dart))
   - Interface unifiée pour charger les ressources (guilds, channels, repos, etc.)
   - Providers Discord (guilds, channels, roles)
   - Extensible pour GitHub, GitLab, etc.

### 4. **Helper de Migration** ([node_config_helper.dart](lib/features/areas/utils/node_config_helper.dart))
   - Détecte automatiquement si un schéma existe
   - Utilise le nouveau système si disponible
   - Fallback vers l'ancien système sinon
   - Migration progressive sans breaking changes

### 5. **Documentation**
   - [Documentation complète](SCHEMA_SYSTEM_DOCUMENTATION.md) - Guide détaillé
   - [Guide de migration](MIGRATION_GUIDE.md) - Étapes de migration
   - [Exemple de schéma](example_about_schema.json) - Référence JSON

---

## 🔥 Démo Rapide

### Avant (Ancien Système)

Pour ajouter un trigger Discord, il fallait modifier :

1. **node_config_screen.dart** (50+ lignes)
```dart
if (widget.serviceName == 'discord' && widget.actionName == 'on_message_created') {
  return [
    _buildDiscordGuildDropdown(key: 'guildId', required: true),
    const SizedBox(height: 16),
    _buildDiscordChannelDropdown(key: 'channelId', required: true),
    // ... 40 lignes de code
  ];
}
```

2. **area_editor_screen.dart** (30+ lignes pour formatage)
3. **service_selector_screen.dart** (10+ lignes)
4. **discord_service.dart** (possiblement)

**Total : ~100-200 lignes de code Dart**

### Après (Nouveau Système)

Modifier **seulement** `about.json` backend :

```json
{
  "name": "on_message_created",
  "description": "When a message is created",
  "configSchema": {
    "fields": [
      {
        "key": "guildId",
        "type": "discord_guild",
        "label": "Discord Server",
        "required": true
      },
      {
        "key": "channelId",
        "type": "discord_channel",
        "label": "Channel",
        "required": true,
        "dependsOn": "guildId"
      }
    ],
    "outputSchema": {
      "author.username": "string",
      "content": "string"
    }
  }
}
```

**Total : ~20 lignes de JSON**

Le formulaire est généré automatiquement ! ✨

---

## 🛠️ Types de Champs Supportés

### Champs de Base
- `text` - Texte simple
- `textarea` - Texte multiligne
- `number` - Nombre avec validation min/max
- `time` - Heure au format HH:mm
- `boolean` - Switch on/off
- `dropdown` - Liste déroulante
- `email` - Email avec validation
- `url` - URL avec validation

### Champs avec Ressources Externes
- `discord_guild` - Serveurs Discord
- `discord_channel` - Channels Discord (dépend de guild)
- `discord_role` - Rôles Discord (dépend de guild)
- `github_repo` - Repositories GitHub (extensible)
- `gitlab_project` - Projets GitLab (extensible)

---

## 📝 Exemple Complet

### Timer "Every X Minutes"

```json
{
  "name": "every_x_minutes",
  "description": "Every X minutes",
  "configSchema": {
    "fields": [
      {
        "key": "interval",
        "type": "number",
        "label": "Interval (minutes)",
        "hint": "Enter interval in minutes (1-1440)",
        "required": true,
        "min": 1,
        "max": 1440
      }
    ]
  }
}
```

### Discord "Send Message"

```json
{
  "name": "send_message",
  "description": "Send a message",
  "configSchema": {
    "fields": [
      {
        "key": "guildId",
        "type": "discord_guild",
        "label": "Discord Server",
        "required": true
      },
      {
        "key": "channelId",
        "type": "discord_channel",
        "label": "Channel",
        "required": true,
        "dependsOn": "guildId"
      },
      {
        "key": "content",
        "type": "textarea",
        "label": "Message Content",
        "hint": "Supports variables like {{author.username}}",
        "required": true,
        "maxLength": 2000
      }
    ],
    "outputSchema": {
      "message.id": "string"
    }
  }
}
```

---

## 🚀 Utilisation

### Option 1 : Migration Automatique (Recommandé)

Utiliser `NodeConfigHelper` pour une migration progressive :

```dart
final config = await NodeConfigHelper.openConfigScreen(
  context: context,
  nodeType: 'trigger',
  serviceName: 'discord',
  actionName: 'on_message_created',
  description: 'When a message is created',
  serviceAction: serviceAction, // Contient configSchema si disponible
  existingConfig: existingConfig,
);
```

Le helper détecte automatiquement si un schéma existe et choisit le bon écran.

### Option 2 : Utilisation Directe

Pour forcer l'utilisation du nouveau système :

```dart
final config = await Navigator.push<Map<String, dynamic>>(
  context,
  MaterialPageRoute(
    builder: (context) => NodeConfigScreenV2(
      nodeType: 'trigger',
      serviceName: 'discord',
      actionName: 'on_message_created',
      description: 'When a message is created',
      configSchema: serviceAction.configSchema!,
      existingConfig: existingConfig,
    ),
  ),
);
```

---

## 🔌 Ajouter un Nouveau Type de Ressource

**Exemple : GitHub Repositories**

### 1. Créer le Provider

```dart
// Dans service_resource_provider.dart

class GitHubRepoProvider implements ResourceProvider {
  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final response = await apiService.get(
      '/api/github/repos',
      headers: {'Authorization': 'Bearer $token'},
    );

    return (response['repos'] as List).map((repo) {
      return ResourceItem(
        id: repo['id'].toString(),
        name: repo['full_name'],
        metadata: {'stars': repo['stargazers_count']},
      );
    }).toList();
  }
}
```

### 2. Enregistrer le Provider

```dart
ServiceResourceProvider.registerProvider(
  'github_repos',
  GitHubRepoProvider(),
);
```

### 3. Ajouter le Type

```dart
// Dans config_schema.dart
class ConfigFieldType {
  static const String githubRepo = 'github_repo';

  static String? getResourceType(String type) {
    switch (type) {
      case githubRepo:
        return 'github_repos';
      // ...
    }
  }
}
```

### 4. Utiliser dans about.json

```json
{
  "key": "repositoryId",
  "type": "github_repo",
  "label": "Repository",
  "required": true
}
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Backend (about.json)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  {                                                │   │
│  │    "name": "on_message_created",                 │   │
│  │    "configSchema": {                             │   │
│  │      "fields": [...]                             │   │
│  │    }                                              │   │
│  │  }                                                │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP GET /about.json
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Mobile (Flutter)                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │   ServiceInfo (avec configSchema)                 │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │   NodeConfigHelper                                │   │
│  │   (détecte si schéma existe)                      │   │
│  └──────────────┬───────────────┬───────────────────┘   │
│                 │               │                        │
│        Schéma ? │               │ Pas de schéma          │
│                 ▼               ▼                        │
│  ┌─────────────────────┐  ┌──────────────────────┐     │
│  │ NodeConfigScreenV2   │  │ NodeConfigScreen     │     │
│  │ (nouveau)            │  │ (ancien, fallback)   │     │
│  └──────────┬───────────┘  └──────────────────────┘     │
│             │                                            │
│             ▼                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │   DynamicConfigForm                               │   │
│  │   (génère le formulaire depuis le schéma)         │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                    │
│                     ▼                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │   ServiceResourceProvider                         │   │
│  │   (charge guilds, channels, repos, etc.)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

- **[SCHEMA_SYSTEM_DOCUMENTATION.md](SCHEMA_SYSTEM_DOCUMENTATION.md)** - Documentation complète avec tous les détails
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Guide étape par étape pour migrer
- **[example_about_schema.json](example_about_schema.json)** - Exemples de schémas JSON

---

## ✅ Checklist pour Démarrer

### Backend
- [ ] Lire [example_about_schema.json](example_about_schema.json)
- [ ] Ajouter `configSchema` à vos triggers/actions dans `about.json`
- [ ] Tester que l'API retourne bien les schémas

### Mobile
- [ ] Importer les nouveaux fichiers (déjà fait ✅)
- [ ] Tester avec un trigger ayant un schéma
- [ ] Migrer progressivement les autres triggers
- [ ] (Optionnel) Supprimer l'ancien code une fois tout migré

---

## 🎓 Exemples d'Utilisation

### Ajouter un Trigger Simple (Timer)

**Backend - about.json :**
```json
{
  "name": "every_hour",
  "description": "Every hour",
  "configSchema": {
    "fields": []
  }
}
```

Pas de configuration = formulaire vide mais validé !

### Ajouter un Trigger avec Dropdown

**Backend - about.json :**
```json
{
  "name": "on_event",
  "description": "On specific event",
  "configSchema": {
    "fields": [
      {
        "key": "eventType",
        "type": "dropdown",
        "label": "Event Type",
        "options": ["meeting", "deadline", "reminder"],
        "required": true
      }
    ]
  }
}
```

### Ajouter une Action avec Ressources

**Backend - about.json :**
```json
{
  "name": "send_dm",
  "description": "Send a direct message",
  "configSchema": {
    "fields": [
      {
        "key": "guildId",
        "type": "discord_guild",
        "label": "Server",
        "required": true
      },
      {
        "key": "userId",
        "type": "text",
        "label": "User ID",
        "hint": "Discord user ID or use {{author.id}}",
        "required": true
      },
      {
        "key": "message",
        "type": "textarea",
        "label": "Message",
        "required": true,
        "maxLength": 2000
      }
    ]
  }
}
```

---

## 🐛 Debugging

### Logs Utiles

Le système affiche des logs de debug :
```dart
debugPrint('Error loading resources for ${field.key}: $e');
```

### Vérifications

1. **Le schéma n'apparaît pas ?**
   - Vérifier que `about.json` est bien servi
   - Vérifier la syntaxe JSON
   - Vérifier que `configSchema` est présent

2. **Les ressources ne se chargent pas ?**
   - Vérifier les endpoints API (`/api/discord/guilds`, etc.)
   - Vérifier le token d'authentification
   - Vérifier les logs console

3. **La validation ne fonctionne pas ?**
   - Vérifier `required: true`
   - Vérifier `min`/`max` pour les nombres
   - Vérifier le format pour `time`, `email`, etc.

---

## 🎉 Résultat Final

**Avant :**
- 🐌 4 fichiers à modifier par trigger
- 🐌 200+ lignes de code Dart
- 🐌 Rebuild + redémarrage
- 🐌 Code dupliqué partout
- 🐌 Bugs de validation

**Après :**
- ⚡ 1 fichier JSON à modifier
- ⚡ 20 lignes JSON
- ⚡ Hot reload
- ⚡ Code 100% DRY
- ⚡ Validation automatique

**→ 10x plus rapide pour ajouter de nouvelles intégrations !** 🚀

---

## 📞 Support

Pour toute question :
1. Lire la [documentation complète](SCHEMA_SYSTEM_DOCUMENTATION.md)
2. Consulter les [exemples](example_about_schema.json)
3. Vérifier le [guide de migration](MIGRATION_GUIDE.md)

Profitez de ce système modulaire pour scaler rapidement vos intégrations ! 🎊
