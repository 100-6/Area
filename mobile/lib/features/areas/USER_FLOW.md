# Flow utilisateur - AREA Feature

## Vue d'ensemble du parcours utilisateur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         USER JOURNEY - AREA                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                               ┌──────────────┐
                               │  App Launch  │
                               └──────┬───────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │  Main Screen    │
                            │  (Navigation)   │
                            └────────┬────────┘
                                     │
                            [Click "Applets"]
                                     │
                                     ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                      AREAS LIST SCREEN                                ║
╠═══════════════════════════════════════════════════════════════════════╣
║  My Applets                                             [Create] ─────┼───┐
║                                                                       ║   │
║  ┌────────────────────────────────────────────────────┐              ║   │
║  │ 📱 Daily Reminder              [ON/OFF Switch]     │              ║   │
║  │ Get notified every morning                         │              ║   │
║  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │              ║   │
║  │ ▶ 5 runs  ✓ success           2h ago              │              ║   │
║  └────────────────────────────────────────────────────┘              ║   │
║                                                                       ║   │
║  ┌────────────────────────────────────────────────────┐              ║   │
║  │ 📱 Hourly Log                 [ON/OFF Switch]      │              ║   │
║  │ Log message every hour                             │              ║   │
║  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │              ║   │
║  │ ▶ 12 runs  ✓ success          1m ago              │              ║   │
║  └────────────────────────────────────────────────────┘              ║   │
║                                                                       ║   │
║  [Pull to refresh]                                                   ║   │
╚═══════════════════════════════════════════════════════════════════════╝   │
         │                                                                  │
         │ [Click on AREA]                              [Click Create] ────┘
         │                                                       │
         ▼                                                       │
╔═══════════════════════════════════════════════════════════════════════╗   │
║                     AREA EDITOR SCREEN (Edit)                         ║   │
╠═══════════════════════════════════════════════════════════════════════╣   │
║  ← Edit Applet                                           [Save]       ║   │
║                                                                       ║   │
║  ┌────────────────────────────────────────────────────┐              ║   │
║  │ Applet Name                                        │              ║   │
║  │ ┌──────────────────────────────────────────────┐   │              ║   │
║  │ │ Daily Reminder                               │   │              ║   │
║  │ └──────────────────────────────────────────────┘   │              ║   │
║  └────────────────────────────────────────────────────┘              ║   │
║                                                                       ║   │
║  ┌────────────────────────────────────────────────────┐              ║   │
║  │ Description (optional)                             │              ║   │
║  │ ┌──────────────────────────────────────────────┐   │              ║   │
║  │ │ Get notified every morning                   │   │              ║   │
║  │ │                                              │   │              ║   │
║  │ └──────────────────────────────────────────────┘   │              ║   │
║  └────────────────────────────────────────────────────┘              ║   │
║                                                                       ║   │
║  Workflow                                                            ║   │
║  ┌────────────────────────────────────────────────────┐              ║   │
║  │ ⚡ IF                                       [>]    │ ◄────────────┼───┼─┐
║  │ Timer: Daily at 8:00 AM                           │              ║   │ │
║  └────────────────────────────────────────────────────┘              ║   │ │
║       │                                                              ║   │ │
║       │ (connector)                                                 ║   │ │
║       ▼                                                              ║   │ │
║  ┌────────────────────────────────────────────────────┐              ║   │ │
║  │ ✓ THEN                                     [X]     │              ║   │ │
║  │ Console: Log message                              │              ║   │ │
║  └────────────────────────────────────────────────────┘              ║   │ │
║                                                                       ║   │ │
║  ┌────────────────────────────────────────────────────┐              ║   │ │
║  │ + Add action                                       │ ◄────────────┼───┼─┤
║  └────────────────────────────────────────────────────┘              ║   │ │
╚═══════════════════════════════════════════════════════════════════════╝   │ │
                                                                            │ │
                                                                            │ │
╔═══════════════════════════════════════════════════════════════════════╗   │ │
║                   AREA EDITOR SCREEN (Create)                         ║ ◄─┘ │
╠═══════════════════════════════════════════════════════════════════════╣     │
║  ← Create Applet                                         [Save]       ║     │
║                                                                       ║     │
║  ┌────────────────────────────────────────────────────┐              ║     │
║  │ Applet Name                                        │              ║     │
║  │ ┌──────────────────────────────────────────────┐   │              ║     │
║  │ │ e.g., Send notification every morning        │   │              ║     │
║  │ └──────────────────────────────────────────────┘   │              ║     │
║  └────────────────────────────────────────────────────┘              ║     │
║                                                                       ║     │
║  Workflow                                                            ║     │
║  ┌────────────────────────────────────────────────────┐              ║     │
║  │ ⚡ IF                                       [>]    │ ─────────────┼─────┤
║  │ Choose a trigger                                  │              ║     │
║  └────────────────────────────────────────────────────┘              ║     │
║       │                                                              ║     │
║       ▼                                                              ║     │
║  ┌────────────────────────────────────────────────────┐              ║     │
║  │ + Add action                                       │ ─────────────┼─────┘
║  └────────────────────────────────────────────────────┘              ║
╚═══════════════════════════════════════════════════════════════════════╝
                          │                    │
        [Click IF/THEN]   │                    │ [Click Add action]
                          │                    │
                          └─────────┬──────────┘
                                    │
                                    ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                   SERVICE SELECTOR SCREEN                             ║
