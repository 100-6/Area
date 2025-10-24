/**
 * Configuration du module Shodan
 * Fournit des actions et triggers pour la surveillance réseau et la recherche de vulnérabilités
 */
export default {
    name: 'shodan',
    displayName: 'Shodan',
    description: 'Network monitoring, vulnerability scanning, and threat intelligence using Shodan API',
    iconUrl: 'https://mastodon.shodan.io/system/accounts/avatars/109/581/487/842/048/355/original/ab8765da6373845d.png',
    color: '#c4c4c4',
    authType: 'none',
    isActive: true,

    actions: [
        {
            name: 'alert_trigger',
            displayName: 'Network Alert',
            description: 'Triggered when a Shodan network alert fires (monitors IP ranges for changes)',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'alertId'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key (get it from https://account.shodan.io)',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$',
                        example: 'abcdef1234567890abcdef1234567890'
                    },
                    alertId: {
                        type: 'string',
                        title: 'Alert ID',
                        description: 'Shodan alert ID to monitor',
                        example: '5f9e8f8f8f8f8f8f8f8f8f8f'
                    },
                    pollInterval: {
                        type: 'number',
                        title: 'Poll Interval (seconds)',
                        description: 'How often to check for alerts',
                        default: 300,
                        minimum: 60,
                        maximum: 3600
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    alertId: {
                        type: 'string',
                        description: 'Shodan alert identifier'
                    },
                    alertName: {
                        type: 'string',
                        description: 'Name of the alert'
                    },
                    trigger: {
                        type: 'object',
                        description: 'Alert trigger details',
                        properties: {
                            ip: {
                                type: 'string',
                                description: 'IP address that triggered'
                            },
                            port: {
                                type: 'number',
                                description: 'Port that triggered'
                            },
                            transport: {
                                type: 'string',
                                description: 'Transport protocol (tcp/udp)'
                            }
                        }
                    },
                    ip: {
                        type: 'string',
                        description: 'IP address that triggered the alert'
                    },
                    ports: {
                        type: 'array',
                        items: { type: 'number' },
                        description: 'Open ports detected'
                    },
                    hostnames: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Associated hostnames'
                    },
                    timestamp: {
                        type: 'string',
                        description: 'When the alert fired'
                    }
                }
            }
        },

        {
            name: 'query_monitor',
            displayName: 'Query Monitor',
            description: 'Monitor a Shodan search query for new results',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'query'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    query: {
                        type: 'string',
                        title: 'Search Query',
                        description: 'Shodan search query (e.g., "apache country:FR", "MongoDB")',
                        minLength: 1,
                        maxLength: 500,
                        example: 'apache country:US'
                    },
                    pollInterval: {
                        type: 'number',
                        title: 'Poll Interval (seconds)',
                        description: 'How often to check for new results',
                        default: 3600,
                        minimum: 300,
                        maximum: 86400
                    },
                    maxResults: {
                        type: 'number',
                        title: 'Max Results',
                        description: 'Maximum number of results to check',
                        default: 100,
                        minimum: 1,
                        maximum: 1000
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Original search query'
                    },
                    newHosts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ip: { type: 'string' },
                                port: { type: 'number' },
                                hostnames: { type: 'array', items: { type: 'string' } },
                                location: {
                                    type: 'object',
                                    properties: {
                                        country: { type: 'string' },
                                        city: { type: 'string' }
                                    }
                                }
                            }
                        },
                        description: 'Newly discovered hosts'
                    },
                    totalResults: {
                        type: 'number',
                        description: 'Current total matching hosts'
                    },
                    newCount: {
                        type: 'number',
                        description: 'Number of new hosts found'
                    }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'search_hosts',
            displayName: 'Search Hosts',
            description: 'Execute a Shodan search query to find hosts',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'query'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    query: {
                        type: 'string',
                        title: 'Search Query',
                        description: 'Shodan search query (supports variable templating)',
                        minLength: 1,
                        maxLength: 500,
                        example: 'apache country:{{trigger.country}}'
                    },
                    maxResults: {
                        type: 'number',
                        title: 'Max Results',
                        description: 'Maximum number of results to return',
                        default: 100,
                        minimum: 1,
                        maximum: 1000
                    },
                    page: {
                        type: 'number',
                        title: 'Page',
                        description: 'Page number for pagination',
                        default: 1,
                        minimum: 1,
                        maximum: 100
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    hosts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ip: { type: 'string' },
                                port: { type: 'number' },
                                hostnames: { type: 'array', items: { type: 'string' } },
                                domains: { type: 'array', items: { type: 'string' } },
                                org: { type: 'string' },
                                isp: { type: 'string' },
                                location: {
                                    type: 'object',
                                    properties: {
                                        country: { type: 'string' },
                                        city: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' }
                                    }
                                },
                                product: { type: 'string' },
                                version: { type: 'string' }
                            }
                        },
                        description: 'Matching hosts'
                    },
                    totalResults: {
                        type: 'number',
                        description: 'Total number of results available'
                    },
                    resultsCount: {
                        type: 'number',
                        description: 'Number of results returned'
                    }
                }
            }
        },

        {
            name: 'get_host_info',
            displayName: 'Get Host Info',
            description: 'Get detailed information about a specific IP address',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'ip'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    ip: {
                        type: 'string',
                        title: 'IP Address',
                        description: 'IP address to lookup (supports {{trigger.ip}})',
                        pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
                        example: '8.8.8.8'
                    },
                    history: {
                        type: 'boolean',
                        title: 'Include History',
                        description: 'Include historical data',
                        default: false
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    ip: {
                        type: 'string',
                        description: 'IP address'
                    },
                    ports: {
                        type: 'array',
                        items: { type: 'number' },
                        description: 'Open ports'
                    },
                    hostnames: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Associated hostnames'
                    },
                    domains: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Associated domains'
                    },
                    vulns: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Known vulnerabilities (CVE IDs)'
                    },
                    country: {
                        type: 'string',
                        description: 'Country code'
                    },
                    city: {
                        type: 'string',
                        description: 'City name'
                    },
                    organization: {
                        type: 'string',
                        description: 'Organization name'
                    },
                    isp: {
                        type: 'string',
                        description: 'ISP name'
                    },
                    asn: {
                        type: 'string',
                        description: 'AS number'
                    },
                    lastUpdate: {
                        type: 'string',
                        description: 'Last update timestamp'
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Shodan tags'
                    }
                }
            }
        },

        {
            name: 'get_exploits',
            displayName: 'Get Exploits',
            description: 'Search for exploits in Shodan exploits database',
            
            configSchema: {
                type: 'object',
                required: ['apiKey'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    query: {
                        type: 'string',
                        title: 'Search Query',
                        description: 'Search exploits database (CVE ID, platform, etc.)',
                        example: 'CVE-2024-1234'
                    },
                    cve: {
                        type: 'string',
                        title: 'CVE ID',
                        description: 'Specific CVE to search for (supports {{trigger.cve}})',
                        pattern: '^CVE-\\d{4}-\\d+$',
                        example: 'CVE-2024-1234'
                    },
                    platform: {
                        type: 'string',
                        title: 'Platform',
                        description: 'Filter by platform',
                        enum: ['windows', 'linux', 'unix', 'macos', 'android', 'ios', 'hardware'],
                        example: 'linux'
                    },
                    maxResults: {
                        type: 'number',
                        title: 'Max Results',
                        description: 'Maximum results to return',
                        default: 50,
                        minimum: 1,
                        maximum: 500
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    exploits: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                title: { type: 'string' },
                                description: { type: 'string' },
                                cve: { type: 'array', items: { type: 'string' } },
                                platform: { type: 'string' },
                                type: { type: 'string' },
                                author: { type: 'string' },
                                date: { type: 'string' },
                                source: { type: 'string' }
                            }
                        },
                        description: 'Matching exploits'
                    },
                    totalResults: {
                        type: 'number',
                        description: 'Total exploits found'
                    },
                    hasExploits: {
                        type: 'boolean',
                        description: 'Whether exploits were found'
                    }
                }
            }
        },

        {
            name: 'get_domain_info',
            displayName: 'Get Domain Info',
            description: 'Get information about a domain (subdomains, DNS records, IPs)',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'domain'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    domain: {
                        type: 'string',
                        title: 'Domain',
                        description: 'Domain name to lookup (supports {{trigger.domain}})',
                        example: 'example.com'
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Domain name'
                    },
                    subdomains: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Discovered subdomains'
                    },
                    ips: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Associated IP addresses'
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Shodan tags'
                    },
                    subdomainCount: {
                        type: 'number',
                        description: 'Number of subdomains found'
                    }
                }
            }
        },

        {
            name: 'create_alert',
            displayName: 'Create Alert',
            description: 'Create a network monitoring alert on Shodan',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'name', 'ipRange'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'Shodan API Key',
                        description: 'Your Shodan API key (requires membership)',
                        minLength: 32,
                        maxLength: 32,
                        pattern: '^[a-zA-Z0-9]{32}$'
                    },
                    name: {
                        type: 'string',
                        title: 'Alert Name',
                        description: 'Name for the alert',
                        minLength: 1,
                        maxLength: 100,
                        example: 'My Infrastructure Alert'
                    },
                    ipRange: {
                        type: 'string',
                        title: 'IP/CIDR Range',
                        description: 'IP address or CIDR range to monitor (supports {{trigger.ip}})',
                        example: '192.168.1.0/24'
                    },
                    expires: {
                        type: 'number',
                        title: 'Expires (days)',
                        description: 'Number of days until alert expires (0 = never)',
                        default: 0,
                        minimum: 0,
                        maximum: 365
                    }
                }
            },
            
            outputSchema: {
                type: 'object',
                properties: {
                    alertId: {
                        type: 'string',
                        description: 'Created alert ID'
                    },
                    name: {
                        type: 'string',
                        description: 'Alert name'
                    },
                    ipRange: {
                        type: 'string',
                        description: 'Monitored IP range'
                    },
                    created: {
                        type: 'string',
                        description: 'Creation timestamp'
                    },
                    expires: {
                        type: 'string',
                        description: 'Expiration date (null if never)'
                    }
                }
            }
        }
    ]
};
