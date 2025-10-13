# Discord Module - Output Schemas

Cette documentation décrit les données retournées par chaque trigger et action du module Discord.

## 📥 Triggers - Données de sortie

### OnMessageCreated

**Trigger Name:** `on_message_created`

**Description:** Se déclenche quand un nouveau message est posté dans un canal Discord.

**Données retournées:**

```typescript
{
  message: {
    id: string;              // ID du message
    content: string;         // Contenu texte du message
    channelId: string;       // ID du canal
    channelName: string;     // Nom du canal
    guildId: string;         // ID du serveur
    guildName: string;       // Nom du serveur
    timestamp: string;       // Date/heure du message (ISO 8601)
    hasAttachments: boolean; // Si le message a des pièces jointes
    attachments: array;      // Liste des pièces jointes
  },
  author: {
    id: string;              // ID de l'auteur
    tag: string;             // Tag Discord (username#discriminator)
    username: string;        // Nom d'utilisateur
  }
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Dans SendMessage
content: "{{author.username}} a posté: {{message.content}}"

// Dans SendWebhookMessage
content: "Nouveau message de {{author.tag}} dans #{{message.channelName}}"
```

---

### OnMemberJoin

**Trigger Name:** `on_member_join`

**Description:** Se déclenche quand un nouveau membre rejoint un serveur Discord.

**Données retournées:**

```typescript
{
  member: {
    id: string;              // ID du membre
    tag: string;             // Tag Discord (username#discriminator)
    username: string;        // Nom d'utilisateur
    avatarUrl: string;       // URL de l'avatar
    joinedAt: string;        // Date de rejointe (ISO 8601)
    accountCreatedAt: string;// Date de création du compte (ISO 8601)
    isBot: boolean;          // Si c'est un bot
  },
  guild: {
    id: string;              // ID du serveur
    name: string;            // Nom du serveur
  }
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Dans SendMessage
content: "Bienvenue {{member.username}} sur {{guild.name}} !"

// Dans AddRole - ajouter un rôle au nouveau membre
userId: "{{member.id}}"
```

---

### OnReactionAdded

**Trigger Name:** `on_reaction_added`

**Description:** Se déclenche quand une réaction est ajoutée à un message Discord.

**Données retournées:**

```typescript
{
  reaction: {
    emoji: string;           // Caractère ou nom de l'emoji
    emojiId: string;         // ID de l'emoji (si custom)
    emojiAnimated: boolean;  // Si l'emoji est animé
  },
  message: {
    id: string;              // ID du message
    content: string;         // Contenu du message
    authorId: string;        // ID de l'auteur du message
    channelId: string;       // ID du canal
  },
  user: {
    id: string;              // ID de l'utilisateur qui a réagi
    tag: string;             // Tag Discord
    username: string;        // Nom d'utilisateur
  },
  guild: {
    id: string;              // ID du serveur
  }
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Dans SendMessage
content: "{{user.username}} a réagi avec {{reaction.emoji}} au message: {{message.content}}"
```

---

## 📤 Actions - Données de sortie

### SendMessage

**Action Name:** `send_message`

**Description:** Envoie un message texte dans un canal Discord.

**Données retournées:**

```typescript
{
  messageId: string;         // ID du message envoyé
  channelId: string;         // ID du canal
  content: string;           // Contenu du message envoyé
  timestamp: string;         // Date/heure d'envoi (ISO 8601)
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Peut être utilisé pour répondre au message ou le référencer
replyToMessageId: "{{messageId}}"
```

---

### AddRole

**Action Name:** `add_role`

**Description:** Ajoute un rôle à un membre d'un serveur Discord.

**Données retournées:**

```typescript
{
  userId: string;            // ID de l'utilisateur
  userTag: string;           // Tag Discord de l'utilisateur
  roleId: string;            // ID du rôle ajouté
  roleName: string;          // Nom du rôle
  guildId: string;           // ID du serveur
  guildName: string;         // Nom du serveur
  alreadyHad: boolean;       // Si l'utilisateur avait déjà le rôle
  message: string;           // Message de statut (optionnel)
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Dans SendMessage
content: "Rôle {{roleName}} ajouté à {{userTag}} ✅"
```

---

### KickMember

**Action Name:** `kick_member`

**Description:** Expulse un membre d'un serveur Discord.

**Données retournées:**

