# Reddit Module

Module d'intégration Reddit pour Mirror-Area permettant d'automatiser les interactions avec Reddit via OAuth2.

## Configuration OAuth

Pour utiliser ce module, vous devez créer une application Reddit et obtenir les credentials OAuth2 :

1. Allez sur https://www.reddit.com/prefs/apps
2. Cliquez sur "create another app..." (en bas de la page)
3. Remplissez le formulaire :
   - **name** : Mirror-Area (ou le nom de votre choix)
   - **App type** : choisissez "web app"
   - **description** : (optionnel)
   - **about url** : (optionnel)
   - **redirect uri** : `http://localhost:8080/api/reddit/callback` (ajustez selon votre environnement)
4. Cliquez sur "create app"

Configurez ensuite les variables d'environnement suivantes dans votre fichier `.env` :

```env
REDDIT_CLIENT_ID=votre_client_id
REDDIT_CLIENT_SECRET=votre_client_secret
REDDIT_REDIRECT_URI=http://localhost:8080/api/reddit/callback
```

## Scopes OAuth

Le module demande les permissions suivantes :
- `identity` : Accès à l'identité de l'utilisateur
- `read` : Lecture des posts et commentaires
- `save` : Sauvegarder et retirer des posts
- `submit` : Soumettre des posts et commentaires
- `vote` : Voter sur les posts et commentaires
- `history` : Accès à l'historique de navigation
- `mysubreddits` : Accès aux subreddits suivis
- `privatemessages` : Envoyer et recevoir des messages privés
- `edit` : Éditer et supprimer son propre contenu
- `flair` : Gérer les flairs des posts

## Triggers disponibles

### 1. OnNewPostInSubreddit
Déclenche un workflow lorsqu'un nouveau post apparaît dans un subreddit spécifique.

**Configuration :**
- `subreddit` : Nom du subreddit à surveiller (sans "r/")
- `pollingInterval` : Intervalle de vérification en ms (minimum 60000ms = 1 min)

**Variables disponibles :**
- `{{id}}` : ID du post
- `{{title}}` : Titre du post
- `{{author}}` : Auteur du post
- `{{subreddit}}` : Nom du subreddit
- `{{selftext}}` : Texte du post (pour les text posts)
- `{{url}}` : URL du post
- `{{permalink}}` : Lien permanent Reddit
- `{{score}}` : Score du post (upvotes - downvotes)
- `{{numComments}}` : Nombre de commentaires
- `{{created}}` : Date de création
- `{{fullname}}` : ID complet Reddit (t3_xxx)

### 2. OnNewSavedPost
Déclenche un workflow lorsque vous sauvegardez un nouveau post.

**Configuration :**
- `pollingInterval` : Intervalle de vérification en ms (minimum 60000ms = 1 min)

**Variables disponibles :** (mêmes que OnNewPostInSubreddit)

### 3. OnNewMessageReceived
Déclenche un workflow lorsque vous recevez un nouveau message privé.

**Configuration :**
- `filterByUser` : (Optionnel) Filtrer par nom d'utilisateur
- `pollingInterval` : Intervalle de vérification en ms (minimum 60000ms = 1 min)

**Variables disponibles :**
- `{{id}}` : ID du message
- `{{sender}}` : Nom d'utilisateur de l'expéditeur
- `{{subject}}` : Sujet du message
- `{{body}}` : Corps du message
- `{{timestamp}}` : Date/heure de réception
- `{{context}}` : Contexte/lien si applicable
- `{{fullname}}` : ID complet Reddit (t4_xxx)

### 4. OnKeywordInSubreddit
Déclenche un workflow lorsqu'un mot-clé apparaît dans les nouveaux posts d'un subreddit.

**Configuration :**
- `subreddit` : Nom du subreddit à surveiller (sans "r/")
- `keywords` : Liste de mots-clés à surveiller (insensible à la casse)
- `matchTitle` : Rechercher dans les titres (défaut: true)
- `matchBody` : Rechercher dans le corps des posts (défaut: true)
- `pollingInterval` : Intervalle de vérification en ms (minimum 60000ms = 1 min)

