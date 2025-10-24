import 'colors';

/**
 * Base URL de l'API Shodan
 */
const SHODAN_API_BASE = 'https://api.shodan.io';

/**
 * Interface pour les résultats de recherche Shodan
 */
export interface ShodanSearchResult {
    matches: Array<{
        ip_str: string;
        port: number;
        hostnames?: string[];
        domains?: string[];
        org?: string;
        isp?: string;
        location?: {
            country_name?: string;
            country_code?: string;
            city?: string;
            latitude?: number;
            longitude?: number;
        };
        data?: string;
        product?: string;
        version?: string;
        transport?: string;
        timestamp?: string;
    }>;
    total: number;
}

/**
 * Interface pour les informations d'un host
 */
export interface ShodanHostInfo {
    ip_str: string;
    ports: number[];
    hostnames?: string[];
    domains?: string[];
    vulns?: string[];
    country_name?: string;
    country_code?: string;
    city?: string;
    org?: string;
    isp?: string;
    asn?: string;
    last_update?: string;
    tags?: string[];
    data?: Array<{
        port: number;
        transport: string;
        product?: string;
        version?: string;
        data?: string;
    }>;
}

/**
 * Interface pour les informations de domaine
 */
export interface ShodanDomainInfo {
    domain: string;
    subdomains?: string[];
    data?: Array<{
        subdomain: string;
        type: string;
        value: string;
    }>;
    tags?: string[];
}

/**
 * Interface pour les alertes Shodan
 */
export interface ShodanAlert {
    id: string;
    name: string;
    filters?: {
        ip?: string[];
    };
    created?: string;
    expires?: string | null;
    expiration?: number;
}

/**
 * Interface pour les exploits Shodan
 */
export interface ShodanExploit {
    _id: string;
    description: string;
    cve?: string[];
    bid?: string[];
    osvdb?: string[];
    msb?: string[];
    platform?: string;
    type?: string;
    author?: string;
    date?: string;
    source?: string;
}

/**
 * Service wrapper pour l'API REST Shodan
 * Documentation: https://developer.shodan.io/api
 */
export class ShodanApiService {
    private apiKey: string;

    constructor(apiKey: string) {
        if (!apiKey || apiKey.length !== 32) {
            throw new Error('Invalid Shodan API key format');
        }
        this.apiKey = apiKey;
    }

    /**
     * Effectuer une requête GET à l'API Shodan
     * @param endpoint - Endpoint de l'API (sans le base URL)
     * @param params - Paramètres de requête additionnels
     * @returns Réponse JSON de l'API
     */
    private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const url = new URL(`${SHODAN_API_BASE}${endpoint}`);
        
        // Ajouter l'API key
        url.searchParams.append('key', this.apiKey);
        
