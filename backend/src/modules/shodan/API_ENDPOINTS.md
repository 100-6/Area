# Shodan API Endpoints Reference

Ce document liste tous les endpoints de l'API Shodan utilisés par le module Mirror-Area.

Documentation officielle : https://developer.shodan.io/api

---

## 🔍 Search & Host Info

### Search Hosts
**Endpoint :** `GET /shodan/host/search`  
**Description :** Recherche des hosts avec des filtres  
**Paramètres :**
- `query` (string, required) - Requête de recherche
- `page` (number, optional) - Page de résultats (défaut: 1)
- `facets` (string, optional) - Facets pour analyses

**Exemple :**
```bash
curl "https://api.shodan.io/shodan/host/search?key=YOUR_KEY&query=apache+country:FR&page=1"
```

**Réponse :**
```json
{
  "matches": [
    {
      "ip_str": "51.158.123.45",
      "port": 80,
      "hostnames": ["web.example.fr"],
      "location": {
        "country_code": "FR",
        "city": "Paris"
      },
      "org": "OVH SAS",
      "product": "Apache",
      "version": "2.4.41"
    }
  ],
  "total": 1247
}
```

---

### Get Host Info
**Endpoint :** `GET /shodan/host/{ip}`  
**Description :** Informations détaillées d'une IP  
**Paramètres :**
- `history` (boolean, optional) - Inclure l'historique
- `minify` (boolean, optional) - Réponse minimale

**Exemple :**
```bash
curl "https://api.shodan.io/shodan/host/8.8.8.8?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "ip_str": "8.8.8.8",
  "ports": [53, 443],
  "hostnames": ["dns.google"],
  "domains": ["google.com"],
  "vulns": [],
  "country_code": "US",
  "city": "Mountain View",
  "org": "Google LLC",
  "isp": "Google LLC",
  "asn": "AS15169",
  "last_update": "2025-10-20T12:00:00.000Z",
  "data": [
    {
      "port": 53,
      "transport": "udp",
      "product": "Google DNS"
    }
  ]
}
```

---

## 🌐 DNS & Domain Info

### Get Domain Info
**Endpoint :** `GET /dns/domain/{domain}`  
**Description :** Informations sur un domaine  
**Paramètres :** Aucun

**Exemple :**
```bash
curl "https://api.shodan.io/dns/domain/example.com?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "domain": "example.com",
  "subdomains": [
    "www.example.com",
    "mail.example.com",
    "api.example.com"
  ],
  "tags": [],
  "data": [
    {
      "subdomain": "www",
      "type": "A",
      "value": "93.184.216.34"
    }
  ]
}
```

---

### DNS Resolve
**Endpoint :** `GET /dns/resolve`  
**Description :** Résoudre des hostnames en IPs  
**Paramètres :**
- `hostnames` (string, required) - Liste de hostnames séparés par virgules

**Exemple :**
```bash
curl "https://api.shodan.io/dns/resolve?hostnames=google.com,bing.com&key=YOUR_KEY"
```

**Réponse :**
```json
{
  "google.com": "142.250.185.46",
  "bing.com": "13.107.21.200"
}
```

---

### DNS Reverse
**Endpoint :** `GET /dns/reverse`  
**Description :** Résoudre des IPs en hostnames  
**Paramètres :**
- `ips` (string, required) - Liste d'IPs séparées par virgules

**Exemple :**
```bash
curl "https://api.shodan.io/dns/reverse?ips=8.8.8.8,1.1.1.1&key=YOUR_KEY"
```

**Réponse :**
```json
{
  "8.8.8.8": ["dns.google"],
  "1.1.1.1": ["one.one.one.one"]
}
```

---

## 💥 Exploits Database

### Search Exploits
**Endpoint :** `GET /api/search`  
**Description :** Recherche dans la base d'exploits  
**Paramètres :**
- `query` (string, required) - Requête de recherche (CVE, platform, etc.)
- `page` (number, optional) - Page de résultats
- `facets` (string, optional) - Facets pour analyses

**Exemple :**
```bash
curl "https://api.shodan.io/api/search?query=CVE-2021-44228&key=YOUR_KEY"
```

**Réponse :**
```json
{
  "matches": [
    {
      "_id": "EDB-ID-50592",
      "description": "Apache Log4j2 2.0-beta9 through 2.15.0 JNDI features...",
      "cve": ["CVE-2021-44228"],
      "platform": "multiple",
      "type": "remote",
      "author": "Khaled Nassar",
      "date": "2021-12-14",
      "source": "exploit-db"
    }
  ],
  "total": 47
}
```

---

## 🚨 Alerts

### Create Alert
**Endpoint :** `POST /shodan/alert`  
**Description :** Créer une alerte de surveillance réseau  
**Body :**
```json
{
  "name": "My Infrastructure",
  "filters": {
    "ip": ["192.168.1.0/24"]
  },
  "expires": 0
}
```

