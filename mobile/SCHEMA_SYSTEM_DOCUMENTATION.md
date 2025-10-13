# Système de Configuration Modulaire - Documentation

## 📋 Vue d'ensemble

Le nouveau système de configuration modulaire permet d'ajouter des triggers et actions sans modifier le code Flutter. Tout est défini dans le fichier `about.json` du backend.

## 🎯 Avantages

- ✅ **Pas de code Flutter** : Ajouter un trigger = modifier seulement `about.json`
- ✅ **Validation automatique** : Types, min/max, required, etc.
- ✅ **Dépendances** : Champs dépendant d'autres (ex: channel dépend de guild)
- ✅ **Resources externes** : Discord guilds, channels, roles, etc.
- ✅ **Extensible** : Nouveau type de champ = 1 provider à ajouter

---

## 📦 Architecture

### Fichiers créés

```
mobile/lib/features/areas/
├── models/
│   ├── config_schema.dart          # Modèles de schéma
│   └── service_info.dart           # Modifié pour inclure configSchema
├── services/
│   └── service_resource_provider.dart  # Gestion des ressources externes
├── widgets/
│   └── dynamic_config_form.dart    # Widget générique de formulaire
├── screens/
│   └── node_config_screen_v2.dart  # Nouvelle version du screen
└── utils/
    └── node_config_helper.dart     # Helper pour migration progressive
```

### Schéma JSON Backend (`about.json`)

```json
{
  "server": {
    "services": [
      {
        "name": "discord",
        "actions": [
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
                "author.id": "string",
                "author.username": "string",
                "content": "string"
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 Types de Champs Supportés

### Champs de base

| Type       | Description                | Options                              |
|------------|----------------------------|--------------------------------------|
| `text`     | Texte simple               | `hint`, `required`, `maxLength`      |
| `textarea` | Texte multiligne           | `hint`, `required`, `maxLength`      |
| `number`   | Nombre                     | `min`, `max`, `required`             |
| `time`     | Heure (HH:mm)              | `hint`, `required`                   |
| `boolean`  | Switch on/off              | `default`, `hint`                    |
| `dropdown` | Sélection liste            | `options[]`, `default`, `required`   |
| `email`    | Email (validation auto)    | `hint`, `required`                   |
| `url`      | URL (validation auto)      | `hint`, `required`                   |

### Champs avec ressources externes

| Type              | Description           | Dépendances      |
|-------------------|-----------------------|------------------|
| `discord_guild`   | Serveur Discord       | -                |
| `discord_channel` | Channel Discord       | `discord_guild`  |
| `discord_role`    | Rôle Discord          | `discord_guild`  |
| `github_repo`     | Repository GitHub     | -                |
| `gitlab_project`  | Projet GitLab         | -                |

---

## 📝 Exemples de Schémas

### Exemple 1 : Timer simple

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

### Exemple 2 : Discord avec dépendances

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
    ]
  }
}
```

### Exemple 3 : Dropdown avec options

```json
{
  "name": "log",
  "description": "Log a message",
  "configSchema": {
    "fields": [
      {
        "key": "message",
        "type": "text",
        "label": "Message",
        "required": true
      },
      {
        "key": "level",
        "type": "dropdown",
        "label": "Log Level",
        "options": ["info", "warn", "error", "success"],
        "default": "info"
      }
    ]
  }
}
```

---

## 🚀 Ajouter un Nouveau Trigger/Action

### Étape 1 : Backend - Ajouter dans `about.json`

```json
{
  "name": "on_new_event",
  "description": "When a new event occurs",
  "configSchema": {
    "fields": [
      {
        "key": "eventType",
        "type": "dropdown",
        "label": "Event Type",
        "options": ["meeting", "deadline", "reminder"],
        "required": true
      }
    ],
    "outputSchema": {
      "event.id": "string",
      "event.title": "string",
      "event.date": "string"
    }
  }
}
```

### Étape 2 : Backend - Implémenter la logique

```typescript
// Aucun changement côté mobile nécessaire !
// Le formulaire est généré automatiquement
```

### Étape 3 : C'est tout ! 🎉

Le mobile génère automatiquement :
- Le formulaire avec validation
- L'affichage dans l'éditeur
- Le résumé de configuration

---

## 🔌 Ajouter un Nouveau Type de Ressource

### Exemple : Ajouter GitHub Repos

**1. Créer le provider** (`service_resource_provider.dart`)

```dart
class GitHubRepoProvider implements ResourceProvider {
  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    // Appeler l'API GitHub
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

**2. Enregistrer le provider**

```dart
ServiceResourceProvider.registerProvider(
  'github_repos',
  GitHubRepoProvider(),
);
```

**3. Ajouter le type dans `ConfigFieldType`**

```dart
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

