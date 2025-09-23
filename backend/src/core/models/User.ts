import Database from '../../shared/database/connection';

interface UserCreateData {
    email: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
    registration_method?: 'email' | 'oauth';
}

interface UserResult {
    id: string;
    email: string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email_verified: boolean;
    is_active: boolean;
    registration_method: string;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class User {
    private static db = Database.getInstance();

    /**
     * Find user by email
     */
    static async findByEmail(email: string): Promise<UserResult | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.db.getPool().query(query, [email]);

        return result.rows[0] || null;
    }

    /**
     * Find user by ID
     */
    static async findById(id: string): Promise<UserResult | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await this.db.getPool().query(query, [id]);

        return result.rows[0] || null;
    }

    /**
     * Create new user
     */
    static async create(userData: UserCreateData): Promise<UserResult> {
        const query = `
            INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                avatar_url, 
                email_verified, 
                registration_method
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`;
        const values = [userData.email, userData.password_hash || null, userData.first_name || '', userData.last_name || '', userData.avatar_url || '', userData.email_verified || false, userData.registration_method || 'email'];
        const result = await this.db.getPool().query(query, values);

        return result.rows[0];
    }

    /**
     * Update user information
     */
    static async update(id: string, updateData: Partial<UserCreateData>): Promise<UserResult | null> {
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramCounter = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            updateFields.push(`${key} = $${paramCounter}`);
            values.push(value);
            paramCounter++;
        });
        if (updateFields.length === 0)
            throw new Error('No fields to update');
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $${paramCounter} 
            RETURNING *`;
        values.push(id);
        const result = await this.db.getPool().query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId: string): Promise<void> {
        const query = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';

        await this.db.getPool().query(query, [userId]);
    }

    /**
     * Check if user exists by email
     */
    static async existsByEmail(email: string): Promise<boolean> {
        const query = 'SELECT id FROM users WHERE email = $1';
        const result = await this.db.getPool().query(query, [email]);

        return result.rows.length > 0;
    }

    /**
     * Delete user (soft delete by setting is_active to false)
     */
    static async softDelete(id: string): Promise<boolean> {
        const query = `
            UPDATE users 
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id`;
        const result = await this.db.getPool().query(query, [id]);

        return result.rows.length > 0;
    }

    /**
     * Hard delete user (permanently remove from database)
     */
    static async hardDelete(id: string): Promise<boolean> {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await this.db.getPool().query(query, [id]);
        return result.rows.length > 0;
    }

    /**
     * Get all active users (for admin purposes)
     */
    static async getAllActive(limit = 50, offset = 0): Promise<UserResult[]> {
        const query = `
            SELECT * FROM users 
            WHERE is_active = TRUE 
            ORDER BY created_at DESC 
            LIMIT $1 OFFSET $2`;
        const result = await this.db.getPool().query(query, [limit, offset]);

        return result.rows;
    }
}