**Variables disponibles :**
- Toutes les variables de OnNewPostInSubreddit, plus :
- `{{matchedKeyword}}` : Le mot-clé qui a déclenché le match
- `{{matchedIn}}` : Où le mot-clé a été trouvé (title, body, ou both)

### 5. OnUserMentioned
Déclenche un workflow lorsque vous êtes mentionné (u/username) dans un commentaire ou post.

**Configuration :**
- `pollingInterval` : Intervalle de vérification en ms (minimum 60000ms = 1 min)

**Variables disponibles :**
- `{{id}}` : ID de la mention
- `{{author}}` : Auteur qui vous a mentionné
- `{{subreddit}}` : Subreddit où vous avez été mentionné
- `{{body}}` : Texte contenant la mention
- `{{context}}` : Contexte/lien permanent
- `{{postTitle}}` : Titre du post (si disponible)
- `{{timestamp}}` : Date/heure de la mention
- `{{fullname}}` : ID complet Reddit

## Actions disponibles

### 1. SubmitPost
Publie un post texte dans un subreddit.

**Configuration :**
- `subreddit` : Nom du subreddit (sans "r/")
- `title` : Titre du post (supporte les variables)
- `text` : Contenu du post (supporte les variables)

**Variables de sortie :**
- `{{postId}}` : ID du post créé
- `{{url}}` : URL du post créé

### 2. SubmitComment
Publie un commentaire sur un post.

**Configuration :**
- `postId` : ID du post (peut utiliser `{{fullname}}` ou `{{id}}`)
- `text` : Texte du commentaire (supporte les variables)

**Variables de sortie :**
- `{{commentId}}` : ID du commentaire créé

### 3. SavePost
Sauvegarde un post dans vos posts sauvegardés.

**Configuration :**
- `postId` : ID du post à sauvegarder (peut utiliser `{{fullname}}` ou `{{id}}`)

**Variables de sortie :**
- `{{saved}}` : true si le post a été sauvegardé avec succès

### 4. Upvote
Met un upvote sur un post ou commentaire.

**Configuration :**
- `thingId` : ID complet de l'élément (utiliser `{{fullname}}`)

**Variables de sortie :**
- `{{upvoted}}` : true si l'upvote a été effectué avec succès

### 5. SendPrivateMessage
Envoie un message privé à un utilisateur Reddit.

**Configuration :**
- `to` : Nom d'utilisateur du destinataire (sans "u/", supporte les variables)
- `subject` : Sujet du message (supporte les variables)
- `body` : Corps du message (supporte les variables)

**Variables de sortie :**
- `{{recipient}}` : Nom d'utilisateur du destinataire
- `{{subject}}` : Sujet du message
- `{{sentAt}}` : Timestamp d'envoi

### 6. EditComment
Édite un commentaire ou post existant.

**Configuration :**
- `thingId` : ID complet (t1_xxx pour commentaire, t3_xxx pour post, supporte les variables)
- `newText` : Nouveau texte (supporte les variables)

**Variables de sortie :**
- `{{thingId}}` : ID de l'élément édité
- `{{editedAt}}` : Timestamp de l'édition

### 7. DeletePostOrComment
Supprime un post ou commentaire que vous avez créé.

**Configuration :**
- `thingId` : ID complet (t1_xxx pour commentaire, t3_xxx pour post, supporte les variables)

**Variables de sortie :**
- `{{thingId}}` : ID de l'élément supprimé
- `{{deletedAt}}` : Timestamp de la suppression

### 8. SetFlair
Définit le flair d'un post dans un subreddit.

**Configuration :**
- `subreddit` : Nom du subreddit (sans "r/", supporte les variables)
- `postId` : ID complet du post (t3_xxx, supporte les variables)
- `flairText` : Texte du flair (supporte les variables)

**Variables de sortie :**
- `{{postId}}` : ID du post
- `{{subreddit}}` : Nom du subreddit
- `{{flairText}}` : Texte du flair défini
- `{{setAt}}` : Timestamp de l'opération

## Exemple de workflow

### Exemple 1 : Réponse automatique aux mentions

**Trigger :** OnUserMentioned

**Action :** SendPrivateMessage
- To : `{{author}}`
- Subject : `Thanks for mentioning me!`
- Body : `I saw your mention in r/{{subreddit}}: {{body}}`

