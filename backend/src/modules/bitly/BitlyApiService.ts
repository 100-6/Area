import 'colors';

export interface BitlyGroup {
    guid: string;
    name: string;
    references?: Record<string, string>;
    created?: string;
}

export interface BitlyBitlink {
    id: string; // Format: domain/hash (e.g., bit.ly/3abcXYZ)
    link: string;
    long_url: string;
    created_at: string;
    custom_bitlink?: string;
    title?: string;
    tags?: string[];
    references?: Record<string, string>;
    deep_links?: Array<{ guid: string; bitlink: string; app_uri_path: string }>;
}

export interface BitlyClickSummary {
    unit_reference?: string;
    total_clicks: number;
}

export interface CreateBitlinkPayload {
    long_url: string;
    domain?: string;
    group_guid?: string;
    title?: string;
    tags?: string[];
    deeplinks?: Array<{
        guid?: string;
        bitlink?: string;
        app_uri_path: string;
        install_url?: string;
        app_guid?: string;
    }>;
}

/**
 * Bitly API Service
 * Encapsulates HTTP requests to the Bitly REST API
 */
export class BitlyApiService {
    private readonly BASE_URL = 'https://api-ssl.bitly.com/v4';

    /**
     * Generic helper to perform Bitly authenticated requests
     */
    private async request<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        };

        if (init.body && !('Content-Type' in (init.headers || {}))) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${this.BASE_URL}${path}`, {
            ...init,
            headers: {
                ...headers,
                ...(init.headers as Record<string, string> | undefined)
            }
        });

        if (response.status === 204) {
            return null as unknown as T;
        }

        const text = await response.text();
        if (!response.ok) {
            console.error('[BitlyApiService] Request failed:'.red, response.status, response.statusText, text);
            throw new Error(`Bitly API error ${response.status}: ${response.statusText}`);
        }

        if (!text) {
            return null as unknown as T;
        }

        try {
            return JSON.parse(text) as T;
        } catch (error) {
            console.error('[BitlyApiService] Failed to parse JSON response:'.red, text);
            throw error;
        }
    }

    /**
     * Retrieve current Bitly user profile
     */
    async getCurrentUser(accessToken: string): Promise<any> {
        return this.request<any>(accessToken, '/user');
    }

    /**
     * Get Bitly groups accessible by the user
     */
    async getGroups(accessToken: string): Promise<BitlyGroup[]> {
        const response = await this.request<{ groups: BitlyGroup[] }>(accessToken, '/groups');
        return response.groups || [];
    }

    /**
     * Resolve default group GUID for a user
     */
    async getDefaultGroupGuid(accessToken: string): Promise<string | null> {
        const user = await this.getCurrentUser(accessToken);
        if (user?.default_group_guid) {
            return user.default_group_guid as string;
        }

        const groups = await this.getGroups(accessToken);
        return groups.length > 0 ? groups[0].guid : null;
    }

    /**
     * Retrieve bitlinks for a group, sorted by creation date desc
     */
    async getGroupBitlinks(accessToken: string, groupGuid: string, size: number = 50): Promise<BitlyBitlink[]> {
        const params = new URLSearchParams({
            size: String(size),
            sort: 'created_at',
            order: 'desc'
        });
        const response = await this.request<{ links: BitlyBitlink[] }>(accessToken, `/groups/${groupGuid}/bitlinks?${params.toString()}`);
        return response.links || [];
    }

    /**
     * Create a new bitlink
     */
    async createBitlink(accessToken: string, payload: CreateBitlinkPayload): Promise<BitlyBitlink> {
        return this.request<BitlyBitlink>(accessToken, '/bitlinks', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Retrieve a specific bitlink
     */
    async getBitlink(accessToken: string, bitlinkId: string): Promise<BitlyBitlink> {
        // bitlinkId must be URL encoded (e.g., bit.ly/abcd -> bit.ly%2Fabcd)
        const encoded = encodeURIComponent(bitlinkId);
        return this.request<BitlyBitlink>(accessToken, `/bitlinks/${encoded}`);
    }

    /**
     * Update a bitlink (e.g., title, long_url)
     */
    async updateBitlink(accessToken: string, bitlinkId: string, updates: Partial<CreateBitlinkPayload>): Promise<BitlyBitlink> {
        const encoded = encodeURIComponent(bitlinkId);
        return this.request<BitlyBitlink>(accessToken, `/bitlinks/${encoded}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    /**
     * Expand a bitlink to its long URL
     */
    async expandBitlink(accessToken: string, bitlinkId: string): Promise<{ long_url: string }> {
        return this.request<{ long_url: string }>(accessToken, '/expand', {
            method: 'POST',
            body: JSON.stringify({ bitlink_id: bitlinkId })
        });
    }

    /**
     * Retrieve click summary for a bitlink
     */
    async getBitlinkClickSummary(
        accessToken: string,
        bitlinkId: string,
        unit: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
        units: number = -1
    ): Promise<BitlyClickSummary> {
        const encoded = encodeURIComponent(bitlinkId);
        const params = new URLSearchParams({
            unit,
            units: String(units)
        });
        return this.request<BitlyClickSummary>(accessToken, `/bitlinks/${encoded}/clicks/summary?${params.toString()}`);
    }
}
