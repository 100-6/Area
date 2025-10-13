import Database from '../../shared/database/connection';
import 'colors';
import {WorkflowNode, WorkflowConnection, CreateWorkflowNodeDto, UpdateWorkflowNodeDto, CreateConnectionDto} from '../services/WorkflowService';

/**
 * Modèle WorkflowModel - Gestion des workflows en base de données
 * Responsable uniquement des interactions avec la base de données
 */
export class WorkflowModel {
    private static db = Database.getInstance();

    /**
     * Créer un nouveau nœud
     */
    async createNode(areaId: string, data: CreateWorkflowNodeDto): Promise<WorkflowNode> {
        try {
            const query = `
                INSERT INTO workflow_nodes 
                    (area_id, node_type, service_id, action_id, reaction_id, connection_id, config, position_x, position_y, label)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                areaId,
                data.nodeType,
                data.serviceId || null,
                data.actionId || null,
                data.reactionId || null,
                data.connectionId || null,
                JSON.stringify(data.config || {}),
                data.positionX,
                data.positionY,
                data.label || null
            ];
            const result = await WorkflowModel.db.query(query, values);
            
            console.log(`[WorkflowModel] Created node ${result.rows[0].id} for area ${areaId}`.green);
            return this.mapNodeFromDb(result.rows[0]);
        } catch (error) {
            console.error('[WorkflowModel] Failed to create node:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer un nœud par son ID
     */
    async getNodeById(nodeId: string): Promise<WorkflowNode | null> {
        try {
            const query = 'SELECT * FROM workflow_nodes WHERE id = $1';
            const result = await WorkflowModel.db.query(query, [nodeId]);
            
            if (result.rows.length === 0)
                return null;
            return this.mapNodeFromDb(result.rows[0]);
        } catch (error) {
            console.error('[WorkflowModel] Failed to get node by ID:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer tous les nœuds d'une AREA avec le nom du service
     */
    async getNodesByArea(areaId: string): Promise<(WorkflowNode & { serviceName?: string; actionName?: string; reactionName?: string })[]> {
        try {
            const query = `
                SELECT wn.*, s.name AS service_name,
                       sa.name AS action_name,
                       sr.name AS reaction_name
                FROM workflow_nodes wn
                LEFT JOIN services s ON wn.service_id = s.id
                LEFT JOIN service_actions sa ON wn.action_id = sa.id
                LEFT JOIN service_reactions sr ON wn.reaction_id = sr.id
                WHERE wn.area_id = $1
                ORDER BY wn.created_at ASC
            `;
            const result = await WorkflowModel.db.query(query, [areaId]);

            return result.rows.map((row: any) => ({
                ...this.mapNodeFromDb(row),
                serviceName: row.service_name || undefined,
                actionName: row.action_name || undefined,
                reactionName: row.reaction_name || undefined
            }));
        } catch (error) {
            console.error('[WorkflowModel] Failed to get nodes by area:'.red, error);
            throw error;
        }
    }

    /**
     * Résoudre un service par nom ou UUID
     */
    async resolveServiceId(nameOrUuid: string): Promise<string> {
        try {
            if (this.isUUID(nameOrUuid))
                return nameOrUuid;
            const query = 'SELECT id FROM services WHERE name = $1';
            const result = await WorkflowModel.db.query(query, [nameOrUuid]);
            if (result.rows.length === 0)
                throw new Error(`Service "${nameOrUuid}" not found`);
            return result.rows[0].id;
        } catch (error) {
            console.error('[WorkflowModel] Failed to resolve service ID:'.red, error);
            throw error;
        }
    }

    /**
     * Résoudre une action par nom ou UUID
     */
    async resolveActionId(serviceId: string, nameOrUuid: string): Promise<string> {
        try {
            if (this.isUUID(nameOrUuid))
                return nameOrUuid;
            const query = 'SELECT id FROM service_actions WHERE service_id = $1 AND name = $2';
            const result = await WorkflowModel.db.query(query, [serviceId, nameOrUuid]);
            if (result.rows.length === 0)
                throw new Error(`Action "${nameOrUuid}" not found for this service`);
            return result.rows[0].id;
        } catch (error) {
            console.error('[WorkflowModel] Failed to resolve action ID:'.red, error);
            throw error;
        }
    }

    /**
     * Résoudre une réaction par nom ou UUID
     */
    async resolveReactionId(serviceId: string, nameOrUuid: string): Promise<string> {
        try {
            if (this.isUUID(nameOrUuid))
                return nameOrUuid;
            const query = 'SELECT id FROM service_reactions WHERE service_id = $1 AND name = $2';
            const result = await WorkflowModel.db.query(query, [serviceId, nameOrUuid]);
            if (result.rows.length === 0)
                throw new Error(`Reaction "${nameOrUuid}" not found for this service`);
            return result.rows[0].id;
        } catch (error) {
            console.error('[WorkflowModel] Failed to resolve reaction ID:'.red, error);
            throw error;
        }
    }

    /**
     * Vérifier si une string est un UUID
     */
    private isUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    /**
     * Récupérer le nom d'un service par son UUID
     */
    async getServiceNameById(serviceId: string): Promise<string> {
        try {
            const query = 'SELECT name FROM services WHERE id = $1';
            const result = await WorkflowModel.db.query(query, [serviceId]);
            
            if (result.rows.length === 0)
                throw new Error(`Service with ID "${serviceId}" not found in database`);
            return result.rows[0].name;
        } catch (error) {
            console.error('[WorkflowModel] Failed to get service name:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer le nom d'une action par son UUID
     */
    async getActionNameById(actionId: string): Promise<string> {
        try {
            const query = 'SELECT name FROM service_actions WHERE id = $1';
            const result = await WorkflowModel.db.query(query, [actionId]);
            
            if (result.rows.length === 0)
                throw new Error(`Action with ID "${actionId}" not found in database`);
            return result.rows[0].name;
        } catch (error) {
            console.error('[WorkflowModel] Failed to get action name:'.red, error);
            throw error;
        }
    }

    /**
     * Mettre à jour un nœud
     */
    async updateNode(nodeId: string, data: UpdateWorkflowNodeDto): Promise<WorkflowNode> {
        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.serviceId !== undefined) {
                updates.push(`service_id = $${paramIndex++}`);
                values.push(data.serviceId);
            }
            if (data.actionId !== undefined) {
                updates.push(`action_id = $${paramIndex++}`);
                values.push(data.actionId);
            }
            if (data.config !== undefined) {
                updates.push(`config = $${paramIndex++}`);
                values.push(JSON.stringify(data.config));
            }
            if (data.positionX !== undefined) {
                updates.push(`position_x = $${paramIndex++}`);
                values.push(data.positionX);
            }
            if (data.positionY !== undefined) {
                updates.push(`position_y = $${paramIndex++}`);
                values.push(data.positionY);
            }
            if (data.label !== undefined) {
                updates.push(`label = $${paramIndex++}`);
                values.push(data.label);
            }
            if (updates.length === 0)
                throw new Error('No fields to update');
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(nodeId);
            const query = `
                UPDATE workflow_nodes
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;
            const result = await WorkflowModel.db.query(query, values);
            console.log(`[WorkflowModel] Updated node ${nodeId}`.green);
            return this.mapNodeFromDb(result.rows[0]);
        } catch (error) {
            console.error('[WorkflowModel] Failed to update node:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer le nom d'une réaction par son UUID
     */
    async getReactionNameById(reactionId: string): Promise<string> {
        try {
            const query = 'SELECT name FROM service_reactions WHERE id = $1';
            const result = await WorkflowModel.db.query(query, [reactionId]);
            
            if (result.rows.length === 0)
                throw new Error(`Reaction with ID "${reactionId}" not found in database`);
            return result.rows[0].name;
        } catch (error) {
            console.error('[WorkflowModel] Failed to get reaction name:'.red, error);
            throw error;
        }
    }

    /**
     * Supprimer un nœud
     */
    async deleteNode(nodeId: string): Promise<void> {
        try {
            const query = 'DELETE FROM workflow_nodes WHERE id = $1';
            await WorkflowModel.db.query(query, [nodeId]);
            
            console.log(`[WorkflowModel] Deleted node ${nodeId}`.yellow);
        } catch (error) {
            console.error('[WorkflowModel] Failed to delete node:'.red, error);
            throw error;
        }
    }

    /**
     * Créer une connexion entre deux nœuds
     */
    async createConnection(areaId: string, data: CreateConnectionDto): Promise<WorkflowConnection> {
        try {
            const query = `
                INSERT INTO workflow_connections 
                    (area_id, source_node_id, target_node_id, condition)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [
                areaId,
                data.sourceNodeId,
                data.targetNodeId,
                data.condition ? JSON.stringify(data.condition) : null
            ];

            const result = await WorkflowModel.db.query(query, values);
            console.log(`[WorkflowModel] Created connection ${result.rows[0].id}`.green);
            return this.mapConnectionFromDb(result.rows[0]);
        } catch (error) {
            console.error('[WorkflowModel] Failed to create connection:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer une connexion par son ID
     */
    async getConnectionById(connectionId: string): Promise<WorkflowConnection | null> {
        try {
            const query = 'SELECT * FROM workflow_connections WHERE id = $1';
            const result = await WorkflowModel.db.query(query, [connectionId]);
            
            if (result.rows.length === 0)
                return null;
            return this.mapConnectionFromDb(result.rows[0]);
        } catch (error) {
            console.error('[WorkflowModel] Failed to get connection by ID:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer toutes les connexions d'une AREA
     */
    async getConnectionsByArea(areaId: string): Promise<WorkflowConnection[]> {
        try {
            const query = 'SELECT * FROM workflow_connections WHERE area_id = $1';
            const result = await WorkflowModel.db.query(query, [areaId]);
            
            return result.rows.map((row: any) => this.mapConnectionFromDb(row));
        } catch (error) {
            console.error('[WorkflowModel] Failed to get connections by area:'.red, error);
            throw error;
        }
    }

    /**
     * Supprimer une connexion
     */
    async deleteConnection(connectionId: string): Promise<void> {
        try {
            const query = 'DELETE FROM workflow_connections WHERE id = $1';
            await WorkflowModel.db.query(query, [connectionId]);
            
            console.log(`[WorkflowModel] Deleted connection ${connectionId}`.yellow);
        } catch (error) {
            console.error('[WorkflowModel] Failed to delete connection:'.red, error);
            throw error;
        }
    }

    /**
     * Mapper un nœud depuis la BDD
     */
    private mapNodeFromDb(row: any): WorkflowNode {
        return {
            id: row.id,
            areaId: row.area_id,
            nodeType: row.node_type,
            serviceId: row.service_id,
            actionId: row.action_id,
            reactionId: row.reaction_id,
            connectionId: row.connection_id,
            config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
            positionX: row.position_x,
            positionY: row.position_y,
            label: row.label,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    /**
     * Mapper une connexion depuis la BDD
     */
    private mapConnectionFromDb(row: any): WorkflowConnection {
        return {
            id: row.id,
            areaId: row.area_id,
            sourceNodeId: row.source_node_id,
            targetNodeId: row.target_node_id,
            condition: row.condition 
                ? (typeof row.condition === 'string' ? JSON.parse(row.condition) : row.condition)
                : undefined,
            createdAt: row.created_at
        };
    }
}