        // Ajouter les autres paramètres
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        try {
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Shodan API error (${response.status}): ${errorText}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            console.error(`[Shodan API] Request failed: ${endpoint}`.red, error.message);
            throw error;
        }
    }

    /**
     * Effectuer une requête POST à l'API Shodan
     * @param endpoint - Endpoint de l'API
     * @param body - Corps de la requête
     * @returns Réponse JSON de l'API
     */
    private async makePostRequest<T>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
        const url = `${SHODAN_API_BASE}${endpoint}?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Shodan API error (${response.status}): ${errorText}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            console.error(`[Shodan API] POST request failed: ${endpoint}`.red, error.message);
            throw error;
        }
    }

    /**
     * Effectuer une requête DELETE à l'API Shodan
     * @param endpoint - Endpoint de l'API
     * @returns Réponse JSON de l'API
     */
    private async makeDeleteRequest<T>(endpoint: string): Promise<T> {
        const url = `${SHODAN_API_BASE}${endpoint}?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Shodan API error (${response.status}): ${errorText}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            console.error(`[Shodan API] DELETE request failed: ${endpoint}`.red, error.message);
            throw error;
        }
    }

    /**
     * Rechercher des hosts avec une requête Shodan
     * GET /shodan/host/search
     * @param query - Requête de recherche Shodan
     * @param options - Options de recherche (page, facets, etc.)
     * @returns Résultats de la recherche
     */
    async searchHosts(
        query: string, 
        options: { page?: number; facets?: string } = {}
    ): Promise<ShodanSearchResult> {
        try {
            console.log(`[Shodan] Searching hosts: ${query}`.cyan);
            const result = await this.makeRequest<ShodanSearchResult>('/shodan/host/search', {
                query,
                page: options.page,
                facets: options.facets
            });
            console.log(`[Shodan] Found ${result.total} total results`.green);
            return result;
        } catch (error: any) {
            console.error(`[Shodan] Search failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Obtenir les informations détaillées d'un host
     * GET /shodan/host/{ip}
     * @param ip - Adresse IP à rechercher
     * @param options - Options (history, minify)
     * @returns Informations du host
     */
    async getHostInfo(ip: string, options: { history?: boolean; minify?: boolean } = {}): Promise<ShodanHostInfo> {
        try {
            console.log(`[Shodan] Getting host info: ${ip}`.cyan);
            const result = await this.makeRequest<ShodanHostInfo>(`/shodan/host/${ip}`, {
                history: options.history,
                minify: options.minify
            });
            console.log(`[Shodan] Host info retrieved for ${ip}`.green);
            return result;
        } catch (error: any) {
            console.error(`[Shodan] Get host info failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Obtenir les informations d'un domaine
     * GET /dns/domain/{domain}
     * @param domain - Nom de domaine
     * @returns Informations du domaine (subdomains, DNS, etc.)
     */
    async getDomainInfo(domain: string): Promise<ShodanDomainInfo> {
        try {
            console.log(`[Shodan] Getting domain info: ${domain}`.cyan);
            const result = await this.makeRequest<any>(`/dns/domain/${domain}`);
            
            console.log(`[Shodan] Domain info retrieved for ${domain}`.green);
            return {
                domain,
                subdomains: result.subdomains || [],
                data: result.data || [],
                tags: result.tags || []
            } as ShodanDomainInfo;
        } catch (error: any) {
            console.error(`[Shodan] Get domain info failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Rechercher des exploits
     * GET /api/search
     * @param query - Requête de recherche (CVE, platform, etc.)
     * @param options - Options de recherche
     * @returns Liste d'exploits
     */
    async searchExploits(query: string, options: { page?: number; facets?: string } = {}): Promise<{
        matches: ShodanExploit[];
        total: number;
    }> {
        try {
            console.log(`[Shodan] Searching exploits: ${query}`.cyan);
            const result = await this.makeRequest<any>('/api/search', {
                query,
                page: options.page,
                facets: options.facets
            });
            console.log(`[Shodan] Found ${result.total || 0} exploits`.green);
            return {
                matches: (result.matches || []) as ShodanExploit[],
                total: result.total || 0
            };
        } catch (error: any) {
            console.error(`[Shodan] Exploit search failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Créer une alerte réseau
     * POST /shodan/alert
     * @param name - Nom de l'alerte
     * @param ip - IP ou CIDR à surveiller
     * @param expires - Nombre de jours avant expiration (0 = jamais)
     * @returns Alerte créée
     */
    async createAlert(name: string, ip: string, expires: number = 0): Promise<ShodanAlert> {
        try {
            console.log(`[Shodan] Creating alert: ${name} for ${ip}`.cyan);
            const result = await this.makePostRequest<ShodanAlert>('/shodan/alert', {
                name,
                filters: { ip: [ip] },
                expires: expires || 0
            });
            console.log(`[Shodan] Alert created with ID: ${result.id}`.green);
            return result;
        } catch (error: any) {
            console.error(`[Shodan] Create alert failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Lister toutes les alertes
     * GET /shodan/alert/info
     * @returns Liste des alertes
     */
    async listAlerts(): Promise<ShodanAlert[]> {
        try {
            console.log(`[Shodan] Listing alerts`.cyan);
            const result = await this.makeRequest<any>('/shodan/alert/info');
            const alerts = Array.isArray(result) ? result : [];
            console.log(`[Shodan] Found ${alerts.length} alerts`.green);
            return alerts as ShodanAlert[];
        } catch (error: any) {
            console.error(`[Shodan] List alerts failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Obtenir les informations d'une alerte spécifique
     * GET /shodan/alert/{id}/info
     * @param alertId - ID de l'alerte
     * @returns Informations de l'alerte
     */
    async getAlert(alertId: string): Promise<ShodanAlert> {
        try {
            console.log(`[Shodan] Getting alert: ${alertId}`.cyan);
            const result = await this.makeRequest<ShodanAlert>(`/shodan/alert/${alertId}/info`);
            console.log(`[Shodan] Alert info retrieved`.green);
            return result;
        } catch (error: any) {
            console.error(`[Shodan] Get alert failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Supprimer une alerte
     * DELETE /shodan/alert/{id}
     * @param alertId - ID de l'alerte à supprimer
     * @returns Succès de la suppression
     */
    async deleteAlert(alertId: string): Promise<boolean> {
        try {
            console.log(`[Shodan] Deleting alert: ${alertId}`.cyan);
            await this.makeDeleteRequest<any>(`/shodan/alert/${alertId}`);
            console.log(`[Shodan] Alert deleted successfully`.green);
            return true;
        } catch (error: any) {
            console.error(`[Shodan] Delete alert failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Obtenir les informations sur l'API key (quota, plan, etc.)
     * GET /api-info
     * @returns Informations de l'API key
     */
    async getApiInfo(): Promise<{
        plan: string;
        scan_credits: number;
        usage_limits: {
            scan_credits: number;
            query_credits: number;
            monitored_ips: number;
        };
    }> {
        try {
            console.log(`[Shodan] Getting API info`.cyan);
            const result = await this.makeRequest<any>('/api-info');
            console.log(`[Shodan] API info retrieved - Plan: ${result.plan}`.green);
            return result as any;
        } catch (error: any) {
            console.error(`[Shodan] Get API info failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Scanner une IP (requiert des crédits)
     * POST /shodan/scan
     * @param ip - IP à scanner
     * @returns ID du scan
     */
    async scanIP(ip: string): Promise<{ id: string }> {
        try {
            console.log(`[Shodan] Scanning IP: ${ip}`.cyan);
            const result = await this.makePostRequest<{ id: string }>('/shodan/scan', {
                ips: ip
            });
            console.log(`[Shodan] Scan initiated with ID: ${result.id}`.green);
            return result;
        } catch (error: any) {
            console.error(`[Shodan] Scan IP failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Obtenir le statut d'un scan
     * GET /shodan/scan/{id}
     * @param scanId - ID du scan
     * @returns Statut du scan
     */
    async getScanStatus(scanId: string): Promise<{
        id: string;
        status: string;
        count: number;
    }> {
        try {
            console.log(`[Shodan] Getting scan status: ${scanId}`.cyan);
            const result = await this.makeRequest<any>(`/shodan/scan/${scanId}`);
            console.log(`[Shodan] Scan status: ${result.status}`.green);
            return result as any;
        } catch (error: any) {
            console.error(`[Shodan] Get scan status failed:`.red, error.message);
            throw this.handleError(error);
        }
    }

    /**
     * Gérer les erreurs de l'API Shodan
     * @param error - Erreur originale
     * @returns Erreur formatée
     */
    private handleError(error: any): Error {
        if (error.message?.includes('Invalid API key')) {
            return new Error('SHODAN_INVALID_API_KEY');
        }
        if (error.message?.includes('402')) {
            return new Error('SHODAN_QUOTA_EXCEEDED');
        }
        if (error.message?.includes('403')) {
            return new Error('SHODAN_ACCESS_DENIED');
        }
        if (error.message?.includes('404')) {
            return new Error('SHODAN_NOT_FOUND');
        }
        if (error.message?.includes('429')) {
            return new Error('SHODAN_RATE_LIMIT');
        }
        return new Error(`SHODAN_ERROR: ${error.message || 'Unknown error'}`);
    }

    /**
     * Valider une API key Shodan
     * @param apiKey - API key à valider
     * @returns true si la clé est valide
     */
    static async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const service = new ShodanApiService(apiKey);
            await service.getApiInfo();
            return true;
        } catch (error) {
            return false;
        }
    }
}
