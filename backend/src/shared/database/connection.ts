import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import 'colors';

dotenv.config();

class Database {
    private static instance: Database;
    private pool: Pool;
    private isConnected: boolean = false;

    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.pool.on('connect', (client: PoolClient) => {
            this.isConnected = true;
        });
        this.pool.on('error', (err: Error) => {
            console.error('Unexpected error on idle client'.red, err);
            this.isConnected = false;
        });
    }

    public static getInstance(): Database {
        if (!Database.instance)
            Database.instance = new Database();
        return Database.instance;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async testConnection(): Promise<boolean> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('Database connection test failed:'.red, error);
            this.isConnected = false;
            return false;
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
        this.isConnected = false;
        console.log('Database connection closed'.yellow);
    }

    public isConnectionHealthy(): boolean {
        return this.isConnected;
    }

    /**
     * Execute a query with error handling
     */
    public async query(text: string, params?: any[]): Promise<any> {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:'.red, error);
            throw error;
        }
    }

    /**
     * Execute a transaction
     */
    public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export class DatabaseConnection {
    public static async getConnection(): Promise<Pool> {
        return Database.getInstance().getPool();
    }
}

export default Database;
