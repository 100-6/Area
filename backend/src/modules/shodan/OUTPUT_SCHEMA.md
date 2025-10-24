# Shodan Module - Output Schemas

Ce document décrit les schémas de données (output schemas) pour tous les triggers et actions du module Shodan.

---

## 🎯 Triggers

### AlertTrigger (`alert_trigger`)

**Type de trigger :** Polling  
**Description :** Se déclenche quand une alerte réseau Shodan détecte un changement

```typescript
{
    alertId: string;          // ID de l'alerte Shodan
    alertName: string;        // Nom de l'alerte
    trigger: {
        ip: string;           // IP qui a déclenché l'alerte
        port: number;         // Port concerné
        transport: string;    // Protocole (tcp/udp)
    };
    ip: string;               // IP address (alias de trigger.ip)
    ports: number[];          // Liste des ports ouverts détectés
    hostnames: string[];      // Hostnames associés
    timestamp: string;        // ISO 8601 timestamp
}
```

**Variables disponibles :**
- `{{trigger.alertId}}` - ID de l'alerte
- `{{trigger.alertName}}` - Nom de l'alerte
- `{{trigger.ip}}` - IP qui a déclenché
- `{{trigger.trigger.port}}` - Port spécifique
- `{{trigger.ports}}` - Array de tous les ports
- `{{trigger.hostnames}}` - Array des hostnames
- `{{trigger.timestamp}}` - Date/heure de déclenchement

**Exemple de données :**
```json
{
    "alertId": "5f9e8f8f8f8f8f8f",
    "alertName": "My Infrastructure Alert",
    "trigger": {
        "ip": "192.168.1.100",
        "port": 22,
        "transport": "tcp"
    },
    "ip": "192.168.1.100",
    "ports": [22, 80, 443],
    "hostnames": ["server.example.com"],
    "timestamp": "2025-10-20T14:30:00.000Z"
}
```

---

### QueryMonitorTrigger (`query_monitor`)

**Type de trigger :** Polling  
**Description :** Se déclenche quand de nouveaux hosts correspondent à une requête

```typescript
{
    query: string;            // Requête de recherche originale
    newHosts: Array<{
        ip: string;           // Adresse IP
        port: number;         // Port ouvert
        hostnames: string[];  // Hostnames associés
        location: {
            country: string;  // Code pays (ex: "FR")
            city: string;     // Ville
        };
        product: string;      // Produit/service détecté
        version: string;      // Version du produit
        org: string;          // Organisation
        isp: string;          // Fournisseur Internet
    }>;
    totalResults: number;     // Nombre total de résultats actuels
    newCount: number;         // Nombre de nouveaux hosts trouvés
}
```

**Variables disponibles :**
- `{{trigger.query}}` - Requête de recherche
- `{{trigger.newHosts[0].ip}}` - Premier host trouvé
- `{{trigger.newHosts[0].port}}` - Port du premier host
- `{{trigger.newHosts[0].location.country}}` - Pays
- `{{trigger.newHosts[0].product}}` - Service détecté
- `{{trigger.totalResults}}` - Nombre total de résultats
- `{{trigger.newCount}}` - Nombre de nouveaux hosts

**Exemple de données :**
```json
{
    "query": "apache country:FR",
    "newHosts": [
        {
            "ip": "51.158.123.45",
            "port": 80,
            "hostnames": ["web.example.fr"],
            "location": {
                "country": "FR",
                "city": "Paris"
            },
            "product": "Apache",
            "version": "2.4.41",
            "org": "OVH SAS",
            "isp": "OVH SAS"
        }
    ],
    "totalResults": 1247,
    "newCount": 1
}
```

---

## ⚡ Actions

### SearchHosts (`search_hosts`)

**Description :** Recherche des hosts avec une requête Shodan

```typescript
{
    hosts: Array<{
        ip: string;           // Adresse IP
        port: number;         // Port ouvert
        hostnames: string[];  // Hostnames associés
        domains: string[];    // Domaines associés
        org: string;          // Organisation
        isp: string;          // Fournisseur Internet
        location: {
            country: string;  // Code/nom pays
            city: string;     // Ville
            latitude: number; // Latitude
            longitude: number; // Longitude
        };
        product: string;      // Produit/service
        version: string;      // Version
        transport: string;    // Protocole (tcp/udp)
        timestamp: string;    // Dernière mise à jour
    }>;
    totalResults: number;     // Nombre total de résultats disponibles
    resultsCount: number;     // Nombre de résultats retournés
}
```