```typescript
{
  userId: string;            // ID de l'utilisateur expulsé
  userTag: string;           // Tag Discord
  username: string;          // Nom d'utilisateur
  guildId: string;           // ID du serveur
  guildName: string;         // Nom du serveur
  reason: string;            // Raison de l'expulsion
}
```

**Utilisation dans les actions suivantes:**

```typescript
// Dans SendMessage (pour logger l'action)
content: "{{username}} a été expulsé de {{guildName}} pour: {{reason}}"
```

---

### SendWebhookMessage

**Action Name:** `send_webhook_message`

**Description:** Envoie un message via un webhook Discord.

**Données retournées:**

```typescript
{
  webhookUrl: string;        // URL du webhook utilisé
  content: string;           // Contenu envoyé
  username: string;          // Username utilisé (optionnel)
  sentAt: string;            // Date/heure d'envoi (ISO 8601)
}
```

---

## 🔗 Chaînage d'actions - Exemples

### Exemple 1: Nouveau membre → Message de bienvenue + Rôle

**Workflow:**
1. **Trigger:** `on_member_join`
2. **Action 1:** `send_message` - Message de bienvenue
3. **Action 2:** `add_role` - Ajouter rôle "Nouveau"

```json
{
  "trigger": {
    "type": "on_member_join",
    "config": {
      "guildId": "123456789012345678"
    }
  },
  "actions": [
    {
      "type": "send_message",
      "config": {
        "channelId": "987654321098765432",
        "content": "Bienvenue {{member.username}} ! 🎉"
      }
    },
    {
      "type": "add_role",
      "config": {
        "guildId": "123456789012345678",
        "userId": "{{member.id}}",
        "roleId": "111222333444555666",
        "reason": "Nouveau membre"
      }
    }
  ]
}
```

### Exemple 2: Message avec mot-clé → Réaction + Notification webhook

**Workflow:**
1. **Trigger:** `on_message_created` (avec keyword)
2. **Action 1:** `send_webhook_message` - Notifier l'équipe

```json
{
  "trigger": {
    "type": "on_message_created",
    "config": {
      "channelId": "123456789012345678",
      "keyword": "urgent"
    }
  },
  "actions": [
    {
      "type": "send_webhook_message",
      "config": {
        "webhookUrl": "https://discord.com/api/webhooks/...",
        "content": "🚨 Message urgent de {{author.username}}: {{message.content}}",
        "username": "Alert Bot"
      }
    }
  ]
}
```

### Exemple 3: Réaction spécifique → Ajouter rôle

**Workflow:**
1. **Trigger:** `on_reaction_added` (emoji ✅)
2. **Action 1:** `add_role` - Ajouter rôle "Validé"
3. **Action 2:** `send_message` - Confirmation

```json
{
  "trigger": {
    "type": "on_reaction_added",
    "config": {
      "channelId": "123456789012345678",
      "emoji": "✅"
    }
  },
  "actions": [
    {
      "type": "add_role",
      "config": {
        "guildId": "123456789012345678",
        "userId": "{{user.id}}",
        "roleId": "777888999000111222"
      }
    },
    {
      "type": "send_message",
      "config": {
        "channelId": "123456789012345678",
        "content": "Rôle {{roleName}} attribué à {{user.username}} !"
      }
    }
  ]
}
```

---

## 💡 Bonnes pratiques

### 1. Utiliser les placeholders avec prudence

Assurez-vous que les données existent avant de les utiliser :

```typescript
// ✅ Bon
content: "{{author.username}} a posté un message"

// ❌ Mauvais (si message n'a pas d'image)
content: "Image: {{message.imageUrl}}"
```

### 2. Nommer vos actions dans les workflows

Utilisez des noms descriptifs pour référencer facilement les outputs :

```json
{
  "actions": [
    {
      "id": "welcome_message",
      "type": "send_message",
      "config": { ... }
    },
    {
      "type": "add_role",
      "config": {
        "userId": "{{member.id}}"
      }
    }
  ]
}
```

### 3. Gérer les cas d'erreur

Les actions retournent toujours un statut `success` :

```typescript
{
  success: true,  // ou false en cas d'erreur
  data: { ... },
  error: "Message d'erreur" // si success = false
}
```

---

## 📚 Voir aussi

- [BaseAction.ts](/backend/src/modules/_base/BaseAction.ts) - Interface de base
- [BaseTrigger.ts](/backend/src/modules/_base/BaseTrigger.ts) - Interface de base
- [Workflow Engine](/backend/src/workflow-engine/) - Moteur d'exécution
