import Database from '../../shared/database/connection';
import 'colors';

export interface AreaData {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    execution_count: number;
    last_triggered_at?: Date;
    last_execution_status?: 'success' | 'failed' | 'pending';
    created_at: Date;
    updated_at: Date;
}

export interface CreateAreaData {
    user_id: string;
    name: string;
    description?: string;
}

export class Area {
    private static db = Database.getInstance();

    static async create(data: CreateAreaData): Promise<AreaData> {
        try {
            const query = `
                INSERT INTO areas (user_id, name, description, is_active)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [data.user_id, data.name, data.description || '', true];
            const result = await this.db.query(query, values);

            console.log(`[Area] Created AREA "${data.name}" for user ${data.user_id}`.green);
            return this.parseAreaData(result.rows[0]);
        } catch (error) {
            console.error('[Area] Failed to create AREA:'.red, error);
            throw error;
        }
    }

    static async findById(id: string): Promise<AreaData | null> {
        try {
            const query = 'SELECT * FROM areas WHERE id = $1';
            const result = await this.db.query(query, [id]);

            if (result.rows.length === 0)
                return null;
            return this.parseAreaData(result.rows[0]);
        } catch (error) {
            console.error('[Area] Failed to find AREA by ID:'.red, error);
            throw error;
        }
    }

    static async findByUserId(userId: string): Promise<AreaData[]> {
        try {
            const query = `
                SELECT * FROM areas 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `;
            const result = await this.db.query(query, [userId]);

            return result.rows.map((row: any) => this.parseAreaData(row));
        } catch (error) {
            console.error('[Area] Failed to find AREAs by user ID:'.red, error);
            throw error;
        }
    }

    static async findAllActive(): Promise<AreaData[]> {
        try {
            const query = `
                SELECT * FROM areas 
                WHERE is_active = true 
                ORDER BY created_at DESC
            `;
            const result = await this.db.query(query);

            return result.rows.map((row: any) => this.parseAreaData(row));
        } catch (error) {
            console.error('[Area] Failed to find active AREAs:'.red, error);
            throw error;
        }
    }

    static async update(id: string, updates: Partial<CreateAreaData>): Promise<AreaData | null> {
        try {
            const updateFields: string[] = [];
            const values: any[] = [];
            let paramCounter = 1;

            if (updates.name) {
                updateFields.push(`name = $${paramCounter}`);
                values.push(updates.name);
                paramCounter++;
            }
            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramCounter}`);
                values.push(updates.description);
                paramCounter++;
            }
            if (updateFields.length === 0)
                throw new Error('No fields to update');
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const query = `
                UPDATE areas 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCounter}
                RETURNING *
            `;
            const result = await this.db.query(query, values);
            if (result.rows.length === 0)
                return null;
            console.log(`[Area] Updated AREA ${id}`.green);
            return this.parseAreaData(result.rows[0]);
        } catch (error) {
            console.error('[Area] Failed to update AREA:'.red, error);
            throw error;
        }
    }

    static async setActive(id: string, isActive: boolean): Promise<boolean> {
        try {
            const query = `
                UPDATE areas 
                SET is_active = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            const result = await this.db.query(query, [isActive, id]);

            console.log(`[Area] AREA ${id} ${isActive ? 'activated' : 'deactivated'}`.yellow);
            return result.rowCount === 1;
        } catch (error) {
            console.error('[Area] Failed to set active status:'.red, error);
            throw error;
        }
    }

    static async delete(id: string): Promise<boolean> {
        try {
            const query = 'DELETE FROM areas WHERE id = $1';
            const result = await this.db.query(query, [id]);

            console.log(`[Area] Deleted AREA ${id}`.yellow);
            return result.rowCount === 1;
        } catch (error) {
            console.error('[Area] Failed to delete AREA:'.red, error);
            throw error;
        }
    }

    static async incrementExecutionCount(id: string): Promise<void> {
        try {
            const query = `
                UPDATE areas 
                SET 
                    execution_count = execution_count + 1,
                    last_triggered_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `;
            await this.db.query(query, [id]);
        } catch (error) {
            console.error('[Area] Failed to increment execution count:'.red, error);
            throw error;
        }
    }

    static async updateExecutionStatus(id: string, status: 'success' | 'failed' | 'pending'): Promise<void> {
        try {
            const query = `
                UPDATE areas 
                SET 
                    last_execution_status = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            await this.db.query(query, [status, id]);
        } catch (error) {
            console.error('[Area] Failed to update execution status:'.red, error);
            throw error;
        }
    }

    private static parseAreaData(row: any): AreaData {
        return {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            description: row.description,
            is_active: row.is_active,
            execution_count: row.execution_count,
            last_triggered_at: row.last_triggered_at,
            last_execution_status: row.last_execution_status,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
}