### Exemple 2 : Veille automatique sur des mots-clés

**Trigger :** OnKeywordInSubreddit
- Subreddit : `javascript`
- Keywords : `["react", "vue", "angular"]`

**Action 1 :** SavePost
- Post ID : `{{fullname}}`

**Action 2 :** SendPrivateMessage (vers vous-même ou un canal Discord)
- Subject : `Keyword Alert: {{matchedKeyword}}`
- Body : `Found in r/{{subreddit}}: {{title}} - {{permalink}}`

### Exemple 3 : Auto-modération

**Trigger :** OnNewPostInSubreddit
- Subreddit : `mysubreddit`

**Action 1 :** (Condition basée sur le contenu)

**Action 2 :** SetFlair
- Subreddit : `{{subreddit}}`
- Post ID : `{{fullname}}`
- Flair Text : `Needs Review`

### Exemple 4 : Réponse automatique aux messages privés

**Trigger :** OnNewMessageReceived

**Action :** SendPrivateMessage
- To : `{{sender}}`
- Subject : `Re: {{subject}}`
- Body : `Thank you for your message. I'll respond as soon as possible.`

## API Endpoints

### OAuth
- `GET /api/reddit/connect` : Initialiser la connexion OAuth
- `GET /api/reddit/callback` : Callback OAuth (utilisé par Reddit)

### User Info
- `GET /api/reddit/me` : Obtenir le profil de l'utilisateur connecté

### Posts
- `GET /api/reddit/r/:subreddit` : Obtenir les posts d'un subreddit
  - Query params : `sort` (hot/new/top/rising), `limit` (default: 25)
- `GET /api/reddit/saved` : Obtenir les posts sauvegardés
  - Query params : `limit` (default: 25)

### Actions
- `POST /api/reddit/submit` : Publier un post
  - Body : `{ subreddit, title, text }`
- `POST /api/reddit/comment` : Publier un commentaire
  - Body : `{ postId, text }`

## Notes importantes

1. **Rate Limiting** : Reddit a des limites strictes sur le nombre de requêtes. Utilisez des intervalles de polling raisonnables (minimum 60 secondes).

2. **Email** : Reddit ne fournit pas l'email via l'API OAuth. Le module utilise `username@reddit.local` comme placeholder.

3. **Permissions** : Certaines actions nécessitent que l'utilisateur ait les permissions appropriées dans le subreddit (ex: poster dans un subreddit privé).

4. **Post IDs** : Reddit utilise des IDs avec préfixes :
   - `t3_` pour les posts (submissions)
   - `t1_` pour les commentaires
   - Le module gère automatiquement l'ajout du préfixe si nécessaire

## Architecture

```
reddit/
├── service.ts              # Module principal
├── config.ts              # Configuration du module
├── controller.ts          # Contrôleur REST
├── routes.ts             # Routes Express
├── RedditApiService.ts   # Service API Reddit
├── triggers/
│   ├── OnNewPostInSubredditTrigger.ts
│   ├── OnNewSavedPostTrigger.ts
│   ├── OnNewMessageReceivedTrigger.ts
│   ├── OnKeywordInSubredditTrigger.ts
│   └── OnUserMentionedTrigger.ts
└── actions/
    ├── SubmitPostAction.ts
    ├── SubmitCommentAction.ts
    ├── SavePostAction.ts
    ├── UpvoteAction.ts
    ├── SendPrivateMessageAction.ts
    ├── EditCommentAction.ts
    ├── DeletePostOrCommentAction.ts
    └── SetFlairAction.ts
```

## Développement

Pour ajouter un nouveau trigger ou action :

1. Créer la classe dans `triggers/` ou `actions/`
2. Étendre `BaseTrigger` ou `BaseAction`
3. Implémenter les méthodes requises
4. Enregistrer dans `service.ts` dans la méthode `initialize()`
5. Redémarrer le backend pour synchroniser avec la DB

## Dépendances

- `axios` : Requêtes HTTP vers l'API Reddit
- `colors` : Logs colorés dans la console

## Liens utiles

- [Reddit API Documentation](https://www.reddit.com/dev/api)
- [Reddit OAuth2 Guide](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Reddit App Registration](https://www.reddit.com/prefs/apps)
