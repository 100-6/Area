import 'colors';

export type TrelloTriggerName = 'board.created' | 'board.updated' | 'board.closed';

export interface TrelloActionMember {
    fullName?: string;
    username?: string;
}

export interface TrelloBoardModel {
    id: string;
    name?: string;
    url?: string;
    shortUrl?: string;
    shortLink?: string;
    closed?: boolean;
    desc?: string;
}

export interface TrelloWebhookAction {
    type: string;
    date: string;
    data: {
        board?: TrelloBoardModel;
        old?: Record<string, any>;
        [key: string]: any;
    };
    memberCreator?: TrelloActionMember;
}

export interface TrelloWebhookPayload {
    action?: TrelloWebhookAction;
    model?: TrelloBoardModel;
    [key: string]: any;
}

export interface TrelloTriggerRegistration {
    areaId: string;
    userId: string;
    boardId?: string;
    triggerName: TrelloTriggerName;
    trigger: TrelloTriggerHandler;
}

export interface TrelloTriggerHandler {
    getName(): TrelloTriggerName;
    handleWebhookEvent(areaId: string, payload: TrelloWebhookPayload, registration: TrelloTriggerRegistration): Promise<boolean>;
}

/**
 * Central registry for Trello webhook listeners.
 * Holds in-memory mappings between AREA IDs and trigger handlers.
 */
export class TrelloWebhookManager {
    private static instance: TrelloWebhookManager;
    private registrations: Map<string, TrelloTriggerRegistration> = new Map();

    private constructor() {}

    public static getInstance(): TrelloWebhookManager {
        if (!TrelloWebhookManager.instance) {
            TrelloWebhookManager.instance = new TrelloWebhookManager();
        }
        return TrelloWebhookManager.instance;
    }

    register(areaId: string, registration: Omit<TrelloTriggerRegistration, 'areaId'>): void {
        this.registrations.set(areaId, { areaId, ...registration });
        console.log(`[TrelloWebhookManager] Registered trigger ${registration.triggerName} for AREA ${areaId}`.green);
    }

    unregister(areaId: string): void {
        if (this.registrations.delete(areaId)) {
            console.log(`[TrelloWebhookManager] Unregistered AREA ${areaId}`.yellow);
        }
    }

    clearAll(): void {
        this.registrations.clear();
    }

    getRegistrations(): TrelloTriggerRegistration[] {
        return Array.from(this.registrations.values());
    }

    /**
     * Dispatch Trello webhook payload to matching triggers.
     * @returns number of triggers fired
     */
    async handleIncomingWebhook(userId: string, payload: TrelloWebhookPayload): Promise<number> {
        if (!payload?.action) {
            console.warn('[TrelloWebhookManager] Payload without action ignored'.yellow);
            return 0;
        }

        const actionType = payload.action.type;
        const relevantRegistrations = this.getRegistrations().filter(reg => reg.userId === userId && this.isActionMatchingTrigger(actionType, reg.triggerName));

        if (relevantRegistrations.length === 0) {
            console.log(`[TrelloWebhookManager] No trigger listening for user ${userId} and action ${actionType}`.cyan);
            return 0;
        }

        let firedCount = 0;

        for (const registration of relevantRegistrations) {
            try {
                const handled = await registration.trigger.handleWebhookEvent(registration.areaId, payload, registration);
                if (handled) {
                    firedCount += 1;
                }
            } catch (error) {
                console.error(`[TrelloWebhookManager] Error while delivering webhook to AREA ${registration.areaId}:`.red, error);
            }
        }

        return firedCount;
    }

    private isActionMatchingTrigger(actionType: string, triggerName: TrelloTriggerName): boolean {
        switch (triggerName) {
            case 'board.created':
                return actionType === 'createBoard';
            case 'board.updated':
                return actionType === 'updateBoard';
            case 'board.closed':
                return actionType === 'updateBoard' || actionType === 'closeBoard';
            default:
                return false;
        }
    }
}