╠═══════════════════════════════════════════════════════════════════════╣
║  ← Choose a Trigger / Choose an Action                                ║
║                                                                       ║
║  🕐 TIMER                                                             ║
║  ┌────────────────────────────────────────────────────┐              ║
║  │ ⚡ Every X minutes                         [>]     │              ║
║  │ Trigger at regular intervals                      │              ║
║  └────────────────────────────────────────────────────┘              ║
║  ┌────────────────────────────────────────────────────┐              ║
║  │ ⚡ Daily at time                           [>]     │              ║
║  │ Trigger at a specific time every day             │              ║
║  └────────────────────────────────────────────────────┘              ║
║  ┌────────────────────────────────────────────────────┐              ║
║  │ ⚡ Every weekday                           [>]     │              ║
║  │ Trigger on weekdays only                          │              ║
║  └────────────────────────────────────────────────────┘              ║
║                                                                       ║
║  💻 CONSOLE                                                           ║
║  ┌────────────────────────────────────────────────────┐              ║
║  │ ✓ Log message                             [>]     │              ║
║  │ Print a message to console                        │              ║
║  └────────────────────────────────────────────────────┘              ║
╚═══════════════════════════════════════════════════════════════════════╝
                                    │
                      [Select service/action]
                                    │
                                    ▼
                      Return to AREA Editor with selection
```

## Actions utilisateur disponibles

### Sur AreasListScreen

| Action | Résultat |
|--------|----------|
| **Pull to refresh** | Recharge la liste des AREAs |
| **Click sur une AREA** | Ouvre l'éditeur pour cette AREA |
| **Toggle switch** | Active/désactive l'AREA |
| **Click FAB "Create"** | Ouvre l'éditeur en mode création |

### Sur AreaEditorScreen

| Action | Résultat |
|--------|----------|
| **Entrer un nom** | Définit le nom de l'AREA |
| **Entrer une description** | Ajoute une description (optionnel) |
| **Click sur IF card** | Ouvre le sélecteur de triggers |
| **Click sur THEN card** | Ouvre le sélecteur d'actions (si édition) |
| **Click sur "Add action"** | Ouvre le sélecteur pour ajouter une action |
| **Click sur [X] sur action** | Supprime cette action du workflow |
| **Click sur "Save"** | Sauvegarde l'AREA |
| **Click sur ←** | Retour sans sauvegarder |

### Sur ServiceSelectorScreen

| Action | Résultat |
|--------|----------|
| **Click sur un service/action** | Sélectionne et retourne à l'éditeur |
| **Click sur ←** | Retour sans sélection |
| **Scroll** | Parcourt la liste des services |

## États de l'application

### AreasListScreen

```
┌─────────────────┐
│   Loading...    │
│       ⏳        │
└─────────────────┘
        │
        ▼
┌─────────────────┐      ┌─────────────────┐
│  Empty State    │  OR  │   List Loaded   │
│  "No applets"   │      │   (with AREAs)  │
└─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │  Error State    │
                         │  "Error: ..."   │
                         └─────────────────┘
```

### AreaEditorScreen

```
┌──────────────────┐
│  Create Mode     │
│  (areaId = null) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│  Edit Mode       │  OR  │  Loading...      │
│  (areaId != null)│      │                  │
└──────────────────┘      └──────────────────┘
```

### ServiceSelectorScreen

```
┌─────────────────┐
│   Loading...    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐      ┌─────────────────┐
│  Services List  │  OR  │  Error State    │
└─────────────────┘      └─────────────────┘
```

## Validation et erreurs

### Validation lors de la création

1. **Nom requis** : L'utilisateur doit entrer un nom
   - ❌ Si vide → Snackbar "Please enter a name"
   - ✅ Si rempli → Création autorisée

2. **Description optionnelle** : Peut être vide

3. **Trigger optionnel** : Pour l'instant, pas de validation (TODO futur)

### Gestion des erreurs

| Type d'erreur | Comportement |
|--------------|--------------|
| **Erreur réseau** | Snackbar avec message d'erreur |
| **Token invalide** | Redirection vers login (à implémenter) |
| **AREA non trouvée** | Snackbar "Area not found" |
| **Serveur indisponible** | Écran d'erreur avec bouton "Retry" |

## Navigation flow simplifié

```
App Launch
    │
    ▼
Main Screen ──► AreasListScreen ──┬──► AreaEditorScreen (Create)
                      │            │           │
                      │            │           ▼
                      │            │    ServiceSelectorScreen
                      │            │           │
                      │            │           ▼
                      │            │    AreaEditorScreen (avec sélection)
                      │            │
                      └────────────┴──► AreaEditorScreen (Edit)
                                              │
                                              ▼
                                       ServiceSelectorScreen
                                              │
                                              ▼
                                       AreaEditorScreen (avec sélection)
```

## Temps de réponse estimés

| Action | Temps estimé |
|--------|-------------|
| Charger la liste des AREAs | 200-500ms |
| Créer une AREA | 300-800ms |
| Modifier une AREA | 300-800ms |
| Toggle AREA | 200-400ms |
| Charger les services | 100-300ms |
| Charger les workflow nodes | 200-500ms |

## Feedback utilisateur

### Visual feedback

- **Loading** : CircularProgressIndicator
- **Success** : Retour à la liste avec mise à jour
- **Error** : Snackbar rouge avec message
- **Empty** : Illustration + message "No applets yet"
- **Pull-to-refresh** : Indicateur natif Flutter

### Interactions

- **Tap** : Effet ripple sur les cards
- **Switch** : Animation de toggle
- **FAB** : Elevation et animation au tap
- **Navigation** : Transition slide native

## Accessibilité

- ✅ Tous les boutons ont des labels
- ✅ Contraste suffisant pour le texte
- ✅ Tailles tactiles ≥ 48x48dp
- ✅ Support du mode paysage
- 🔲 TODO: Support VoiceOver/TalkBack
- 🔲 TODO: Support texte large
