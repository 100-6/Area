# Guide de Migration - Système Modulaire

## 🎯 Objectif

Migrer progressivement de l'ancien système hardcodé vers le nouveau système basé sur schémas.

---

## 📋 Checklist de Migration

### Phase 1 : Backend (Prioritaire)

- [ ] Mettre à jour `/about.json` avec les `configSchema` pour chaque action/reaction
- [ ] Tester le format JSON avec [example_about_schema.json](example_about_schema.json)
- [ ] Vérifier que l'API retourne bien les schémas

### Phase 2 : Mobile (Automatique)

- [ ] Le système détecte automatiquement les schémas
- [ ] Utilise le nouveau formulaire si schéma disponible
- [ ] Utilise l'ancien système sinon (fallback)

---

## 🔄 Étapes de Migration

### 1. Mettre à jour le Backend

#### Exemple : Discord `on_message_created`

**Avant (ancien about.json):**
```json
{
  "name": "on_message_created",
  "description": "When a message is created"
}
```

**Après (nouveau about.json):**
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
      },
      {
        "key": "keyword",
        "type": "text",
        "label": "Keyword (optional)",
        "hint": "Only trigger if message contains this keyword",
        "required": false
      },
      {
        "key": "ignoreBots",
        "type": "boolean",
        "label": "Ignore bots",
        "hint": "Ignore messages from bots",
        "default": true
      }
    ],
    "outputSchema": {
      "author.id": "string",
      "author.username": "string",
      "content": "string"
    }
  }
}
```

### 2. Tester

```bash
# Redémarrer l'app mobile
flutter run

# Créer une nouvelle Area
# Sélectionner Discord > On message created
# Vérifier que le formulaire dynamique s'affiche
```

### 3. Supprimer l'Ancien Code (Optionnel)

Une fois tous les schémas migrés, vous pouvez supprimer :

```dart
// mobile/lib/features/areas/screens/node_config_screen.dart
// Lignes 298-526 (_buildConfigFields)
```

⚠️ **Attention** : Gardez ce fichier tant que tous les triggers ne sont pas migrés !

---

## 📊 Mapping Types de Champs

### Ancien système → Nouveau système

| Ancien                        | Nouveau Type         | Notes                                    |
|-------------------------------|----------------------|------------------------------------------|
| `_buildTextField`             | `type: "text"`       |                                          |
| `_buildTextAreaField`         | `type: "textarea"`   |                                          |
| `_buildNumberField`           | `type: "number"`     | Ajouter `min`, `max` si nécessaire       |
| `_buildTimeField`             | `type: "time"`       |                                          |
| `_buildSwitchField`           | `type: "boolean"`    | `default` au lieu de `defaultValue`      |
| `_buildDropdownField`         | `type: "dropdown"`   | `options: []` requis                     |
| `_buildDiscordGuildDropdown`  | `type: "discord_guild"` |                                       |
| `_buildDiscordChannelDropdown`| `type: "discord_channel"` | Ajouter `dependsOn: "guildId"`    |
| `_buildDiscordRoleDropdown`   | `type: "discord_role"` | Ajouter `dependsOn: "guildId"`       |

---

## 🔍 Exemples de Conversion

### Timer `every_x_minutes`

**Avant (NodeConfigScreen.dart):**
```dart
if (widget.serviceName == 'timer' && widget.actionName == 'every_x_minutes') {
  return [
    _buildNumberField(
      key: 'interval',
      label: 'Interval (minutes)',
      hint: 'Enter interval in minutes (1-1440)',
      min: 1,
      max: 1440,
    ),
  ];
}
```

**Après (about.json):**
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

### Console `log`

**Avant (NodeConfigScreen.dart):**
```dart
if (widget.serviceName == 'console' && widget.actionName == 'log') {
  return [
    _buildTextField(
      key: 'message',
      label: 'Message',
      hint: 'Enter the message to log',
      required: true,
    ),
    const SizedBox(height: 16),
    _buildDropdownField(
      key: 'level',
      label: 'Log Level',
      items: ['info', 'warn', 'error', 'success'],
      defaultValue: 'info',
    ),
  ];
}
```

**Après (about.json):**
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
        "hint": "Enter the message to log",
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

## ⚠️ Points d'Attention

### 1. Nommage des Clés

**Utilisez camelCase** dans les schémas :
```json
✅ "channelId"
❌ "channel_id"
```

### 2. Dépendances

Les champs qui dépendent d'autres doivent spécifier `dependsOn` :
```json
{
  "key": "channelId",
  "type": "discord_channel",
  "dependsOn": "guildId"  // ⬅️ Important !
}
```

### 3. Valeurs par Défaut

```json
{
  "type": "boolean",
  "default": true  // ⬅️ "default", pas "defaultValue"
}
```

### 4. OutputSchema

Documentez toujours les variables disponibles :
```json
{
  "outputSchema": {
    "author.id": "string",
    "author.username": "string",
    "content": "string"
  }
}
```

---

## 🧪 Plan de Test

### Pour chaque trigger/action migré :

1. [ ] Créer une nouvelle Area
2. [ ] Sélectionner le trigger/action
3. [ ] Vérifier que les champs s'affichent correctement
4. [ ] Vérifier la validation (champs requis, min/max, etc.)
5. [ ] Tester les dépendances (ex: channel après guild)
6. [ ] Sauvegarder et vérifier que la config est correcte
7. [ ] Tester l'édition d'une Area existante

---

## 📈 Progression Recommandée

### Ordre de migration suggéré :

1. **Phase 1 - Services simples** (1-2 jours)
   - [ ] Timer (3 actions)
   - [ ] Console (1 reaction)

2. **Phase 2 - Discord** (2-3 jours)
   - [ ] Discord triggers (3 actions)
   - [ ] Discord reactions (3 reactions)

3. **Phase 3 - Autres services** (selon besoins)
   - [ ] GitHub
   - [ ] GitLab
   - [ ] Email
   - [ ] etc.

---

## 🔧 Utilisation du Helper

Pendant la migration, utilisez `NodeConfigHelper` :

```dart
// Dans area_editor_screen.dart ou service_selector_screen.dart