**4. Utiliser dans `about.json`**

```json
{
  "key": "repositoryId",
  "type": "github_repo",
  "label": "Repository",
  "required": true
}
```

---

## 🔄 Migration Progressive

Le système supporte les deux modes :

### Utiliser NodeConfigHelper

```dart
// Détecte automatiquement si un schéma existe
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

### Comportement

- **Si `configSchema` existe** → Utilise `NodeConfigScreenV2` (nouveau)
- **Sinon** → Utilise `NodeConfigScreen` (ancien, fallback)

---

## 📊 outputSchema

Le `outputSchema` définit les variables disponibles pour les actions suivantes :

```json
{
  "outputSchema": {
    "author.id": "string",
    "author.username": "string",
    "content": "string",
    "channel.id": "string"
  }
}
```

Ces variables peuvent être utilisées dans les actions avec `{{variable}}` :
- `"Message from {{author.username}}: {{content}}"`
- `"User ID: {{author.id}}"`

---

## 🛠️ Validation des Champs

### Validation automatique selon le type

```json
{
  "type": "number",
  "min": 1,
  "max": 100,
  "required": true
}
// ✅ Valide automatiquement : requis, nombre, entre 1-100
```

```json
{
  "type": "time",
  "required": true
}
// ✅ Valide automatiquement : format HH:mm
```

```json
{
  "type": "email",
  "required": true
}
// ✅ Valide automatiquement : format email
```

### Validation personnalisée

```json
{
  "key": "username",
  "type": "text",
  "required": true,
  "validation": {
    "pattern": "^[a-zA-Z0-9_]{3,20}$",
    "message": "Username must be 3-20 alphanumeric characters"
  }
}
```

---

## 🧪 Testing

### Tester un nouveau schéma

1. Modifier `about.json` backend
2. Redémarrer l'app mobile
3. Créer une nouvelle Area
4. Sélectionner le service/trigger
5. Vérifier que le formulaire s'affiche correctement

### Debug

Le widget `DynamicConfigForm` affiche des logs :
```dart
debugPrint('Error loading resources for ${field.key}: $e');
```

---

## 📚 Références

### Fichiers clés

- [config_schema.dart](mobile/lib/features/areas/models/config_schema.dart) - Modèles
- [dynamic_config_form.dart](mobile/lib/features/areas/widgets/dynamic_config_form.dart) - Widget
- [service_resource_provider.dart](mobile/lib/features/areas/services/service_resource_provider.dart) - Resources
- [example_about_schema.json](mobile/example_about_schema.json) - Exemple complet

### Prochaines étapes

1. ✅ Système de schéma créé
2. ✅ Widget dynamique créé
3. ✅ Resource providers créés
4. 🔄 Migrer progressivement les triggers/actions existants
5. 🔜 Ajouter validation personnalisée avancée
6. 🔜 Ajouter support de champs conditionnels
7. 🔜 Ajouter preview des variables dans textarea

---

## 💡 Bonnes Pratiques

### Backend

1. **Toujours fournir `hint`** pour guider l'utilisateur
2. **Utiliser `outputSchema`** pour documenter les variables disponibles
3. **Nommer les clés en camelCase** : `channelId`, pas `channel_id`
4. **Grouper les champs logiques** dans l'ordre de saisie

### Mobile

1. **Réutiliser les providers** existants quand possible
2. **Cacher les ressources** pour éviter les appels répétés
3. **Gérer les erreurs** de chargement de ressources
4. **Tester sur vrais appareils** avec connexion lente

---

## ❓ FAQ

**Q: Puis-je ajouter un trigger sans modifier le code mobile ?**
A: Oui ! Modifiez seulement `about.json` backend avec le schéma.

**Q: Comment ajouter un nouveau type de champ ?**
A: Ajoutez-le dans `ConfigFieldType` et gérez-le dans `DynamicConfigForm._buildField()`.

**Q: Les anciens triggers fonctionnent-ils encore ?**
A: Oui, le système détecte automatiquement l'absence de schéma et utilise l'ancien système.

**Q: Comment tester un schéma avant de le déployer ?**
A: Utilisez `example_about_schema.json` comme référence et testez localement.

---

## 🎉 Conclusion

Ce système rend l'ajout de nouveaux triggers/actions **10x plus rapide** :

**Avant** : 4 fichiers à modifier, 200+ lignes de code
**Maintenant** : 1 fichier JSON, 20 lignes

Profitez de cette modularité pour ajouter rapidement de nouveaux services ! 🚀