**Variables disponibles :**
- `{{nodeId.hosts}}` - Array de tous les hosts
- `{{nodeId.hosts[0].ip}}` - IP du premier host
- `{{nodeId.hosts[0].port}}` - Port du premier host
- `{{nodeId.hosts[0].location.country}}` - Pays
- `{{nodeId.hosts[0].product}}` - Service/produit
- `{{nodeId.totalResults}}` - Total disponible
- `{{nodeId.resultsCount}}` - Nombre retourné

---

### GetHostInfo (`get_host_info`)

**Description :** Informations détaillées d'une IP

```typescript
{
    ip: string;               // Adresse IP
    ports: number[];          // Ports ouverts
    hostnames: string[];      // Hostnames associés
    domains: string[];        // Domaines associés
    vulns: string[];          // CVE IDs (ex: ["CVE-2024-1234"])
    country: string;          // Code pays
    city: string;             // Ville
    organization: string;     // Organisation
    isp: string;              // Fournisseur Internet
    asn: string;              // AS number
    lastUpdate: string;       // ISO 8601 timestamp
    tags: string[];           // Tags Shodan
    services: Array<{
        port: number;         // Port du service
        transport: string;    // tcp/udp
        product: string;      // Nom du produit
        version: string;      // Version
    }>;
}
```

**Variables disponibles :**
- `{{nodeId.ip}}` - Adresse IP
- `{{nodeId.ports}}` - Array des ports
- `{{nodeId.ports[0]}}` - Premier port
- `{{nodeId.vulns}}` - Array des CVE
- `{{nodeId.vulns[0]}}` - Premier CVE
- `{{nodeId.country}}` - Pays
- `{{nodeId.organization}}` - Organisation
- `{{nodeId.services[0].product}}` - Premier service

**Exemple de données :**
```json
{
    "ip": "8.8.8.8",
    "ports": [53, 443],
    "hostnames": ["dns.google"],
    "domains": ["google.com"],
    "vulns": [],
    "country": "US",
    "city": "Mountain View",
    "organization": "Google LLC",
    "isp": "Google LLC",
    "asn": "AS15169",
    "lastUpdate": "2025-10-20T12:00:00.000Z",
    "tags": ["cloud"],
    "services": [
        {
            "port": 53,
            "transport": "udp",
            "product": "Google DNS",
            "version": ""
        }
    ]
}
```

---

### GetExploits (`get_exploits`)

**Description :** Recherche d'exploits dans la base Shodan

```typescript
{
    exploits: Array<{
        id: string;           // ID unique de l'exploit
        title: string;        // Titre (100 premiers caractères)
        description: string;  // Description complète
        cve: string[];        // CVE IDs associés
        platform: string;     // Plateforme (windows, linux, etc.)
        type: string;         // Type d'exploit
        author: string;       // Auteur
        date: string;         // Date de publication
        source: string;       // Source (exploit-db, metasploit, etc.)
    }>;
    totalResults: number;     // Nombre total d'exploits trouvés
    hasExploits: boolean;     // true si des exploits ont été trouvés
    searchQuery: string;      // Requête de recherche utilisée
}
```

**Variables disponibles :**
- `{{nodeId.exploits}}` - Array de tous les exploits
- `{{nodeId.exploits[0].id}}` - ID du premier exploit
- `{{nodeId.exploits[0].cve}}` - CVE du premier exploit
- `{{nodeId.exploits[0].platform}}` - Plateforme
- `{{nodeId.totalResults}}` - Nombre total
- `{{nodeId.hasExploits}}` - Boolean

**Exemple de données :**
```json
{
    "exploits": [
        {
            "id": "EDB-ID-50123",
            "title": "Apache HTTP Server 2.4.49 - Path Traversal & Remote Code Execution",
            "description": "A flaw was found in a change made to path normalization...",
            "cve": ["CVE-2021-41773", "CVE-2021-42013"],
            "platform": "linux",
            "type": "remote",
            "author": "Ash Daulton",
            "date": "2021-10-07",
            "source": "exploit-db"
        }
    ],
    "totalResults": 1,
    "hasExploits": true,
    "searchQuery": "CVE-2021-41773"
}
```

---

### GetDomainInfo (`get_domain_info`)

**Description :** Informations sur un domaine

```typescript
{
    domain: string;           // Nom de domaine
    subdomains: string[];     // Liste des sous-domaines découverts
    ips: string[];            // Adresses IP associées
    tags: string[];           // Tags Shodan
    subdomainCount: number;   // Nombre de sous-domaines
    ipCount: number;          // Nombre d'IPs
}
```

