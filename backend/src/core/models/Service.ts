import Database from '../../shared/database/connection';

export interface ServiceResult {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    icon_url?: string;
    base_url?: string;
    auth_type: 'oauth2' | 'api_key' | 'basic' | 'none' | 'bot_token';
    oauth_client_id?: string;
    oauth_client_secret?: string;
    oauth_scopes?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export class Service {
    private static db = Database.getInstance();

    /**
     * Get all services
     */
    static async findAll(includeInactive = false): Promise<ServiceResult[]> {
        let query = 'SELECT * FROM services';

        if (!includeInactive)
            query += ' WHERE is_active = TRUE';
        query += ' ORDER BY display_name ASC';
        const result = await this.db.getPool().query(query);
        return result.rows;
    }

    /**
     * Get all active services
     */
    static async findAllActive(): Promise<ServiceResult[]> {
        const query = 'SELECT * FROM services WHERE is_active = TRUE ORDER BY display_name ASC';
        const result = await this.db.getPool().query(query);
        return result.rows;
    }

    /**
     * Find service by ID
     */
    static async findById(id: string): Promise<ServiceResult | null> {
        const query = 'SELECT * FROM services WHERE id = $1';
        const result = await this.db.getPool().query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Find service by name
     */
    static async findByName(name: string): Promise<ServiceResult | null> {
        const query = 'SELECT * FROM services WHERE name = $1';
        const result = await this.db.getPool().query(query, [name]);
        return result.rows[0] || null;
    }
}
