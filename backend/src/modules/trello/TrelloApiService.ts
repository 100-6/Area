import 'colors';

/**
 * Interface representing a Trello board
 */
export interface TrelloBoard {
    id: string;
    name: string;
    desc: string;
    url: string;
    closed: boolean;
    dateLastActivity: string;
}

/**
 * Interface representing a Trello webhook
 */
export interface TrelloWebhook {
    id: string;
    idModel: string;
    callbackURL: string;
    active: boolean;
    description: string;
}

/**
 * Interface representing a Trello card
 */
export interface TrelloCard {
    id: string;
    name: string;
    desc: string;
    url: string;
    idList: string;
    idBoard: string;
    closed: boolean;
    pos: number;
}

/**
 * Interface representing a Trello list
 */
export interface TrelloList {
    id: string;
    name: string;
    idBoard: string;
    closed: boolean;
    pos: number;
}

/**
 * Abstraction service to interact with the Trello API v1
 */
export class TrelloApiService {
    private baseUrl = 'https://api.trello.com/1';

    async getBoards(apiKey: string, token: string): Promise<TrelloBoard[]> {
        try {
            console.log('[Trello API] Fetching user boards...'.cyan);
            const url = `${this.baseUrl}/members/me/boards?key=${apiKey}&token=${token}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const boards = await response.json() as TrelloBoard[];
            console.log(`[Trello API] ✓ Found ${boards.length} boards`.green);
            return boards;
        } catch (error) {
            console.error('[Trello API] Error fetching boards:'.red, error);
            throw error;
        }
    }

    async getBoard(boardId: string, apiKey: string, token: string): Promise<TrelloBoard> {
        try {
            const url = `${this.baseUrl}/boards/${boardId}?key=${apiKey}&token=${token}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            return await response.json() as TrelloBoard;
        } catch (error) {
            console.error('[Trello API] Error fetching board:'.red, error);
            throw error;
        }
    }

    async createWebhook(
        boardId: string,
        callbackUrl: string,
        apiKey: string,
        token: string,
        description?: string
    ): Promise<TrelloWebhook> {
        try {
            console.log(`[Trello API] Creating webhook for board ${boardId}...`.cyan);
            const url = `${this.baseUrl}/webhooks?key=${apiKey}&token=${token}`;
            const body = {
                idModel: boardId,
                callbackURL: callbackUrl,
                description: description || `AREA webhook for board ${boardId}`
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const webhook = await response.json() as TrelloWebhook;
            console.log(`[Trello API] ✓ Webhook created: ${webhook.id}`.green);
            return webhook;
        } catch (error) {
            console.error('[Trello API] Error creating webhook:'.red, error);
            throw error;
        }
    }

    async deleteWebhook(webhookId: string, apiKey: string, token: string): Promise<void> {
        try {
            const url = `${this.baseUrl}/webhooks/${webhookId}?key=${apiKey}&token=${token}`;
            const response = await fetch(url, { method: 'DELETE' });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            console.log(`[Trello API] ✓ Webhook deleted`.green);
        } catch (error) {
            console.error('[Trello API] Error deleting webhook:'.red, error);
            throw error;
        }
    }

    async getWebhooks(apiKey: string, token: string): Promise<TrelloWebhook[]> {
        try {
            const url = `${this.baseUrl}/tokens/${token}/webhooks?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const webhooks = await response.json() as TrelloWebhook[];
            console.log(`[Trello API] ✓ Found ${webhooks.length} webhooks`.green);
            return webhooks;
        } catch (error) {
            console.error('[Trello API] Error fetching webhooks:'.red, error);
            throw error;
        }
    }

    async verifyConnection(apiKey: string, token: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/members/me?key=${apiKey}&token=${token}`;
            const response = await fetch(url, { method: 'GET' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Create a new card in a list
     */
    async createCard(
        apiKey: string,
        token: string,
        listId: string,
        name: string,
        desc?: string,
        position: 'top' | 'bottom' = 'bottom'
    ): Promise<TrelloCard> {
        try {
            console.log(`[Trello API] Creating card in list ${listId}...`.cyan);
            const params = new URLSearchParams({
                key: apiKey,
                token: token,
                idList: listId,
                name: name,
                pos: position
            });

            if (desc) params.append('desc', desc);

            const response = await fetch(`${this.baseUrl}/cards?${params.toString()}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const card = await response.json() as TrelloCard;
            console.log(`[Trello API] ✓ Card created: ${card.name}`.green);
            return card;
        } catch (error) {
            console.error('[Trello API] Error creating card:'.red, error);
            throw error;
        }
    }

    /**
     * Move a card to another list
     */
    async moveCard(
        apiKey: string,
        token: string,
        cardId: string,
        listId: string,
        position: 'top' | 'bottom' = 'bottom'
    ): Promise<TrelloCard> {
        try {
            console.log(`[Trello API] Moving card ${cardId} to list ${listId}...`.cyan);
            const params = new URLSearchParams({
                key: apiKey,
                token: token,
                idList: listId,
                pos: position
            });

            const response = await fetch(`${this.baseUrl}/cards/${cardId}?${params.toString()}`, {
                method: 'PUT',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const card = await response.json() as TrelloCard;
            console.log(`[Trello API] ✓ Card moved successfully`.green);
            return card;
        } catch (error) {
            console.error('[Trello API] Error moving card:'.red, error);
            throw error;
        }
    }

    /**
     * Delete a card
     */
    async deleteCard(apiKey: string, token: string, cardId: string): Promise<void> {
        try {
            console.log(`[Trello API] Deleting card ${cardId}...`.cyan);
            const url = `${this.baseUrl}/cards/${cardId}?key=${apiKey}&token=${token}`;
            const response = await fetch(url, { method: 'DELETE' });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            console.log(`[Trello API] ✓ Card deleted`.green);
        } catch (error) {
            console.error('[Trello API] Error deleting card:'.red, error);
            throw error;
        }
    }

    /**
     * Create a new list in a board
     */
    async createList(
        apiKey: string,
        token: string,
        boardId: string,
        name: string,
        position: 'top' | 'bottom' = 'bottom'
    ): Promise<TrelloList> {
        try {
            console.log(`[Trello API] Creating list in board ${boardId}...`.cyan);
            const params = new URLSearchParams({
                key: apiKey,
                token: token,
                idBoard: boardId,
                name: name,
                pos: position
            });

            const response = await fetch(`${this.baseUrl}/lists?${params.toString()}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            const list = await response.json() as TrelloList;
            console.log(`[Trello API] ✓ List created: ${list.name}`.green);
            return list;
        } catch (error) {
            console.error('[Trello API] Error creating list:'.red, error);
            throw error;
        }
    }

    /**
     * Archive (close) a list
     */
    async deleteList(apiKey: string, token: string, listId: string): Promise<void> {
        try {
            console.log(`[Trello API] Archiving list ${listId}...`.cyan);
            const params = new URLSearchParams({
                key: apiKey,
                token: token,
                closed: 'true'
            });

            const response = await fetch(`${this.baseUrl}/lists/${listId}?${params.toString()}`, {
                method: 'PUT',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trello API error: ${response.status} - ${error}`);
            }

            console.log(`[Trello API] ✓ List archived`.green);
        } catch (error) {
            console.error('[Trello API] Error archiving list:'.red, error);
            throw error;
        }
    }
}
