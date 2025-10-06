# 🚀 Quick Start - AREA Mobile Feature

```
┌──────────────────────────────┐
│  My Applets         [Create] │
│                              │
│  ┌────────────────────────┐  │
│  │ 📱 Daily Reminder  [ON]│  │
│  │ Get notified...        │  │
│  │ ▶ 5 runs  ✓  2h ago   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 📱 Hourly Log     [OFF]│  │
│  │ Log every hour...      │  │
│  │ ▶ 12 runs ✓  1m ago   │  │
│  └────────────────────────┘  │
└──────────────────────────────┘

┌──────────────────────────────┐
│ ← Create Applet      [Save]  │
│                              │
│ Workflow                     │
│  ┌────────────────────────┐  │
│  │ ⚡ IF                 │  │
│  │ Timer: Every 5min     │  │
│  └────────────────────────┘  │
│            │                 │
│            ▼                 │
│  ┌────────────────────────┐  │
│  │ ✓ THEN                │  │
│  │ Console: Log          │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ + Add action          │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## 🆘 Besoin d'aide ?

1. Lire `mobile/lib/features/areas/README.md`
2. Voir les exemples dans `mobile/lib/features/areas/EXAMPLES.md`
3. Consulter `mobile/AREA_INTEGRATION.md` pour l'intégration complète

## ✅ Vérifier que tout fonctionne

```bash
# 1. Backend tourne
cd backend && npm run dev

# 2. Services disponibles
curl http://localhost:8080/about.json

# 3. App mobile compile
cd mobile && flutter analyze lib/features/areas/

# 4. Lancer l'app
flutter run
```

---