import { DatabaseConnection } from '../../shared/database/connection';

export interface UserSessionData {
    id: string;
    user_id: string;
    session_token: string; // stores the refresh token value
    device_info?: any;
    expires_at: Date;
    is_active: boolean;
    created_at: Date;
    last_used_at: Date;
}

export class UserSession {
    /**
     * Create a new session (stores refresh token)
     */
    static async create(userId: string, refreshToken: string, expiresAt: Date, deviceInfo: any = null): Promise<UserSessionData> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query(
            `INSERT INTO user_sessions (user_id, session_token, device_info, expires_at, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [userId, refreshToken, deviceInfo ? JSON.stringify(deviceInfo) : null, expiresAt]
        );
        return result.rows[0];
    }

    /**
     * Find active session by refresh token
     */
    static async findActiveByToken(refreshToken: string): Promise<UserSessionData | null> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query(
            `SELECT * FROM user_sessions WHERE session_token = $1 AND is_active = true`,
            [refreshToken]
        );
        const row = result.rows[0];
        if (!row)
            return null;
        // additional expiry guard (DB cleanup may lag)
        if (new Date(row.expires_at).getTime() < Date.now())
            return null;
        return row;
    }

    /**
     * Rotate (update) a session's refresh token & expiry
     */
    static async rotate(oldToken: string, newToken: string, newExpiry: Date): Promise<boolean> {
        const db = await DatabaseConnection.getConnection();
        const result = await db.query(
            `UPDATE user_sessions SET session_token = $2, expires_at = $3, last_used_at = CURRENT_TIMESTAMP
             WHERE session_token = $1 AND is_active = true`,
            [oldToken, newToken, newExpiry]
        );
        return result.rowCount === 1;
    }

    /**
     * Deactivate a session by its refresh token
     */
    static async deactivateByToken(refreshToken: string): Promise<void> {
        const db = await DatabaseConnection.getConnection();
        await db.query(
            `UPDATE user_sessions SET is_active = false, last_used_at = CURRENT_TIMESTAMP WHERE session_token = $1`,
            [refreshToken]
        );
    }

    /**
     * Deactivate all sessions for a user (optional helper)
     */
    static async deactivateAllForUser(userId: string): Promise<void> {
        const db = await DatabaseConnection.getConnection();
        await db.query(
            `UPDATE user_sessions SET is_active = false, last_used_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
            [userId]
        );
    }
}
