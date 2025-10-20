# Shodan Module

Module d'intégration avec **Shodan** pour Mirror-Area. Permet la surveillance réseau, la recherche de vulnérabilités et la collecte de threat intelligence.

## 🎯 Fonctionnalités

### Triggers (Déclencheurs)

#### 1. **Alert Trigger** (`alert_trigger`)
Surveille les alertes réseau Shodan et se déclenche quand une IP surveillée change.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `alertId` (string, required) : ID de l'alerte Shodan à surveiller
- `pollInterval` (number, optional) : Intervalle de vérification en secondes (défaut: 300s)

**Données émises :**
```typescript
{
    alertId: string,
    alertName: string,
    trigger: {
        ip: string,
        port: number,
        transport: string
    },
    ip: string,
    ports: number[],
    hostnames: string[],
    timestamp: string
}
```

**Exemple d'utilisation :**
- Détecter l'ouverture de nouveaux ports sur votre infrastructure
- Alerter sur des services vulnérables exposés
- Surveiller les changements de configuration réseau

#### 2. **Query Monitor** (`query_monitor`)
Surveille une requête de recherche Shodan et se déclenche quand de nouveaux hosts correspondent.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `query` (string, required) : Requête Shodan (ex: "apache country:FR")
- `pollInterval` (number, optional) : Intervalle de vérification en secondes (défaut: 3600s)
- `maxResults` (number, optional) : Nombre maximum de résultats à vérifier (défaut: 100)

**Données émises :**
```typescript
{
    query: string,
    newHosts: Array<{
        ip: string,
        port: number,
        hostnames: string[],
        location: {
            country: string,
            city: string
        },
        product: string,
        version: string
    }>,
    totalResults: number,
    newCount: number
}
```

**Exemple d'utilisation :**
- Surveiller l'apparition de bases MongoDB publiques
- Détecter les nouveaux serveurs Apache d'une région
- Traquer les panneaux de contrôle exposés (Grafana, Jenkins, etc.)

---

### Actions (Réactions)

#### 1. **Search Hosts** (`search_hosts`)
Recherche des hosts avec une requête Shodan.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `query` (string, required) : Requête de recherche (supporte `{{variables}}`)
- `maxResults` (number, optional) : Nombre max de résultats (défaut: 100)
- `page` (number, optional) : Page de pagination (défaut: 1)

**Données retournées :**
```typescript
{
    hosts: Array<{
        ip: string,
        port: number,
        hostnames: string[],
        location: { country, city, latitude, longitude },
        org: string,
        product: string,
        version: string
    }>,
    totalResults: number,
    resultsCount: number
}
```

**Variables disponibles :** `{{nodeId.hosts[0].ip}}`, `{{nodeId.totalResults}}`

#### 2. **Get Host Info** (`get_host_info`)
Récupère les informations détaillées d'une IP.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `ip` (string, required) : Adresse IP (supporte `{{trigger.ip}}`)
- `history` (boolean, optional) : Inclure l'historique (défaut: false)

**Données retournées :**
```typescript
{
    ip: string,
    ports: number[],
    hostnames: string[],
    vulns: string[], // Liste des CVE
    country: string,
    city: string,
    organization: string,
    isp: string,
    asn: string,
    lastUpdate: string,
    tags: string[],
    services: Array<{ port, transport, product, version }>
}
```

**Variables disponibles :** `{{nodeId.ip}}`, `{{nodeId.ports}}`, `{{nodeId.vulns}}`

#### 3. **Get Exploits** (`get_exploits`)
Recherche des exploits dans la base Shodan.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `query` (string, optional) : Requête de recherche
- `cve` (string, optional) : CVE spécifique (ex: "CVE-2024-1234", supporte `{{trigger.cve}}`)
- `platform` (string, optional) : Filtre par plateforme (windows, linux, etc.)
- `maxResults` (number, optional) : Nombre max de résultats (défaut: 50)

**Données retournées :**
```typescript
{
    exploits: Array<{
        id: string,
        title: string,
        description: string,
        cve: string[],
        platform: string,
        type: string,
        author: string,
        date: string,
        source: string
    }>,
    totalResults: number,
    hasExploits: boolean
}
```

**Variables disponibles :** `{{nodeId.exploits[0].cve}}`, `{{nodeId.hasExploits}}`

#### 4. **Get Domain Info** (`get_domain_info`)
Récupère les informations d'un domaine (subdomains, IPs).

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan
- `domain` (string, required) : Nom de domaine (supporte `{{trigger.domain}}`)

**Données retournées :**
```typescript
{
    domain: string,
    subdomains: string[],
    ips: string[],
    tags: string[],
    subdomainCount: number,
    ipCount: number
}
```

**Variables disponibles :** `{{nodeId.subdomains}}`, `{{nodeId.ips}}`

#### 5. **Create Alert** (`create_alert`)
Crée une alerte réseau sur Shodan pour surveiller des IPs.

**Configuration :**
- `apiKey` (string, required) : Votre clé API Shodan (nécessite membership)
- `name` (string, required) : Nom de l'alerte
- `ipRange` (string, required) : IP ou CIDR à surveiller (supporte `{{trigger.ip}}`)
- `expires` (number, optional) : Jours avant expiration (0 = jamais, défaut: 0)

**Données retournées :**
```typescript
{
    alertId: string,
    name: string,
    ipRange: string,
    created: string,
    expires: string | null
}
```

**Variables disponibles :** `{{nodeId.alertId}}`, `{{nodeId.name}}`

---

## 📋 Configuration Requise

### API Key Shodan

Vous devez obtenir une clé API Shodan depuis https://account.shodan.io

```typescript
apiKey: 'abcdef1234567890abcdef1234567890' // 32 caractères
```

