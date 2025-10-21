# Module Shodan - Quick Start Guide

## 🚀 Démarrage Rapide

### 1. Obtenir une API Key Shodan

1. Créez un compte sur https://account.shodan.io
2. Copiez votre API key (32 caractères)
3. Ajoutez-la dans vos variables d'environnement :

```bash
echo "SHODAN_API_KEY=your_api_key_here" >> backend/.env
```

### 2. Tester votre API Key

```bash
curl "https://api.shodan.io/api-info?key=YOUR_API_KEY"
```

Vous devriez voir vos informations de plan et quotas.

---

## 📋 Exemples Simples

### Exemple 1 : Rechercher des serveurs Apache en France

**Workflow :**
- **Trigger :** Timer (tous les jours)
- **Action :** Search Hosts

```json
{
  "trigger": {
    "type": "daily_at_time",
    "config": {
      "time": "09:00"
    }
  },
  "actions": [
    {
      "type": "search_hosts",
      "config": {
        "apiKey": "{{env.SHODAN_API_KEY}}",
        "query": "apache country:FR",
        "maxResults": 50
      }
    },
    {
      "type": "console_log",
      "config": {
        "message": "Found {{searchHosts.totalResults}} Apache servers in France"
      }
    }
  ]
}
```

### Exemple 2 : Surveiller une IP pour détecter de nouveaux ports

**Workflow :**
- **Trigger :** Timer (toutes les heures)
- **Actions :** Get Host Info → Discord Alert

```json
{
  "trigger": {
    "type": "timer_interval",
    "config": {
      "interval": 3600
    }
  },
  "actions": [
    {
      "type": "get_host_info",
      "config": {
        "apiKey": "{{env.SHODAN_API_KEY}}",
        "ip": "192.168.1.100"
      }
    },
    {
      "type": "send_discord_webhook",
      "config": {
        "webhookUrl": "{{env.DISCORD_WEBHOOK}}",
        "content": "IP {{getHostInfo.ip}} has {{getHostInfo.ports.length}} open ports: {{getHostInfo.ports}}"
      }
    }
  ]
}
```

### Exemple 3 : Créer une alerte et la surveiller

**Workflow 1 - Créer l'alerte :**
```json
{
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "type": "create_alert",
      "config": {
        "apiKey": "{{env.SHODAN_API_KEY}}",
        "name": "My Infrastructure",
        "ipRange": "192.168.1.0/24",
        "expires": 0
      }
    },
    {
      "type": "console_log",
      "config": {
        "message": "Alert created with ID: {{createAlert.alertId}}"
      }
    }
  ]
}
```

**Workflow 2 - Surveiller l'alerte :**
```json
{
  "trigger": {
    "type": "alert_trigger",
    "config": {
      "apiKey": "{{env.SHODAN_API_KEY}}",
      "alertId": "YOUR_ALERT_ID",
      "pollInterval": 300
    }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "admin@example.com",
        "subject": "Shodan Alert: {{trigger.alertName}}",
        "body": "New port detected on {{trigger.ip}}: {{trigger.trigger.port}}"
      }
    }
  ]
}
```

### Exemple 4 : Bug Bounty - Surveiller les nouveaux sous-domaines

**Workflow :**
- **Trigger :** Query Monitor
- **Actions :** Get Host Info → Check Vulns → Telegram Alert

```json
{
  "trigger": {
    "type": "query_monitor",
    "config": {
      "apiKey": "{{env.SHODAN_API_KEY}}",
      "query": "hostname:.target.com",
      "pollInterval": 3600,
      "maxResults": 100
    }
  },
  "actions": [
    {
      "type": "get_host_info",
      "config": {
        "apiKey": "{{env.SHODAN_API_KEY}}",
        "ip": "{{trigger.newHosts[0].ip}}"
      }
    },
    {
      "type": "condition",
      "config": {
        "condition": "{{getHostInfo.vulns.length}} > 0"
      }
    },
    {
      "type": "send_telegram_message",
      "config": {
        "chatId": "{{env.TELEGRAM_CHAT_ID}}",
        "message": "🎯 New vulnerable host found!\nIP: {{getHostInfo.ip}}\nVulns: {{getHostInfo.vulns}}\nPorts: {{getHostInfo.ports}}"
      }
    }
  ]
}
```

### Exemple 5 : Rechercher des exploits pour un CVE

**Workflow :**
```json
{
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "type": "get_exploits",
      "config": {
        "apiKey": "{{env.SHODAN_API_KEY}}",
        "cve": "CVE-2021-44228",
        "maxResults": 10
      }
    },
    {
      "type": "condition",
      "config": {
        "condition": "{{getExploits.hasExploits}} == true"
      }
    },
    {
      "type": "console_log",
      "config": {
        "message": "Found {{getExploits.totalResults}} exploits for Log4Shell"
      }
    }
  ]
}
```

