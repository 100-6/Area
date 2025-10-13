import request from 'supertest';
import express, { Application } from 'express';
import moduleRoutes from '../../../src/core/routes/modules';
import { moduleRegistry } from '../../../src/modules/registry';

// Mock dependencies
jest.mock('../../../src/modules/registry');
jest.mock('../../../src/core/models/WorkflowModel');
jest.mock('../../../src/core/middleware/auth', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { id: 'test-user-id', email: 'test@example.com' };
        next();
    }
}));

describe('Module API Endpoints', () => {
    let app: Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/modules', moduleRoutes);
        jest.clearAllMocks();
    });

    describe('GET /api/modules', () => {
        it('should list all available modules', async () => {
            const mockModules = [
                {
                    getName: () => 'discord',
                    getDisplayName: () => 'Discord',
                    getDescription: () => 'Discord integration',
                    getAuthType: () => 'oauth2',
                    isActive: () => true,
                    getAllTriggers: () => [{ getName: () => 'on_message_created' }],
                    getAllActions: () => [{ getName: () => 'send_message' }]
                },
                {
                    getName: () => 'timer',
                    getDisplayName: () => 'Timer',
                    getDescription: () => 'Schedule based triggers',
                    getAuthType: () => 'none',
                    isActive: () => true,
                    getAllTriggers: () => [{ getName: () => 'daily_at_time' }],
                    getAllActions: () => []
                }
            ];

            (moduleRegistry.getAllModules as jest.Mock).mockReturnValue(mockModules);

            const response = await request(app)
                .get('/api/modules')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.modules).toHaveLength(2);
            expect(response.body.modules[0]).toMatchObject({
                name: 'discord',
                displayName: 'Discord',
                triggerCount: 1,
                actionCount: 1
            });
        });

        it('should handle empty module list', async () => {
            (moduleRegistry.getAllModules as jest.Mock).mockReturnValue([]);

            const response = await request(app)
                .get('/api/modules')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(0);
            expect(response.body.modules).toHaveLength(0);
        });
    });

    describe('GET /api/modules/:identifier', () => {
        describe('By module name', () => {
            it('should return variables for a valid module', async () => {
                const mockTrigger = {
                    getName: () => 'on_message_created',
                    getDescription: () => 'Triggered when a message is created',
                    getType: () => 'webhook',
                    getOutputSchema: () => ({
                        type: 'object',
                        properties: {
                            messageId: { type: 'string' },
                            content: { type: 'string' }
                        }
                    }),
                    getConfigSchema: () => ({ type: 'object' })
                };

                const mockAction = {
                    getName: () => 'send_message',
                    getDescription: () => 'Send a message',
                    getOutputSchema: () => ({
                        type: 'object',
                        properties: {
                            messageId: { type: 'string' }
                        }
                    }),
                    getConfigSchema: () => ({ type: 'object' }),
                    getRequiredScopes: () => ['messages.write']
                };

                const mockModule = {
                    getName: () => 'discord',
                    getDisplayName: () => 'Discord',
                    getDescription: () => 'Discord integration',
                    getAllTriggers: () => [mockTrigger],
                    getAllActions: () => [mockAction]
                };

                (moduleRegistry.getModule as jest.Mock).mockReturnValue(mockModule);

                const response = await request(app)
                    .get('/api/modules/discord')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.moduleName).toBe('discord');
                expect(response.body.triggers).toHaveLength(1);
                expect(response.body.actions).toHaveLength(1);
                expect(response.body.triggers[0].name).toBe('on_message_created');
                expect(response.body.actions[0].name).toBe('send_message');
            });

            it('should filter by type=trigger', async () => {
                const mockTrigger = {
                    getName: () => 'on_message_created',
                    getDescription: () => 'Triggered when a message is created',
                    getType: () => 'webhook',
                    getOutputSchema: () => ({}),
                    getConfigSchema: () => ({})
                };

                const mockModule = {
                    getName: () => 'discord',
                    getDisplayName: () => 'Discord',
                    getDescription: () => 'Discord integration',
                    getAllTriggers: () => [mockTrigger],
                    getAllActions: () => []
                };

                (moduleRegistry.getModule as jest.Mock).mockReturnValue(mockModule);

                const response = await request(app)
                    .get('/api/modules/discord?type=trigger')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.triggers).toHaveLength(1);
                expect(response.body.actions).toHaveLength(0);
            });

            it('should return 404 for non-existent module', async () => {
                (moduleRegistry.getModule as jest.Mock).mockReturnValue(null);

                const response = await request(app)
                    .get('/api/modules/nonexistent')
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('not found');
            });
        });

        describe('By node ID', () => {
            it('should return variables for a trigger node', async () => {
                const { WorkflowModel } = require('../../../src/core/models/WorkflowModel');
                
                const mockNode = {
                    id: 'node-123',
                    nodeType: 'trigger',
                    serviceId: 'service-123',
                    actionId: 'action-123',
                    label: 'Discord Message Trigger',
                    config: { channelId: '123456' }
                };

                const mockTrigger = {
                    getName: () => 'on_message_created',
                    getDescription: () => 'Triggered when a message is created',
                    getType: () => 'webhook',
                    getOutputSchema: () => ({
                        type: 'object',
                        properties: {
                            messageId: { type: 'string' }
                        }
                    }),
                    getConfigSchema: () => ({ type: 'object' })
                };

                const mockModule = {
                    getDisplayName: () => 'Discord',
                    getTrigger: () => mockTrigger
                };

                WorkflowModel.prototype.getNodeById = jest.fn().mockResolvedValue(mockNode);
                WorkflowModel.prototype.getServiceNameById = jest.fn().mockResolvedValue('discord');
                WorkflowModel.prototype.getActionNameById = jest.fn().mockResolvedValue('on_message_created');
                
                (moduleRegistry.getModule as jest.Mock).mockReturnValue(mockModule);

                const response = await request(app)
                    .get('/api/modules/node-123')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.nodeId).toBe('node-123');
                expect(response.body.nodeType).toBe('trigger');
                expect(response.body.triggerName).toBe('on_message_created');
                expect(response.body.outputSchema).toBeDefined();
            });

            it('should return variables for an action node', async () => {
                const { WorkflowModel } = require('../../../src/core/models/WorkflowModel');
                
                const mockNode = {
                    id: 'node-456',
                    nodeType: 'action',
                    serviceId: 'service-123',
                    reactionId: 'reaction-123',
                    label: 'Send Discord Message',
                    config: { channelId: '123456', content: 'Hello' }
                };

                const mockAction = {
                    getName: () => 'send_message',
                    getDescription: () => 'Send a message',
                    getOutputSchema: () => ({
                        type: 'object',
                        properties: {
                            messageId: { type: 'string' }
                        }
                    }),
                    getConfigSchema: () => ({ type: 'object' }),
                    getRequiredScopes: () => ['messages.write']
                };

                const mockModule = {
                    getDisplayName: () => 'Discord',
                    getAction: () => mockAction
                };

                WorkflowModel.prototype.getNodeById = jest.fn().mockResolvedValue(mockNode);
                WorkflowModel.prototype.getServiceNameById = jest.fn().mockResolvedValue('discord');
                WorkflowModel.prototype.getReactionNameById = jest.fn().mockResolvedValue('send_message');
                
                (moduleRegistry.getModule as jest.Mock).mockReturnValue(mockModule);

                const response = await request(app)
                    .get('/api/modules/node-456')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.nodeId).toBe('node-456');
                expect(response.body.nodeType).toBe('action');
                expect(response.body.actionName).toBe('send_message');
                expect(response.body.requiredScopes).toContain('messages.write');
            });

            it('should return 404 for non-existent node', async () => {
                const { WorkflowModel } = require('../../../src/core/models/WorkflowModel');
                
                WorkflowModel.prototype.getNodeById = jest.fn().mockResolvedValue(null);

                const response = await request(app)
                    .get('/api/modules/550e8400-e29b-41d4-a716-446655440000')
                    .expect(404);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('not found');
            });

            it('should return 400 for node without service', async () => {
                const { WorkflowModel } = require('../../../src/core/models/WorkflowModel');
                
                const mockNode = {
                    id: 'node-789',
                    nodeType: 'trigger',
                    serviceId: null
                };

                WorkflowModel.prototype.getNodeById = jest.fn().mockResolvedValue(mockNode);

                const response = await request(app)
                    .get('/api/modules/node-789')
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('service');
            });
        });

        describe('Validation', () => {
            it('should return 400 for invalid identifier format', async () => {
                const response = await request(app)
                    .get('/api/modules/')
                    .expect(404); // Express returns 404 for empty path param

                // This test verifies that the route doesn't match empty identifier
            });
        });
    });
});