### Plans Shodan

| Plan | Caractéristiques |
|------|------------------|
| **Free** | 100 requêtes/mois, recherche de base |
| **Membership** | Recherches illimitées, scanning, alertes |
| **Corporate** | Plus de quotas, support prioritaire |

---

## 🔥 Exemples de Workflows

### Workflow 1 : Surveillance d'Infrastructure
**Trigger :** Alert Trigger (nouveau port ouvert)  
**Actions :**
1. **Get Host Info** → Récupérer les détails complets de l'IP
2. **Get Exploits** → Chercher des vulnérabilités connues pour les services détectés
3. **Discord Webhook** → Alerter l'équipe de sécurité
4. **OpenAI Analyze** → Analyser la criticité

```yaml
Trigger: alert_trigger
  - apiKey: {{env.SHODAN_API_KEY}}
  - alertId: "5f9e8f8f8f8f8f8f"
  
Action 1: get_host_info
  - apiKey: {{env.SHODAN_API_KEY}}
  - ip: {{trigger.ip}}
  
Action 2: get_exploits
  - apiKey: {{env.SHODAN_API_KEY}}
  - query: "{{getHostInfo.services[0].product}}"
  
Action 3: send_discord_webhook
  - webhookUrl: {{env.DISCORD_WEBHOOK}}
  - content: "🚨 New port opened on {{trigger.ip}}: {{trigger.ports}}"
```

### Workflow 2 : Threat Intelligence Quotidienne
**Trigger :** Timer (tous les jours à 9h)  
**Actions :**
1. **Search Hosts** → Rechercher bases MongoDB publiques en France
2. **Condition** → Si plus de 100 résultats
3. **Email Alert** → Envoyer un rapport de sécurité

```yaml
Trigger: daily_at_time
  - time: "09:00"
  
Action 1: search_hosts
  - apiKey: {{env.SHODAN_API_KEY}}
  - query: "MongoDB country:FR"
  - maxResults: 100
  
Action 2: condition
  - if: {{searchHosts.totalResults}} > 100
  
Action 3: send_email
  - to: "security@example.com"
  - subject: "Daily Threat Report"
  - body: "Found {{searchHosts.totalResults}} exposed MongoDB instances"
```

### Workflow 3 : Bug Bounty Automation
**Trigger :** Query Monitor (nouveaux sous-domaines)  
**Actions :**
1. **Get Host Info** → Pour chaque nouveau host
2. **Get Exploits** → Vérifier les CVE connus
3. **Telegram Message** → Notifier les trouvailles

```yaml
Trigger: query_monitor
  - apiKey: {{env.SHODAN_API_KEY}}
  - query: "hostname:.target.com"
  - pollInterval: 3600
  
Action 1: get_host_info
  - apiKey: {{env.SHODAN_API_KEY}}
  - ip: {{trigger.newHosts[0].ip}}
  
Action 2: get_exploits
  - apiKey: {{env.SHODAN_API_KEY}}
  - cve: {{getHostInfo.vulns[0]}}
  
Action 3: send_telegram_message
  - chatId: {{env.TELEGRAM_CHAT_ID}}
  - message: "🎯 New host found: {{getHostInfo.ip}} with {{getHostInfo.vulns.length}} vulns"
```

---

## 🛠️ Templating de Variables

Le module Shodan supporte le templating de variables dans toutes les actions :

```typescript
// Utiliser les données du trigger
query: "port:{{trigger.port}}"
ip: "{{trigger.ip}}"

// Utiliser les données d'actions précédentes
query: "{{searchHosts.hosts[0].product}}"
cve: "{{getHostInfo.vulns[0]}}"
domain: "{{getDomainInfo.subdomains[2]}}"

// Accéder aux propriétés imbriquées
country: "{{trigger.newHosts[0].location.country}}"
```

---

## ⚠️ Limitations et Quotas

### Rate Limits
- **Free plan** : 1 requête/seconde
- **Membership** : 10 requêtes/seconde
- **Corporate** : 100 requêtes/seconde

### Erreurs Communes
- `SHODAN_INVALID_API_KEY` : Clé API invalide
- `SHODAN_QUOTA_EXCEEDED` : Quota mensuel dépassé (code 402)
- `SHODAN_RATE_LIMIT` : Trop de requêtes (code 429)
- `SHODAN_ACCESS_DENIED` : Fonctionnalité nécessitant membership (code 403)

### Bonnes Pratiques
- Utiliser des `pollInterval` élevés pour les triggers (> 300s)
- Limiter `maxResults` pour économiser les quotas
- Mettre en cache les résultats fréquents
- Utiliser les alertes Shodan pour les surveillances continues

---

## 📚 Ressources

- **API Documentation** : https://developer.shodan.io/api
- **Search Queries** : https://www.shodan.io/search/filters
- **Exploits Database** : https://exploits.shodan.io
- **Community Forum** : https://community.shodan.io

---

## 🔐 Sécurité

**⚠️ Ne jamais partager votre API key Shodan !**

Utilisez les variables d'environnement :
```bash
SHODAN_API_KEY=your_api_key_here
```

Dans les workflows, référencez-la avec : `{{env.SHODAN_API_KEY}}`

---

## 🧪 Tests

Pour tester votre clé API :
```bash
curl "https://api.shodan.io/api-info?key=YOUR_API_KEY"
```

Pour tester une recherche :
```bash
curl "https://api.shodan.io/shodan/host/search?key=YOUR_API_KEY&query=apache"
```

---

## 📝 Notes

- Les alertes nécessitent un plan **Membership** ou supérieur
- Le scanning d'IPs consomme des **scan credits**
- Les données historiques sont limitées aux plans payants
- Les exploits sont mis à jour quotidiennement