---

## 🎯 Cas d'Usage Avancés

### Threat Intelligence Automation

Combinez plusieurs recherches pour créer un rapport de sécurité quotidien :

1. **Recherche de bases de données exposées** (MongoDB, Redis, Elasticsearch)
2. **Recherche de panneaux admin** (phpMyAdmin, Grafana, Jenkins)
3. **Recherche de services vulnérables** (avec CVE connus)
4. **Agrégation et rapport** via Email ou Discord

### Security Monitoring

Surveillez votre infrastructure en temps réel :

1. **Créer des alertes** pour vos ranges IP
2. **AlertTrigger** se déclenche sur changement
3. **Get Host Info** pour les détails
4. **Get Exploits** pour vérifier les CVE
5. **Notification** immédiate via Telegram/Discord

### Bug Bounty Recon

Automatisez votre reconnaissance :

1. **Query Monitor** sur les domaines cibles
2. **Get Domain Info** pour les sous-domaines
3. **Get Host Info** pour chaque nouveau host
4. **Get Exploits** pour les vulnérabilités connues
5. **Prioritize and notify** les trouvailles intéressantes

---

## 📊 Variables Utiles

### Depuis les Triggers

```typescript
// Alert Trigger
{{trigger.ip}}
{{trigger.ports}}
{{trigger.alertName}}

// Query Monitor
{{trigger.newHosts[0].ip}}
{{trigger.newHosts[0].product}}
{{trigger.query}}
```

### Depuis les Actions

```typescript
// Search Hosts
{{searchHosts.hosts[0].ip}}
{{searchHosts.totalResults}}

// Get Host Info
{{getHostInfo.ip}}
{{getHostInfo.vulns}}
{{getHostInfo.ports}}

// Get Exploits
{{getExploits.exploits[0].cve}}
{{getExploits.hasExploits}}

// Get Domain Info
{{getDomainInfo.subdomains}}
{{getDomainInfo.ips}}

// Create Alert
{{createAlert.alertId}}
```

---

## ⚠️ Conseils Importants

### 1. Gérer les Quotas

- **Free Plan** : 100 requêtes/mois → Utilisez des `pollInterval` longs (3600s+)
- **Membership** : Illimité → Vous pouvez être plus agressif (300s+)

### 2. Rate Limiting

- Ne lancez pas trop de workflows en parallèle
- Espacez vos requêtes de quelques secondes
- Utilisez des conditions pour éviter les requêtes inutiles

### 3. Sécurité de l'API Key

```bash
# ❌ Mauvais : API key en dur
"apiKey": "abcdef1234567890abcdef1234567890"

# ✅ Bon : Variable d'environnement
"apiKey": "{{env.SHODAN_API_KEY}}"
```

### 4. Gestion des Erreurs

Les erreurs communes et comment les gérer :

- `SHODAN_QUOTA_EXCEEDED` → Attendez le mois prochain ou upgradez
- `SHODAN_RATE_LIMIT` → Augmentez les `pollInterval`
- `SHODAN_ACCESS_DENIED` → Fonctionnalité nécessitant membership
- `SHODAN_NOT_FOUND` → IP/Host pas dans Shodan

### 5. Optimisation

```typescript
// ❌ Trop de résultats (coûteux)
"maxResults": 1000

// ✅ Juste ce qu'il faut
"maxResults": 50

// ❌ Polling trop fréquent (quota)
"pollInterval": 60

// ✅ Polling raisonnable
"pollInterval": 3600
```

---

## 🔗 Ressources

- **Documentation complète** : `README.md`
- **Schémas de données** : `OUTPUT_SCHEMA.md`
- **API Shodan** : https://developer.shodan.io/api
- **Filtres de recherche** : https://www.shodan.io/search/filters

---

## 🐛 Debugging

### Tester une recherche manuellement

```bash
curl "https://api.shodan.io/shodan/host/search?key=YOUR_KEY&query=apache"
```

### Tester les infos d'un host

```bash
curl "https://api.shodan.io/shodan/host/8.8.8.8?key=YOUR_KEY"
```

### Vérifier vos quotas

```bash
curl "https://api.shodan.io/api-info?key=YOUR_KEY"
```

### Logs du module

Les logs Shodan sont préfixés avec `[Shodan]` :

```
[Shodan] Searching hosts: apache country:FR
[Shodan] Found 1247 total results
[Shodan] ✓ Module initialized successfully
```

---

## 🎓 Next Steps

1. **Lisez le README.md** pour comprendre toutes les fonctionnalités
2. **Consultez OUTPUT_SCHEMA.md** pour le templating avancé
3. **Testez les exemples** ci-dessus
4. **Créez vos propres workflows** adaptés à vos besoins
5. **Partagez vos use cases** avec la communauté !

---

Bon hunting! 🎯
