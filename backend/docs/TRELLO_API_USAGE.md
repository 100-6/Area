# Trello API Usage Guide

Complete documentation of Trello API routes available for the frontend.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Test Routes](#test-routes)
3. [Available Triggers](#available-triggers)
4. [Available Actions](#available-actions)
5. [Workflow Examples](#workflow-examples)

---

## 🔐 Authentication

### OAuth Login

To connect a user to Trello, redirect to:

```
GET /api/auth/trello
```

**Response:** Redirect to Trello authorization page.

**Callback:** User will be redirected to:
```
GET /api/auth/trello/callback?oauth_token={token}&oauth_verifier={verifier}
```

**Success page:** An HTML page displays success and automatically closes the popup.

---

## 🧪 Test Routes

### 1. Verify Trello Connection

```http
GET /api/trello/connection
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "connected": true,
  "message": "Trello connection is valid"
}
```

**Possible errors:**
- `401`: User not authenticated
- `401`: Trello not connected
- `500`: Verification error

---

### 2. List All Boards

```http
GET /api/trello/boards
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "671fe4cfbc4f7caa5a71fca1",
    "name": "My Project",
    "url": "https://trello.com/b/671fe4cf/my-project",
    "desc": "Board description",
    "closed": false
  },
  {
    "id": "582af5d0cd5g8dbb6b82gdb2",
    "name": "Another Board",
    "url": "https://trello.com/b/582af5d0/another-board",
    "desc": "",
    "closed": false
  }
]
```

**Use cases:** 
- Display boards list in a dropdown
- Select a board to create a `board.updated` or `board.closed` trigger
- Get a `boardId` to create a list

---

### 3. Get Specific Board

```http
GET /api/trello/boards/:boardId
Authorization: Bearer {jwt_token}
```

**Parameters:**
- `boardId`: Board ID (e.g., `671fe4cfbc4f7caa5a71fca1`)

**Response:**
```json
{
  "id": "671fe4cfbc4f7caa5a71fca1",
  "name": "My Project",
  "url": "https://trello.com/b/671fe4cf/my-project",
  "desc": "Description",
  "closed": false
}
```

**Possible errors:**
- `401`: Not authenticated
- `404`: Board not found
- `500`: Trello API error

---

## 🎯 Available Triggers

Triggers are used in nodes of type `trigger`.

### 1. Board Created

**Name:** `board.created`

**Description:** Triggers when a new board is created.

**Configuration:**
```json
{
  "boardId": ""
}
```

**Note:** Leave `boardId` empty to monitor ALL boards.

**Available variables:**
- `{{boardId}}` - ID of the created board
- `{{boardName}}` - Board name
- `{{boardUrl}}` - Board URL
- `{{boardDesc}}` - Board description
- `{{createdAt}}` - Creation timestamp

**Node example:**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.created",
  "config": {
    "boardId": ""
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board Created"
}
```

---

### 2. Board Updated

**Name:** `board.updated`

**Description:** Triggers when a board is modified (name or description).

**Configuration:**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1"
}
```

**Note:** `boardId` is **required** (specific board to monitor).

**Available variables:**
- `{{boardId}}` - ID of the updated board
- `{{boardName}}` - Current board name
- `{{changes}}` - Object containing the changes
- `{{updatedAt}}` - Update timestamp

**Node example:**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.updated",
  "config": {
    "boardId": "671fe4cfbc4f7caa5a71fca1"
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board Updated"
}
```

---

### 3. Board Closed

**Name:** `board.closed`

**Description:** Triggers when a board is archived/closed.

**Configuration:**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1"
}
```

**Note:** `boardId` is **required**.

**Available variables:**
- `{{boardId}}` - ID of the closed board
- `{{boardName}}` - Board name
- `{{closed}}` - Always `true`
- `{{closedAt}}` - Closing timestamp

**Node example:**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.closed",
  "config": {
    "boardId": "671fe4cfbc4f7caa5a71fca1"
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board Closed"
}
```

---

## ⚡ Available Actions

Actions are used in nodes of type `action`.

### 1. Create Card

**Name:** `card.create`

**Description:** Create a new card in a Trello list.

**Configuration:**
```json
{
  "listId": "5f4dcc3b5aa765416c5f2ba1",
  "name": "Card title",
  "desc": "Optional description",
  "position": "top"
}
```

**Fields:**
- `listId` (**required**): ID of the list where to create the card
- `name` (**required**): Card title
- `desc` (optional): Card description
- `position` (optional): `"top"` or `"bottom"` (default: `"bottom"`)

**Output variables:**
- `{{cardId}}` - ID of the created card
- `{{cardName}}` - Card name
- `{{cardUrl}}` - Card URL
- `{{listId}}` - List ID
- `{{boardId}}` - Board ID

**Node example:**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.create",
  "config": {
    "listId": "5f4dcc3b5aa765416c5f2ba1",
    "name": "New task: {{boardName}}",
    "desc": "Board URL: {{boardUrl}}",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Create Card"
}
```

---

### 2. Move Card

**Name:** `card.move`

**Description:** Move a card to another list.

**Configuration:**
```json
{
  "cardId": "5f4dcc3b5aa765416c5f2ba1",
  "listId": "6a2bef9c7dd876532e4a3cd2",
  "position": "bottom"
}
```

**Fields:**
- `cardId` (**required**): ID of the card to move
- `listId` (**required**): ID of the destination list
- `position` (optional): `"top"` or `"bottom"` (default: `"bottom"`)

**Output variables:**
- `{{cardId}}` - ID of the moved card
- `{{cardName}}` - Card name
- `{{cardUrl}}` - Card URL
- `{{newListId}}` - ID of the new list

**Node example:**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.move",
  "config": {
    "cardId": "5f4dcc3b5aa765416c5f2ba1",
    "listId": "6a2bef9c7dd876532e4a3cd2",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Move Card to Done"
}
```

---

### 3. Delete Card

**Name:** `card.delete`

**Description:** Delete a card.

**Configuration:**
```json
{
  "cardId": "5f4dcc3b5aa765416c5f2ba1"
}
```

**Fields:**
- `cardId` (**required**): ID of the card to delete

**Output variables:**
- `{{cardId}}` - ID of the deleted card
- `{{deleted}}` - Always `true`

**Node example:**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.delete",
  "config": {
    "cardId": "5f4dcc3b5aa765416c5f2ba1"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Delete Card"
}
```

---

### 4. Create List

**Name:** `list.create`

**Description:** Create a new list in a board.

**Configuration:**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1",
  "name": "To Do",
  "position": "bottom"
}
```

**Fields:**
- `boardId` (**required**): ID of the board where to create the list
- `name` (**required**): List name
- `position` (optional): `"top"` or `"bottom"` (default: `"bottom"`)

**Output variables:**
- `{{listId}}` - ID of the created list
- `{{listName}}` - List name
- `{{boardId}}` - Board ID

**Node example:**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "list.create",
  "config": {
    "boardId": "{{boardId}}",
    "name": "Auto-generated list",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Create List"
}
```

---

### 5. Delete List (Archive)

**Name:** `list.delete`

**Description:** Archive (close) a list.

**Configuration:**
```json
{
  "listId": "5f4dcc3b5aa765416c5f2ba1"
}
```

**Fields:**
- `listId` (**required**): ID of the list to archive

**Output variables:**
- `{{listId}}` - ID of the archived list
- `{{archived}}` - Always `true`

**Note:** Trello doesn't allow permanently deleting lists, only archiving them.

**Node example:**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "list.delete",
  "config": {
    "listId": "5f4dcc3b5aa765416c5f2ba1"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Archive List"
}
```

---

## 💡 Workflow Examples

### Example 1: Discord Notification on Board Creation

**Trigger:** `board.created`  
**Action:** Discord `send_message`

```json
{
  "name": "New Board → Discord Notification",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "discord",
      "reactionId": "send_message",
      "config": {
        "channelId": "1428004550136168568",
        "content": "🎉 New Trello board created!\n\n📋 **{{boardName}}**\n🔗 {{boardUrl}}"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

### Example 2: Auto-create List in New Board

**Trigger:** `board.created`  
**Action:** `list.create`

```json
{
  "name": "New Board → Create To Do List",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "trello",
      "reactionId": "list.create",
      "config": {
        "boardId": "{{boardId}}",
        "name": "To Do",
        "position": "top"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

### Example 3: Create Card When Board is Created

**Trigger:** `board.created`  
**Action:** `card.create`

```json
{
  "name": "New Board → Create Welcome Card",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "trello",
      "reactionId": "card.create",
      "config": {
        "listId": "5f4dcc3b5aa765416c5f2ba1",
        "name": "Welcome to {{boardName}}!",
        "desc": "This board was created automatically.\n\n🔗 Access: {{boardUrl}}",
        "position": "top"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

## 🔧 How to Get IDs

### Board ID

```http
GET /api/trello/boards
```

Retrieves the list of boards with their IDs.

### List ID

**Method 1 - Trello URL:**
1. Open a card on Trello
2. Add `.json` to the URL
3. Search for `"idList"` in the JSON

**Method 2 - Direct API:**
```http
GET https://api.trello.com/1/boards/{boardId}/lists?key={apiKey}&token={token}
```

### Card ID

**Method - Trello URL:**
1. Open a card
2. The URL contains the card ID: `https://trello.com/c/ABC123/...`
3. The card ID is `ABC123`

Or add `.json` to the URL to see all details.

---

## 📝 Important Notes

### Polling

- Trello triggers use **polling** (check every 60 seconds)
- There may be a delay of **maximum 60 seconds** before an event is detected

### Variables

- All variables are usable with the syntax `{{variableName}}`
- Variables can be used in any action configuration field
- Example: `{{boardName}}`, `{{cardUrl}}`, `{{listId}}`

### Permissions

- User must have connected their Trello account via OAuth
- Required scopes: `read` and `write`
- Connection expires after some time (Trello OAuth token)

### Rate Limits

- Default limit: **1000 actions/hour**
- Trello API: **300 requests/10 seconds** per token

---

## 🐛 Debugging

### Check Connection

```http
GET /api/trello/connection
```

If error, reconnect via:
```http
GET /api/auth/trello
```

### Backend Logs

Trello logs are prefixed with `[Trello]`:
- `[Trello] Creating card...` - Action in progress
- `[Trello] ✓ Card created` - Success
- `[Trello] Error ...` - Error

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Trello not connected` | OAuth not done | Connect via `/api/auth/trello` |
| `listId is required` | Missing config | Check node configuration |
| `TRELLO_API_KEY not configured` | Missing `.env` | Add `TRELLO_API_KEY` in `.env` |
| `401 Unauthorized` | Expired token | Reconnect to Trello |

---

## 🚀 Upcoming Features

Coming features:
- ✅ Create card
- ✅ Move card
- ✅ Delete card
- ✅ Create list
- ✅ Archive list
- 🔜 Add comment to card
- 🔜 Assign member to card
- 🔜 Set deadline on card
- 🔜 Add label to card

---

**Documentation updated:** October 30, 2025  
**Trello module version:** 1.0.0

---

## 🔐 Authentication

### OAuth Login

Pour connecter un utilisateur à Trello, rediriger vers :

```
GET /api/auth/trello
```

**Réponse :** Redirection vers la page d'autorisation Trello.

**Callback :** L'utilisateur sera redirigé vers :
```
GET /api/auth/trello/callback?oauth_token={token}&oauth_verifier={verifier}
```

**Page de succès :** Une page HTML affiche le succès et ferme automatiquement la popup.

---

## 🧪 Routes de test

### 1. Vérifier la connexion Trello

```http
GET /api/trello/connection
Authorization: Bearer {jwt_token}
```

**Réponse :**
```json
{
  "connected": true,
  "message": "Trello connection is valid"
}
```

**Erreurs possibles :**
- `401` : Utilisateur non authentifié
- `401` : Trello non connecté
- `500` : Erreur de vérification

---

### 2. Lister tous les boards

```http
GET /api/trello/boards
Authorization: Bearer {jwt_token}
```

**Réponse :**
```json
[
  {
    "id": "671fe4cfbc4f7caa5a71fca1",
    "name": "Mon projet",
    "url": "https://trello.com/b/671fe4cf/mon-projet",
    "desc": "Description du board",
    "closed": false
  },
  {
    "id": "582af5d0cd5g8dbb6b82gdb2",
    "name": "Autre board",
    "url": "https://trello.com/b/582af5d0/autre-board",
    "desc": "",
    "closed": false
  }
]
```

**Cas d'usage :** 
- Afficher la liste des boards dans une dropdown
- Sélectionner un board pour créer un trigger `board.updated` ou `board.closed`
- Obtenir un `boardId` pour créer une liste

---

### 3. Récupérer un board spécifique

```http
GET /api/trello/boards/:boardId
Authorization: Bearer {jwt_token}
```

**Paramètres :**
- `boardId` : ID du board (ex: `671fe4cfbc4f7caa5a71fca1`)

**Réponse :**
```json
{
  "id": "671fe4cfbc4f7caa5a71fca1",
  "name": "Mon projet",
  "url": "https://trello.com/b/671fe4cf/mon-projet",
  "desc": "Description",
  "closed": false
}
```

**Erreurs possibles :**
- `401` : Non authentifié
- `404` : Board introuvable
- `500` : Erreur API Trello

---

## 🎯 Triggers disponibles

Les triggers sont utilisés dans les nodes de type `trigger`.

### 1. Board Created

**Nom :** `board.created`

**Description :** Se déclenche quand un nouveau board est créé.

**Configuration :**
```json
{
  "boardId": ""
}
```

**Note :** Laisser `boardId` vide pour surveiller TOUS les boards.

**Variables disponibles :**
- `{{boardId}}` - ID du board créé
- `{{boardName}}` - Nom du board
- `{{boardUrl}}` - URL du board
- `{{boardDesc}}` - Description du board
- `{{createdAt}}` - Timestamp de création

**Exemple de node :**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.created",
  "config": {
    "boardId": ""
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board créé"
}
```

---

### 2. Board Updated

**Nom :** `board.updated`

**Description :** Se déclenche quand un board est modifié (nom ou description).

**Configuration :**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1"
}
```

**Note :** `boardId` est **obligatoire** (board spécifique à surveiller).

**Variables disponibles :**
- `{{boardId}}` - ID du board modifié
- `{{boardName}}` - Nom actuel du board
- `{{changes}}` - Objet contenant les changements
- `{{updatedAt}}` - Timestamp de modification

**Exemple de node :**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.updated",
  "config": {
    "boardId": "671fe4cfbc4f7caa5a71fca1"
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board modifié"
}
```

---

### 3. Board Closed

**Nom :** `board.closed`

**Description :** Se déclenche quand un board est archivé/fermé.

**Configuration :**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1"
}
```

**Note :** `boardId` est **obligatoire**.

**Variables disponibles :**
- `{{boardId}}` - ID du board fermé
- `{{boardName}}` - Nom du board
- `{{closed}}` - Toujours `true`
- `{{closedAt}}` - Timestamp de fermeture

**Exemple de node :**
```json
{
  "nodeType": "trigger",
  "serviceId": "trello",
  "actionId": "board.closed",
  "config": {
    "boardId": "671fe4cfbc4f7caa5a71fca1"
  },
  "positionX": 120,
  "positionY": 220,
  "label": "Trello • Board fermé"
}
```

---

## ⚡ Actions disponibles

Les actions sont utilisées dans les nodes de type `action`.

### 1. Create Card

**Nom :** `card.create`

**Description :** Créer une nouvelle carte dans une liste Trello.

**Configuration :**
```json
{
  "listId": "5f4dcc3b5aa765416c5f2ba1",
  "name": "Titre de la carte",
  "desc": "Description optionnelle",
  "position": "top"
}
```

**Champs :**
- `listId` (**requis**) : ID de la liste où créer la carte
- `name` (**requis**) : Titre de la carte
- `desc` (optionnel) : Description de la carte
- `position` (optionnel) : `"top"` ou `"bottom"` (défaut: `"bottom"`)

**Variables de sortie :**
- `{{cardId}}` - ID de la carte créée
- `{{cardName}}` - Nom de la carte
- `{{cardUrl}}` - URL de la carte
- `{{listId}}` - ID de la liste
- `{{boardId}}` - ID du board

**Exemple de node :**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.create",
  "config": {
    "listId": "5f4dcc3b5aa765416c5f2ba1",
    "name": "Nouvelle tâche: {{boardName}}",
    "desc": "Board URL: {{boardUrl}}",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Create Card"
}
```

---

### 2. Move Card

**Nom :** `card.move`

**Description :** Déplacer une carte vers une autre liste.

**Configuration :**
```json
{
  "cardId": "5f4dcc3b5aa765416c5f2ba1",
  "listId": "6a2bef9c7dd876532e4a3cd2",
  "position": "bottom"
}
```

**Champs :**
- `cardId` (**requis**) : ID de la carte à déplacer
- `listId` (**requis**) : ID de la liste de destination
- `position` (optionnel) : `"top"` ou `"bottom"` (défaut: `"bottom"`)

**Variables de sortie :**
- `{{cardId}}` - ID de la carte déplacée
- `{{cardName}}` - Nom de la carte
- `{{cardUrl}}` - URL de la carte
- `{{newListId}}` - ID de la nouvelle liste

**Exemple de node :**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.move",
  "config": {
    "cardId": "5f4dcc3b5aa765416c5f2ba1",
    "listId": "6a2bef9c7dd876532e4a3cd2",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Move Card to Done"
}
```

---

### 3. Delete Card

**Nom :** `card.delete`

**Description :** Supprimer une carte.

**Configuration :**
```json
{
  "cardId": "5f4dcc3b5aa765416c5f2ba1"
}
```

**Champs :**
- `cardId` (**requis**) : ID de la carte à supprimer

**Variables de sortie :**
- `{{cardId}}` - ID de la carte supprimée
- `{{deleted}}` - Toujours `true`

**Exemple de node :**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "card.delete",
  "config": {
    "cardId": "5f4dcc3b5aa765416c5f2ba1"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Delete Card"
}
```

---

### 4. Create List

**Nom :** `list.create`

**Description :** Créer une nouvelle liste dans un board.

**Configuration :**
```json
{
  "boardId": "671fe4cfbc4f7caa5a71fca1",
  "name": "To Do",
  "position": "bottom"
}
```

**Champs :**
- `boardId` (**requis**) : ID du board où créer la liste
- `name` (**requis**) : Nom de la liste
- `position` (optionnel) : `"top"` ou `"bottom"` (défaut: `"bottom"`)

**Variables de sortie :**
- `{{listId}}` - ID de la liste créée
- `{{listName}}` - Nom de la liste
- `{{boardId}}` - ID du board

**Exemple de node :**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "list.create",
  "config": {
    "boardId": "{{boardId}}",
    "name": "Auto-generated list",
    "position": "top"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Create List"
}
```

---

### 5. Delete List (Archive)

**Nom :** `list.delete`

**Description :** Archiver (fermer) une liste.

**Configuration :**
```json
{
  "listId": "5f4dcc3b5aa765416c5f2ba1"
}
```

**Champs :**
- `listId` (**requis**) : ID de la liste à archiver

**Variables de sortie :**
- `{{listId}}` - ID de la liste archivée
- `{{archived}}` - Toujours `true`

**Note :** Trello ne permet pas de supprimer définitivement une liste, seulement l'archiver.

**Exemple de node :**
```json
{
  "nodeType": "action",
  "serviceId": "trello",
  "reactionId": "list.delete",
  "config": {
    "listId": "5f4dcc3b5aa765416c5f2ba1"
  },
  "positionX": 400,
  "positionY": 220,
  "label": "Archive List"
}
```

---

## 💡 Exemples de workflows

### Exemple 1 : Notification Discord à la création d'un board

**Trigger :** `board.created`  
**Action :** Discord `send_message`

```json
{
  "name": "New Board → Discord Notification",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "discord",
      "reactionId": "send_message",
      "config": {
        "channelId": "1428004550136168568",
        "content": "🎉 Nouveau board Trello créé !\n\n📋 **{{boardName}}**\n🔗 {{boardUrl}}"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

### Exemple 2 : Auto-créer une liste dans chaque nouveau board

**Trigger :** `board.created`  
**Action :** `list.create`

```json
{
  "name": "New Board → Create To Do List",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "trello",
      "reactionId": "list.create",
      "config": {
        "boardId": "{{boardId}}",
        "name": "To Do",
        "position": "top"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

### Exemple 3 : Créer une carte quand un board est créé

**Trigger :** `board.created`  
**Action :** `card.create`

```json
{
  "name": "New Board → Create Welcome Card",
  "enabled": true,
  "nodes": [
    {
      "id": "trigger-1",
      "nodeType": "trigger",
      "serviceId": "trello",
      "actionId": "board.created",
      "config": { "boardId": "" }
    },
    {
      "id": "action-1",
      "nodeType": "action",
      "serviceId": "trello",
      "reactionId": "card.create",
      "config": {
        "listId": "5f4dcc3b5aa765416c5f2ba1",
        "name": "Bienvenue dans {{boardName}} !",
        "desc": "Ce board a été créé automatiquement.\n\n🔗 Accès: {{boardUrl}}",
        "position": "top"
      }
    }
  ],
  "connections": [
    { "sourceNodeId": "trigger-1", "targetNodeId": "action-1" }
  ]
}
```

---

## 🔧 Comment obtenir les IDs

### Board ID

```http
GET /api/trello/boards
```

Récupère la liste des boards avec leurs IDs.

### List ID

**Méthode 1 - URL Trello :**
1. Ouvre une carte sur Trello
2. Ajoute `.json` à l'URL
3. Cherche `"idList"` dans le JSON

**Méthode 2 - API directe :**
```http
GET https://api.trello.com/1/boards/{boardId}/lists?key={apiKey}&token={token}
```

### Card ID

**Méthode - URL Trello :**
1. Ouvre une carte
2. L'URL contient le card ID : `https://trello.com/c/ABC123/...`
3. Le card ID est `ABC123`

Ou ajoute `.json` à l'URL pour voir tous les détails.

---

## 📝 Notes importantes

### Polling

- Les triggers Trello utilisent le **polling** (vérification toutes les 60 secondes)
- Il peut y avoir un délai de **maximum 60 secondes** avant détection d'un événement

### Variables

- Toutes les variables sont utilisables avec la syntaxe `{{variableName}}`
- Les variables peuvent être utilisées dans n'importe quel champ de configuration d'action
- Exemple : `{{boardName}}`, `{{cardUrl}}`, `{{listId}}`

### Permissions

- L'utilisateur doit avoir connecté son compte Trello via OAuth
- Les scopes requis : `read` et `write`
- La connexion expire après un certain temps (token OAuth Trello)

### Rate Limits

- Limite par défaut : **1000 actions/heure**
- API Trello : **300 requêtes/10 secondes** par token

---

## 🐛 Debugging

### Vérifier la connexion

```http
GET /api/trello/connection
```

Si erreur, reconnecter via :
```http
GET /api/auth/trello
```

### Logs backend

Les logs Trello sont préfixés par `[Trello]` :
- `[Trello] Creating card...` - Action en cours
- `[Trello] ✓ Card created` - Succès
- `[Trello] Error ...` - Erreur

### Erreurs communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Trello not connected` | OAuth non fait | Se connecter via `/api/auth/trello` |
| `listId is required` | Config manquante | Vérifier la config du node |
| `TRELLO_API_KEY not configured` | `.env` manquant | Ajouter `TRELLO_API_KEY` dans `.env` |
| `401 Unauthorized` | Token expiré | Reconnecter à Trello |

---

## 🚀 Prochaines fonctionnalités

Fonctionnalités à venir :
- ✅ Créer une carte
- ✅ Déplacer une carte
- ✅ Supprimer une carte
- ✅ Créer une liste
- ✅ Archiver une liste
- 🔜 Ajouter un commentaire à une carte
- 🔜 Assigner un membre à une carte
- 🔜 Définir une deadline sur une carte
- 🔜 Ajouter un label à une carte

---

**Documentation mise à jour le :** 30 octobre 2025  
**Version du module Trello :** 1.0.0