**Variables disponibles :**
- `{{nodeId.domain}}` - Nom de domaine
- `{{nodeId.subdomains}}` - Array des sous-domaines
- `{{nodeId.subdomains[0]}}` - Premier sous-domaine
- `{{nodeId.ips}}` - Array des IPs
- `{{nodeId.ips[0]}}` - Première IP
- `{{nodeId.subdomainCount}}` - Nombre de sous-domaines

**Exemple de données :**
```json
{
    "domain": "example.com",
    "subdomains": [
        "www.example.com",
        "mail.example.com",
        "api.example.com"
    ],
    "ips": [
        "93.184.216.34",
        "93.184.216.35"
    ],
    "tags": [],
    "subdomainCount": 3,
    "ipCount": 2
}
```

---

### CreateAlert (`create_alert`)

**Description :** Crée une alerte de surveillance réseau

```typescript
{
    alertId: string;          // ID de l'alerte créée
    name: string;             // Nom de l'alerte
    ipRange: string;          // IP/CIDR surveillé
    created: string;          // ISO 8601 timestamp de création
    expires: string | null;   // ISO 8601 timestamp d'expiration (null si jamais)
}
```

**Variables disponibles :**
- `{{nodeId.alertId}}` - ID de l'alerte (pour AlertTrigger)
- `{{nodeId.name}}` - Nom de l'alerte
- `{{nodeId.ipRange}}` - Range surveillé
- `{{nodeId.created}}` - Date de création
- `{{nodeId.expires}}` - Date d'expiration

**Exemple de données :**
```json
{
    "alertId": "5f9e8f8f8f8f8f8f",
    "name": "My Infrastructure Alert",
    "ipRange": "192.168.1.0/24",
    "created": "2025-10-20T14:30:00.000Z",
    "expires": null
}
```

---

## 🔗 Chaînage d'Actions

### Exemple : Recherche → Détails → Exploits

```yaml
Action 1 (search_hosts):
  query: "apache country:US"
  
# Variables disponibles après Action 1:
# - {{search_hosts.hosts[0].ip}}
# - {{search_hosts.hosts[0].product}}

Action 2 (get_host_info):
  ip: "{{search_hosts.hosts[0].ip}}"
  
# Variables disponibles après Action 2:
# - {{get_host_info.vulns[0]}}
# - {{get_host_info.ports}}

Action 3 (get_exploits):
  cve: "{{get_host_info.vulns[0]}}"
  
# Variables disponibles après Action 3:
# - {{get_exploits.exploits[0].title}}
# - {{get_exploits.hasExploits}}
```

---

## 📊 Types de Données

### Strings
- Toutes les IPs, hostnames, CVE IDs, etc.
- Format ISO 8601 pour les timestamps

### Numbers
- Ports (0-65535)
- Counts (totalResults, subdomainCount, etc.)
- Coordinates (latitude, longitude)

### Arrays
- Toujours définis (jamais `undefined`)
- Peuvent être vides `[]`
- Indexés à partir de 0

### Booleans
- `hasExploits` - true si des exploits existent
- Flags de configuration

### Nulls
- `expires` peut être `null` (alerte sans expiration)
- Champs optionnels peuvent être absents

---

## 🎨 Formatage des Variables

### Accès aux tableaux
```typescript
{{nodeId.hosts[0].ip}}          // Premier élément
{{nodeId.hosts[1].port}}        // Deuxième élément
{{nodeId.exploits[0].cve[0]}}   // Premier CVE du premier exploit
```

### Accès aux objets imbriqués
```typescript
{{nodeId.hosts[0].location.country}}
{{trigger.trigger.port}}
{{nodeId.services[0].product}}
```

### Concaténation
```typescript
"Alert on {{trigger.ip}} port {{trigger.trigger.port}}"
"Found {{nodeId.totalResults}} results for {{trigger.query}}"
```

---

## ⚠️ Notes Importantes

1. **Tableaux vides** : Toujours vérifier avec des conditions avant d'accéder à `[0]`
2. **Vulnérabilités** : `vulns` peut être vide même si le host a des services
3. **Historique** : Données historiques limitées aux plans payants
4. **Timestamps** : Format ISO 8601 UTC (`2025-10-20T14:30:00.000Z`)
5. **Valeurs par défaut** : "Unknown" pour les champs manquants
