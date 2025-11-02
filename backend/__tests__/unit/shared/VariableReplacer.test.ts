import { VariableReplacer } from '../../../src/shared/utils/VariableReplacer';
import { ActionContext } from '../../../src/modules/_base/BaseAction';

describe('VariableReplacer', () => {
    describe('replace', () => {
        it('should replace simple variables from triggerData', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    username: 'John',
                    message: 'Hello World'
                }
            };

            const result = VariableReplacer.replace('User {{username}} said: {{message}}', context);
            expect(result).toBe('User John said: Hello World');
        });

        it('should replace nested variables from triggerData (Discord example)', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    message: {
                        id: '123456789',
                        content: 'Hello from Discord!',
                        channelId: '987654321',
                        channelName: 'general'
                    },
                    author: {
                        id: '111222333',
                        username: 'DiscordUser',
                        tag: 'DiscordUser#1234'
                    }
                }
            };

            const result = VariableReplacer.replace(
                'New message from {{author.username}} in #{{message.channelName}}: {{message.content}}',
                context
            );
            expect(result).toBe('New message from DiscordUser in #general: Hello from Discord!');
        });

        it('should replace variables from previousOutputs', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {},
                previousOutputs: {
                    'node-1': {
                        result: {
                            messageId: 'msg-123',
                            content: 'Previous message'
                        }
                    }
                }
            };

            const result = VariableReplacer.replace(
                'Replying to message {{result.messageId}}: {{result.content}}',
                context
            );
            expect(result).toBe('Replying to message msg-123: Previous message');
        });

        it('should handle missing variables gracefully', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    username: 'John'
                }
            };

            const result = VariableReplacer.replace('Hello {{username}}, {{missing.variable}}', context);
            expect(result).toBe('Hello John, {{missing.variable}}');
        });

        it('should handle deeply nested variables', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    data: {
                        user: {
                            profile: {
                                name: 'Alice',
                                settings: {
                                    theme: 'dark'
                                }
                            }
                        }
                    }
                }
            };

            const result = VariableReplacer.replace(
                '{{data.user.profile.name}} uses {{data.user.profile.settings.theme}} theme',
                context
            );
            expect(result).toBe('Alice uses dark theme');
        });

        it('should handle null and undefined values', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    value: null,
                    nested: {
                        value: undefined
                    }
                }
            };

            const result = VariableReplacer.replace('Value: {{value}}, Nested: {{nested.value}}', context);
            expect(result).toBe('Value: {{value}}, Nested: {{nested.value}}');
        });

        it('should handle arrays of objects by using JSON.stringify', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    results: [
                        { id: '1', name: 'Song 1', artistName: 'Artist 1' },
                        { id: '2', name: 'Song 2', artistName: 'Artist 2' }
                    ]
                }
            };

            const result = VariableReplacer.replace('Results: {{results}}', context);
            // Should be JSON stringified, not "[object Object], [object Object]"
            expect(result).toBe('Results: [{"id":"1","name":"Song 1","artistName":"Artist 1"},{"id":"2","name":"Song 2","artistName":"Artist 2"}]');
            expect(result).not.toContain('[object Object]');
        });

        it('should handle arrays of primitives with join', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    tags: ['tag1', 'tag2', 'tag3'],
                    numbers: [1, 2, 3]
                }
            };

            const result = VariableReplacer.replace('Tags: {{tags}}, Numbers: {{numbers}}', context);
            // Primitive arrays should still use join
            expect(result).toBe('Tags: tag1, tag2, tag3, Numbers: 1, 2, 3');
        });
    });

    describe('replaceInObject', () => {
        it('should replace variables in object properties', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    name: 'Alice',
                    email: 'alice@example.com'
                }
            };

            const config = {
                to: '{{email}}',
                subject: 'Hello {{name}}',
                body: 'Dear {{name}}, welcome!'
            };

            const result = VariableReplacer.replaceInObject(config, context);
            expect(result).toEqual({
                to: 'alice@example.com',
                subject: 'Hello Alice',
                body: 'Dear Alice, welcome!'
            });
        });

        it('should handle nested objects', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    user: 'Bob',
                    value: '100'
                }
            };

            const config = {
                nested: {
                    field: 'User: {{user}}',
                    another: {
                        deep: 'Value: {{value}}'
                    }
                }
            };

            const result = VariableReplacer.replaceInObject(config, context);
            expect(result).toEqual({
                nested: {
                    field: 'User: Bob',
                    another: {
                        deep: 'Value: 100'
                    }
                }
            });
        });
    });

    describe('extractVariables', () => {
        it('should extract all variable references', () => {
            const text = 'Hello {{username}}, your message is {{message.content}} in {{channel.name}}';
            const variables = VariableReplacer.extractVariables(text);
            expect(variables).toEqual(['username', 'message.content', 'channel.name']);
        });

        it('should return empty array for text without variables', () => {
            const variables = VariableReplacer.extractVariables('No variables here');
            expect(variables).toEqual([]);
        });
    });

    describe('hasVariables', () => {
        it('should detect variable patterns', () => {
            expect(VariableReplacer.hasVariables('Hello {{name}}')).toBe(true);
            expect(VariableReplacer.hasVariables('No variables')).toBe(false);
            expect(VariableReplacer.hasVariables('{{a}} and {{b}}')).toBe(true);
        });
    });

    describe('getAvailableVariables', () => {
        it('should list all available variable paths', () => {
            const context: ActionContext = {
                areaId: 'test-area',
                userId: 'test-user',
                executionId: 'test-execution',
                timestamp: '2025-01-15T00:00:00Z',
                triggerData: {
                    message: {
                        id: '123',
                        content: 'Hello'
                    },
                    author: {
                        username: 'John'
                    }
                }
            };

            const variables = VariableReplacer.getAvailableVariables(context);
            expect(variables).toContain('message.id');
            expect(variables).toContain('message.content');
            expect(variables).toContain('author.username');
        });
    });

    describe('Real world example: Discord -> Gmail', () => {
        it('should replace Discord message data in Gmail config', () => {
            // Simule le context que Discord trigger envoie
            const context: ActionContext = {
                areaId: 'area-123',
                userId: 'user-456',
                executionId: 'exec-789',
                timestamp: '2025-01-15T10:30:00Z',
                triggerData: {
                    message: {
                        id: '1234567890',
                        content: 'Check out this new feature!',
                        channelId: '9876543210',
                        channelName: 'announcements',
                        guildId: '1111111111',
                        guildName: 'My Discord Server',
                        timestamp: '2025-01-15T10:30:00Z',
                        hasAttachments: false,
                        attachments: []
                    },
                    author: {
                        id: '2222222222',
                        tag: 'JohnDoe#1234',
                        username: 'JohnDoe'
                    }
                }
            };

            // Config de l'action Gmail avec des variables
            const gmailConfig = {
                to: 'notifications@example.com',
                subject: 'New Discord message in #{{message.channelName}}',
                body: `
New message from {{author.username}} ({{author.tag}}) in #{{message.channelName}} on {{message.guildName}}:

{{message.content}}

Posted at: {{message.timestamp}}
Message ID: {{message.id}}
                `.trim()
            };

            // Remplacer les variables
            const result = VariableReplacer.replaceInObject(gmailConfig, context);

            expect(result.to).toBe('notifications@example.com');
            expect(result.subject).toBe('New Discord message in #announcements');
            expect(result.body).toContain('New message from JohnDoe (JohnDoe#1234)');
            expect(result.body).toContain('in #announcements on My Discord Server');
            expect(result.body).toContain('Check out this new feature!');
            expect(result.body).toContain('Message ID: 1234567890');
        });
    });
});