**Exemple :**
```bash
curl -X POST "https://api.shodan.io/shodan/alert?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Alert","filters":{"ip":["192.168.1.0/24"]},"expires":0}'
```

**Réponse :**
```json
{
  "id": "5f9e8f8f8f8f8f8f",
  "name": "My Infrastructure",
  "created": "2025-10-20T14:30:00.000Z",
  "expires": null,
  "expiration": 0,
  "filters": {
    "ip": ["192.168.1.0/24"]
  }
}
```

---

### List Alerts
**Endpoint :** `GET /shodan/alert/info`  
**Description :** Liste toutes les alertes de l'utilisateur  
**Paramètres :** Aucun

**Exemple :**
```bash
curl "https://api.shodan.io/shodan/alert/info?key=YOUR_KEY"
```

**Réponse :**
```json
[
  {
    "id": "5f9e8f8f8f8f8f8f",
    "name": "My Infrastructure",
    "created": "2025-10-20T14:30:00.000Z",
    "expires": null
  }
]
```

---

### Get Alert Info
**Endpoint :** `GET /shodan/alert/{id}/info`  
**Description :** Détails d'une alerte spécifique  
**Paramètres :** Aucun

**Exemple :**
```bash
curl "https://api.shodan.io/shodan/alert/5f9e8f8f8f8f8f8f/info?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "id": "5f9e8f8f8f8f8f8f",
  "name": "My Infrastructure",
  "created": "2025-10-20T14:30:00.000Z",
  "expires": null,
  "filters": {
    "ip": ["192.168.1.0/24"]
  }
}
```

---

### Delete Alert
**Endpoint :** `DELETE /shodan/alert/{id}`  
**Description :** Supprimer une alerte  
**Paramètres :** Aucun

**Exemple :**
```bash
curl -X DELETE "https://api.shodan.io/shodan/alert/5f9e8f8f8f8f8f8f?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "success": true
}
```

---

## 📊 Account & API Info

### Get API Info
**Endpoint :** `GET /api-info`  
**Description :** Informations sur l'API key (plan, quotas, etc.)  
**Paramètres :** Aucun

**Exemple :**
```bash
curl "https://api.shodan.io/api-info?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "scan_credits": 100,
  "usage_limits": {
    "scan_credits": 100,
    "query_credits": 100,
    "monitored_ips": 16
  },
  "plan": "edu",
  "https": true,
  "unlocked": true,
  "query_credits": 93
}
```

---

## 🔎 Scanning

### Scan IP
**Endpoint :** `POST /shodan/scan`  
**Description :** Lancer un scan d'une IP (consomme des crédits)  
**Body :**
```json
{
  "ips": "192.168.1.100"
}
```

**Exemple :**
```bash
curl -X POST "https://api.shodan.io/shodan/scan?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ips":"192.168.1.100"}'
```

**Réponse :**
```json
{
  "id": "SCAN123456",
  "count": 1
}
```

---

### Get Scan Status
**Endpoint :** `GET /shodan/scan/{id}`  
**Description :** Statut d'un scan en cours  
**Paramètres :** Aucun

**Exemple :**
```bash
curl "https://api.shodan.io/shodan/scan/SCAN123456?key=YOUR_KEY"
```

**Réponse :**
```json
{
  "id": "SCAN123456",
  "status": "DONE",
  "count": 1
}
```

---

## 🔒 Authentication

Tous les endpoints nécessitent l'API key en paramètre `key` :

```
?key=YOUR_API_KEY
```

**Obtenir une API key :** https://account.shodan.io

---

## ⚠️ Rate Limits

| Plan | Rate Limit |
|------|------------|
| Free | 1 req/sec |
| Membership | 10 req/sec |
| Corporate | 100 req/sec |

---

## 🚫 Error Codes

| Code | Signification | Action |
|------|---------------|--------|
| 400 | Bad Request | Vérifier les paramètres |
| 401 | Unauthorized | API key invalide |
| 402 | Payment Required | Quota dépassé ou membership requis |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource non trouvée |
| 429 | Too Many Requests | Rate limit dépassé, attendre |
| 500 | Internal Server Error | Erreur serveur Shodan |
| 503 | Service Unavailable | Service temporairement indisponible |

---

## 📚 Ressources

- **Documentation complète** : https://developer.shodan.io/api
- **Filtres de recherche** : https://www.shodan.io/search/filters
- **Changelog API** : https://developer.shodan.io/changelog
- **Status Page** : https://status.shodan.io
- **Support** : help@shodan.io

---

## 🧪 Testing

### Test API Key
```bash
curl "https://api.shodan.io/api-info?key=YOUR_KEY"
```

### Test Search
```bash
curl "https://api.shodan.io/shodan/host/search?key=YOUR_KEY&query=apache"
```

### Test Host Lookup
```bash
curl "https://api.shodan.io/shodan/host/8.8.8.8?key=YOUR_KEY"
```

---

*Dernière mise à jour : 20 octobre 2025*  
*API Version : v1*
