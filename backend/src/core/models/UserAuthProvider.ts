import { DatabaseConnection } from '../../shared/database/connection';

interface UserAuthProviderData {
    id: string;
    user_id: string;
    provider: string;
    provider_user_id: string;
    provider_email?: string;
    provider_username?: string;
    provider_data?: any;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: Date;
    is_primary: boolean;
    created_at: Date;
    updated_at: Date;
}

export class UserAuthProvider {
    /**
     * Find auth provider by provider and provider user ID
     */
    static async findByProviderAndId(provider: string, providerUserId: string): Promise<UserAuthProviderData | null> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query('SELECT * FROM user_auth_providers WHERE provider = $1 AND provider_user_id = $2', [provider, providerUserId]);

        return result.rows[0] || null;
    }

    /**
     * Create or update auth provider
     */
    static async createOrUpdate(authData: {
        user_id: string;
        provider: string;
        provider_user_id: string;
        provider_email?: string;
        provider_data?: any;
        access_token?: string;
        refresh_token?: string;
        is_primary?: boolean;
    }): Promise<UserAuthProviderData> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query(`
            INSERT INTO user_auth_providers 
            (user_id, provider, provider_user_id, provider_email, provider_data, access_token, refresh_token, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, provider) DO UPDATE SET
                provider_user_id = EXCLUDED.provider_user_id,
                provider_email = EXCLUDED.provider_email,
                provider_data = EXCLUDED.provider_data,
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
            `, [authData.user_id, authData.provider, authData.provider_user_id, authData.provider_email || null, JSON.stringify(authData.provider_data || {}), authData.access_token || null, authData.refresh_token || null, authData.is_primary || false]);

        return result.rows[0];
    }

    /**
     * Update tokens
     */
    static async updateTokens(userId: string, provider: string, accessToken: string, refreshToken?: string): Promise<void> {
        const db = await DatabaseConnection.getConnection();

        await db.query('UPDATE user_auth_providers SET access_token = $1, refresh_token = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND provider = $4',[accessToken, refreshToken || null, userId, provider]);
    }

    /**
     * Find auth provider by user ID and provider
     */
    static async findByUserAndProvider(userId: string, provider: string): Promise<UserAuthProviderData | null> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query('SELECT * FROM user_auth_providers WHERE user_id = $1 AND provider = $2', [userId, provider]);

        return result.rows[0] || null;
    }
}
