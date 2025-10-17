import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { EventSource } from 'eventsource';
import 'colors';

interface MessageReceivedConfig extends TriggerConfig {
    baseUrl?: string;
    topic: string;
    since?: string;
    priority?: number[];
}

interface NtfyMessage {
    id: string;
    time: number;
    event: string;
    topic: string;
    priority?: number;
    tags?: string[];
    title?: string;
    message?: string;
    click?: string;
    attachment?: {
        name: string;
        url: string;
        type: string;
        size: number;
        expires: number;
    };
}

/**
 * Trigger: Message Received
 * Subscribes to a ntfy topic using Server-Sent Events (SSE)
 * and fires when a new message is received
 */
export class MessageReceivedTrigger extends BaseTrigger {
    private activeSubscriptions: Map<string, EventSource> = new Map();
    private seenMessageIds: Map<string, Set<string>> = new Map();

    getName(): string {
        return 'message_received';
    }

    getType(): 'polling' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a message is received on a ntfy topic';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['topic'],
            properties: {
                baseUrl: {
                    type: 'string',
                    description: 'Ntfy server URL',
                    default: 'https://ntfy.sh',
                    example: 'https://ntfy.sh'
                },
                topic: {
                    type: 'string',
                    description: 'Topic to subscribe to',
                    example: 'my-alerts',
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                since: {
                    type: 'string',
                    description: 'Only return messages since this time',
                    default: '10m',
                    example: '10m'
                },
                priority: {
                    type: 'array',
                    description: 'Filter by priority (1-5)',
                    items: {
                        type: 'number',
                        minimum: 1,
                        maximum: 5
                    }
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Message ID'
                },
                time: {
                    type: 'number',
                    description: 'Unix timestamp'
                },
                event: {
                    type: 'string',
                    description: 'Event type'
                },
                topic: {
                    type: 'string',
                    description: 'Topic name'
                },
                priority: {
                    type: 'number',
                    description: 'Message priority (1-5)'
                },
                tags: {
                    type: 'array',
                    description: 'Message tags',
                    items: { type: 'string' }
                },
                title: {
                    type: 'string',
                    description: 'Notification title'
                },
                message: {
                    type: 'string',
                    description: 'Notification message'
                },
                click: {
                    type: 'string',
                    description: 'Click URL'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as MessageReceivedConfig;

        if (!cfg.topic || typeof cfg.topic !== 'string') {
            throw new Error('topic is required and must be a string');
        }

        const topicRegex = /^[a-zA-Z0-9_-]+$/;
        if (!topicRegex.test(cfg.topic)) {
            throw new Error('topic must contain only alphanumeric characters, underscores, and dashes');
        }

        if (cfg.priority && !Array.isArray(cfg.priority)) {
            throw new Error('priority must be an array of numbers');
        }

        if (cfg.priority) {
            for (const p of cfg.priority) {
                if (typeof p !== 'number' || p < 1 || p > 5) {
                    throw new Error('priority values must be between 1 and 5');
                }
            }
        }

        return true;
    }

    /**
     * Start listening to ntfy topic via SSE
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as MessageReceivedConfig;
        this.validate(cfg);

        const baseUrl = cfg.baseUrl || 'https://ntfy.sh';
        const since = cfg.since || '10m';
        // Use /sse endpoint for Server-Sent Events (not /json)
        const url = `${baseUrl}/${cfg.topic}/sse?since=${since}`;

        console.log(`[Ntfy] Starting MessageReceived trigger for AREA ${areaId}`.green);
        console.log(`[Ntfy] Subscribing to: ${url}`.cyan);

        // Initialize seen messages set for this area
        if (!this.seenMessageIds.has(areaId)) {
            this.seenMessageIds.set(areaId, new Set());
        }

        const eventSource = new EventSource(url);

        eventSource.onmessage = async (event: any) => {
            try {
                // Parse the JSON data from SSE
                if (!event.data || event.data.trim() === '') {
                    return; // Skip empty events
                }

                const message: NtfyMessage = JSON.parse(event.data);

                // Skip keepalive and open events
                if (message.event === 'keepalive' || message.event === 'open') {
                    console.log(`[Ntfy] Received ${message.event} event for topic "${cfg.topic}"`.gray);
                    return;
                }

                // Skip if we've already processed this message
                const seenIds = this.seenMessageIds.get(areaId);
                if (seenIds?.has(message.id)) {
                    console.log(`[Ntfy] Skipping duplicate message ${message.id}`.gray);
                    return;
                }

                // Filter by priority if specified
                if (cfg.priority && cfg.priority.length > 0) {
                    if (!message.priority || !cfg.priority.includes(message.priority)) {
                        console.log(`[Ntfy] Skipping message ${message.id} - priority ${message.priority} not in filter`.gray);
                        return;
                    }
                }

                // Mark as seen
                seenIds?.add(message.id);

                console.log(`[Ntfy] Received message on topic "${cfg.topic}": ${message.title || message.message}`.cyan);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: message.id,
                        time: message.time,
                        event: message.event,
                        topic: message.topic,
                        priority: message.priority,
                        tags: message.tags || [],
                        title: message.title || '',
                        message: message.message || '',
                        click: message.click || '',
                        attachment: message.attachment
                    }
                };

                await this.emitTrigger(payload);
            } catch (error) {
                console.error('[Ntfy] Error processing message:'.red, error);
            }
        };

        eventSource.onerror = (error: any) => {
            console.error(`[Ntfy] SSE connection error for AREA ${areaId}:`.red, error);
            // EventSource will automatically reconnect
        };

        eventSource.onopen = () => {
            console.log(`[Ntfy] SSE connection established for AREA ${areaId}`.green);
        };

        this.activeSubscriptions.set(areaId, eventSource);
        this.isRunning = true;
    }

    /**
     * Stop listening to ntfy topic
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[Ntfy] Stopping MessageReceived trigger for AREA ${areaId}`.yellow);

        const eventSource = this.activeSubscriptions.get(areaId);
        if (eventSource) {
            eventSource.close();
            this.activeSubscriptions.delete(areaId);
            console.log(`[Ntfy] Closed SSE connection for AREA ${areaId}`.green);
        }

        // Clean up seen messages
        this.seenMessageIds.delete(areaId);

        if (this.activeSubscriptions.size === 0) {
            this.isRunning = false;
        }
    }
}
