# Strava Module

Module d'intégration Strava pour Mirror-Area. Permet d'automatiser les interactions avec Strava (activités sportives, statistiques, kudos, commentaires).

## 🔑 Configuration OAuth

### 1. Créer une application Strava

1. Aller sur https://www.strava.com/settings/api
2. Créer une nouvelle application
3. Configurer les URLs de callback:
   - **Authorization Callback Domain**: `localhost` (développement) ou votre domaine (production)
   - **Authorization Callback URL**: `http://localhost:8080/api/strava/callback` (développement)

### 2. Variables d'environnement

Ajouter dans le fichier `.env`:

```env
# Strava OAuth
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
STRAVA_REDIRECT_URI=http://localhost:8080/api/strava/callback
```

### 3. Scopes OAuth

Le module demande les permissions suivantes:
- `read` - Lecture des informations publiques
- `activity:read` - Lecture des activités
- `activity:read_all` - Lecture de toutes les activités (privées incluses)
- `activity:write` - Création et modification d'activités
- `profile:read_all` - Lecture du profil complet

## 📡 Endpoints API

### OAuth

#### `GET /api/strava/connect`
Initie la connexion OAuth Strava.

**Query Parameters:**
- `token` (string): JWT token de l'utilisateur authentifié

#### `GET /api/strava/callback`
Callback OAuth appelé par Strava après autorisation.

### Profil & Activités

#### `GET /api/strava/athlete`
Récupère le profil de l'athlète connecté.

**Response:**
```json
{
  "athlete": {
    "id": 12345,
    "username": "athlete_username",
    "firstname": "John",
    "lastname": "Doe",
    "city": "Paris",
    "country": "France",
    "profile": "https://avatar.url"
  }
}
```

#### `GET /api/strava/activities`
Récupère les activités de l'athlète.

**Query Parameters:**
- `page` (number): Numéro de page (défaut: 1)
- `perPage` (number): Résultats par page (défaut: 30, max: 200)
- `before` (number): Timestamp epoch pour filtrer avant
- `after` (number): Timestamp epoch pour filtrer après

**Response:**
```json
{
  "activities": [
    {
      "id": 123456,
      "name": "Morning Run",
      "type": "Run",
      "distance": 5000.0,
      "moving_time": 1800,
      "elapsed_time": 2000,
      "total_elevation_gain": 50.0,
      "start_date": "2023-10-01T08:00:00Z",
      "average_speed": 2.78
    }
  ],
  "count": 1
}
```

#### `GET /api/strava/activities/:id`
Récupère une activité spécifique.

#### `GET /api/strava/athlete/:id/stats`
Récupère les statistiques de l'athlète.

### Interactions

#### `POST /api/strava/activities/:id/kudos`
Donne des kudos à une activité.

#### `POST /api/strava/activities/:id/comments`
Crée un commentaire sur une activité.

**Body:**
```json
{
  "text": "Great run! 🏃"
}
```

## 🎯 Triggers

### `on_new_activity`
Déclenché lorsqu'une nouvelle activité est enregistrée sur Strava.

**Configuration:**
```json
{
  "pollingInterval": 300000,
  "activityType": "Run"
}
```

**Output Data:**
```json
{
  "id": 123456,
  "name": "Morning Run",
  "type": "Run",
  "sport_type": "Run",
  "distance": 5000.0,
  "moving_time": 1800,
  "elapsed_time": 2000,
  "total_elevation_gain": 50.0,
  "start_date": "2023-10-01T08:00:00Z",
  "average_speed": 2.78,
  "max_speed": 3.5,
  "average_heartrate": 150,
  "calories": 300
}
```

## ⚡ Actions

### `create_activity`
Crée une nouvelle activité manuelle sur Strava.

**Configuration:**
```json
{
  "name": "Evening Walk",
  "type": "Walk",
  "start_date_local": "2025-10-29T18:00:00Z",
  "elapsed_time": 3600,
  "description": "Nice walk in the park",
  "distance": 4000,
  "trainer": false,
  "commute": false
}
```

