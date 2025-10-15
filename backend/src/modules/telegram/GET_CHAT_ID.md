# 🆔 Comment obtenir votre Chat ID Telegram

## Méthode Simple (Recommandée) ⭐

### Pour un chat privé :

1. **Trouvez votre bot** sur Telegram
   - Cherchez `@votre_nom_de_bot` dans Telegram
   
2. **Démarrez la conversation**
   - Envoyez : `/start`
   
3. **Obtenez votre ID**
   - Envoyez : `/myid`
   - Le bot vous répondra avec votre chat ID
   
4. **Copiez l'ID**
   - Exemple : `123456789`
   - Utilisez cet ID dans vos triggers Mirror-Area

### Pour un groupe :

1. **Ajoutez le bot au groupe**
   - Ouvrez votre groupe Telegram
   - Menu → Ajouter des membres
   - Cherchez et ajoutez votre bot

2. **Obtenez l'ID du groupe**
   - Dans le groupe, envoyez : `/myid`
   - Le bot répondra avec l'ID du groupe
   
3. **Copiez l'ID**
   - Exemple : `-1001234567890` (toujours négatif pour les groupes !)
   - Utilisez cet ID dans vos triggers

---

## Commandes disponibles

Votre bot comprend ces commandes :

| Commande | Description |
|----------|-------------|
| `/start` | Message de bienvenue |
| `/myid` | Obtenir votre chat ID (privé ou groupe) |
| `/help` | Afficher l'aide |

---

## Exemples

### Exemple 1 : Chat privé
```
Vous → /myid
Bot → 👤 Your personal chat ID is: 123456789

Use this ID in your Mirror-Area triggers to monitor messages in this chat.

📋 Copy this ID and paste it in the "Chat ID" field when creating a Telegram trigger.
```

### Exemple 2 : Groupe
```
Vous (dans le groupe) → /myid
Bot → 👥 This supergroup chat ID is: -1001234567890

Use this ID in your Mirror-Area triggers to monitor messages in this chat.

📋 Copy this ID and paste it in the "Chat ID" field when creating a Telegram trigger.
```

---

## Configuration du Trigger

Une fois que vous avez votre chat ID :

```json
{
  "chatId": "123456789",
  "ignoreBots": true
}
```

Ou pour un groupe :

```json
{
  "chatId": "-1001234567890",
  "ignoreBots": true
}
```

---

## Points Importants

✅ **Chats privés** : ID positif (ex: `123456789`)  
✅ **Groupes/Supergroups** : ID négatif (ex: `-1001234567890`)  
✅ **Pas besoin d'API** : Tout se fait directement dans Telegram  
✅ **Instantané** : Vous obtenez l'ID immédiatement  

---

## Troubleshooting

### Le bot ne répond pas à /myid

**Solution** :
1. Vérifiez que le bot est bien démarré (backend en cours d'exécution)
2. Vérifiez les logs backend pour les erreurs
3. Essayez `/start` d'abord pour réveiller le bot

### L'ID ne fonctionne pas dans le trigger

**Vérifications** :
- Chat privé : utilisez un nombre positif sans guillemets dans le JSON
- Groupe : utilisez un nombre négatif avec le signe `-`
- Format : chaîne de caractères dans la config : `"chatId": "123456789"`

### Je ne trouve pas mon bot

**Solution** :
1. Vérifiez le username du bot avec :
   ```bash
   curl http://localhost:8080/api/telegram/bot/info \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
2. Le username sera affiché dans `bot.username`
3. Cherchez `@username` dans Telegram

---

## API Alternative

Si vous préférez utiliser l'API :

```bash
GET /api/telegram/bot/info
```

Réponse :
```json
{
  "bot": {
    "username": "your_bot",
    ...
  },
  "how_to_get_chat_id": {
    "step1": "Open Telegram and search for @your_bot",
    "step2": "Send the command: /start",
    "step3": "Send the command: /myid",
    "step4": "The bot will reply with your chat ID"
  }
}
```

---

**C'est tout ! Maintenant vous pouvez créer vos automations Telegram ! 🎉**