// Remplacer ceci:
final config = await Navigator.push<Map<String, dynamic>>(
  context,
  MaterialPageRoute(
    builder: (context) => NodeConfigScreen(
      nodeType: 'trigger',
      serviceName: result['service'],
      actionName: result['name'],
      description: result['description'],
    ),
  ),
);

// Par ceci:
final config = await NodeConfigHelper.openConfigScreen(
  context: context,
  nodeType: 'trigger',
  serviceName: result['service'],
  actionName: result['name'],
  description: result['description'],
  serviceAction: serviceAction, // Passer l'objet complet
);
```

Le helper choisira automatiquement le bon screen !

---

## ✅ Vérification Finale

Une fois la migration terminée :

- [ ] Tous les triggers ont un `configSchema`
- [ ] Tous les reactions ont un `configSchema`
- [ ] Les tests passent
- [ ] L'ancien code peut être supprimé

---

## 🆘 Dépannage

### Problème : Le formulaire n'apparaît pas

**Solution :**
1. Vérifier que `about.json` est bien servi par le backend
2. Vérifier la structure JSON (pas d'erreur de syntaxe)
3. Vérifier les logs : `debugPrint` dans `DynamicConfigForm`

### Problème : Les ressources ne se chargent pas

**Solution :**
1. Vérifier que le provider est enregistré dans `ServiceResourceProvider`
2. Vérifier l'API backend (`/api/discord/guilds`, etc.)
3. Vérifier le token d'authentification

### Problème : Validation ne fonctionne pas

**Solution :**
1. Vérifier `required: true` dans le schéma
2. Vérifier les `min`/`max` pour les nombres
3. Ajouter `validator` personnalisé si nécessaire

---

## 📚 Ressources

- [Documentation complète](SCHEMA_SYSTEM_DOCUMENTATION.md)
- [Exemple de schéma](example_about_schema.json)
- [Code source du formulaire](lib/features/areas/widgets/dynamic_config_form.dart)

---

## 💬 Support

Pour toute question :
1. Consulter la [documentation](SCHEMA_SYSTEM_DOCUMENTATION.md)
2. Vérifier les exemples dans `example_about_schema.json`
3. Regarder les logs de debug dans la console Flutter

Bonne migration ! 🚀