**Note**: 
- `sport_type` est automatiquement défini avec la même valeur que `type`.
- Utilisez une date récente pour `start_date_local` pour éviter les conflits. Strava peut refuser les activités trop anciennes ou en doublon.

### `update_activity`
Met à jour une activité existante.

**Configuration:**
```json
{
  "activityId": 123456,
  "name": "Updated Activity Name",
  "description": "Updated description",
  "type": "Run",
  "commute": true
}
```

**Note**: Si vous modifiez le `type`, le `sport_type` sera automatiquement mis à jour avec la même valeur.

### `give_kudos`
Donne des kudos à une activité.

**Configuration:**
```json
{
  "activityId": 123456
}
```

### `create_comment`
Crée un commentaire sur une activité.

**Configuration:**
```json
{
  "activityId": 123456,
  "text": "Great job! Keep it up 💪"
}
```

## 🔄 Variables

Le module supporte les variables dans les actions pour utiliser les données des triggers:

**Exemple:** Commenter automatiquement les nouvelles activités
```json
{
  "trigger": "on_new_activity",
  "action": "create_comment",
  "config": {
    "activityId": "{{id}}",
    "text": "Congrats on your {{type}}! Distance: {{distance}}m"
  }
}
```

## 📊 Types d'activités supportés

- Run (Course à pied)
- Ride (Vélo)
- Swim (Natation)
- Walk (Marche)
- Hike (Randonnée)
- AlpineSki (Ski alpin)
- BackcountrySki (Ski de randonnée)
- Canoeing (Canoë)
- Crossfit
- EBikeRide (Vélo électrique)
- Elliptical
- Golf
- IceSkate (Patinage sur glace)
- InlineSkate (Roller)
- Kayaking
- NordicSki (Ski de fond)
- RockClimbing (Escalade)
- Rowing (Aviron)
- Snowboard
- Soccer (Football)
- Surfing
- VirtualRide (Vélo virtuel)
- VirtualRun (Course virtuelle)
- WeightTraining (Musculation)
- Yoga
- Et bien d'autres...

## 🔒 Sécurité

- Les tokens OAuth sont stockés de manière sécurisée dans la base de données
- Les refresh tokens permettent de renouveler automatiquement l'accès
- Chaque requête nécessite une authentification JWT + connexion Strava valide

## 📝 Notes

- **Rate Limiting**: L'API Strava a des limites de taux (600 requêtes/15 minutes, 30000/jour)
- **Polling**: Les triggers utilisent le polling (intervalle minimum: 1 minute recommandé: 5 minutes)
- **Webhooks**: Strava propose des webhooks mais nécessite une configuration serveur supplémentaire
- **Email**: Strava ne fournit pas toujours l'email de l'utilisateur via OAuth, un email générique est créé

## 🚀 Exemples d'automatisations

### Auto-commenter les runs > 10km
```json
{
  "trigger": {
    "type": "on_new_activity",
    "config": {
      "activityType": "Run",
      "pollingInterval": 300000
    }
  },
  "actions": [
    {
      "type": "create_comment",
      "config": {
        "activityId": "{{id}}",
        "text": "Awesome run! 🏃 Distance: {{distance}}m"
      },
      "condition": "{{distance}} > 10000"
    }
  ]
}
```

### Créer une activité depuis un autre service
```json
{
  "trigger": {
    "type": "webhook",
    "config": {
      "webhookId": "fitness-tracker"
    }
  },
  "actions": [
    {
      "type": "create_activity",
      "config": {
        "name": "{{workoutName}}",
        "type": "{{workoutType}}",
        "sport_type": "{{workoutType}}",
        "start_date_local": "{{startTime}}",
        "elapsed_time": "{{duration}}",
        "distance": "{{distance}}"
      }
    }
  ]
}
```
