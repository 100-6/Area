import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../_base/BaseAction';
import 'colors';

/**
 * Action exemple qui récupère un article et retourne ses données
 * Les données retournées seront disponibles pour les actions suivantes
 */
export class FetchArticleAction extends BaseAction {
    getName(): string {
        return 'fetch_article';
    }

    getDescription(): string {
        return 'Récupère un article de news et expose ses données';
    }

    getConfigSchema(): any {
        return {
            source: { type: 'string', required: true },
            category: { type: 'string', required: true }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        if (!config.source || !config.category) {
            throw new Error('Les champs "source" et "category" sont requis');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        // Simulation de récupération d'un article
        // En production, ceci ferait un appel API réel
        
        const article = {
            title: `Breaking: ${config.category} news from ${config.source}`,
            body: `This is a detailed article about ${config.category}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
            author: 'John Doe',
            publishedAt: new Date().toISOString(),
            url: `https://example.com/articles/${config.source}/${config.category}`,
            imageUrl: `https://example.com/images/${config.category}.jpg`,
            tags: [config.source, config.category, 'breaking-news']
        };

        console.log(`[FetchArticle] Retrieved article: "${article.title}"`.green);

        // ✨ Les données retournées dans "data" seront disponibles
        // dans context.previousOutputs pour les actions suivantes
        return {
            success: true,
            data: article
        };
    }
}

/**
 * Action qui utilise les outputs de l'action précédente
 */
export class FormatArticleAction extends BaseAction {
    getName(): string {
        return 'format_article';
    }

    getDescription(): string {
        return 'Formate un article récupéré dans un template personnalisé';
    }

    getConfigSchema(): any {
        return {
            template: { type: 'string', required: true },
            includeImage: { type: 'boolean', default: false }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        if (!config.template) {
            throw new Error('Le champ "template" est requis');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        // ✨ Accès aux outputs des actions précédentes
        const previousOutputs = context.previousOutputs || {};
        
        console.log(`[FormatArticle] Available outputs from previous actions:`.cyan);
        console.log(JSON.stringify(Object.keys(previousOutputs), null, 2));

        // Récupérer les données de l'article depuis les outputs précédents
        // On cherche le premier output qui contient un article
        let articleData: any = null;
        for (const nodeId in previousOutputs) {
            const output = previousOutputs[nodeId];
            if (output.title && output.body) {
                articleData = output;
                console.log(`[FormatArticle] Found article data from node ${nodeId}`.green);
                break;
            }
        }

        if (!articleData) {
            return {
                success: false,
                error: 'Aucun article trouvé dans les outputs précédents. Assurez-vous qu\'une action "fetch_article" a été exécutée avant.'
            };
        }

        // Remplacer les placeholders dans le template
        let formatted = config.template;
        for (const [key, value] of Object.entries(articleData)) {
            const placeholder = `{{${key}}}`;
            if (formatted.includes(placeholder)) {
                formatted = formatted.replace(new RegExp(placeholder, 'g'), String(value));
            }
        }

        // Ajouter l'image si demandé
        if (config.includeImage && articleData.imageUrl) {
            formatted += `\n\n🖼️ Image: ${articleData.imageUrl}`;
        }

        console.log(`[FormatArticle] Formatted text (${formatted.length} chars)`.green);

        // ✨ Cette action retourne aussi des données
        // qui peuvent être utilisées par les actions suivantes
        return {
            success: true,
            data: {
                formattedText: formatted,
                length: formatted.length,
                // On peut aussi passer les données originales si besoin
                originalArticle: articleData
            }
        };
    }
}

/**
 * Action qui utilise les outputs de multiples actions précédentes
 */
export class SendNotificationAction extends BaseAction {
    getName(): string {
        return 'send_notification';
    }

    getDescription(): string {
        return 'Envoie une notification avec le contenu d\'un article';
    }

    getConfigSchema(): any {
        return {
            message: { type: 'string', required: true },
            minLength: { type: 'number', default: 0 }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        if (!config.message) {
            throw new Error('Le champ "message" est requis');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const previousOutputs = context.previousOutputs || {};
        
        console.log(`[SendNotification] Processing notification...`.cyan);

        // Collecter toutes les données disponibles depuis les outputs précédents
        const availableData: any = {};
        for (const nodeId in previousOutputs) {
            const output = previousOutputs[nodeId];
            // Merger tous les outputs disponibles
            Object.assign(availableData, output);
        }

        // Vérifier la condition minLength si un texte formaté existe
        const minLength = config.minLength || 0;
        if (availableData.length && availableData.length < minLength) {
            console.log(`[SendNotification] Skipping notification: text length (${availableData.length}) < minLength (${minLength})`.yellow);
            return {
                success: true,
                data: {
                    sent: false,
                    reason: 'Text too short'
                }
            };
        }

        // Remplacer les placeholders dans le message
        let message = config.message;
        for (const [key, value] of Object.entries(availableData)) {
            const placeholder = `{{${key}}}`;
            if (message.includes(placeholder)) {
                // Limiter la taille des valeurs longues
                let strValue = String(value);
                if (strValue.length > 100) {
                    strValue = strValue.substring(0, 97) + '...';
                }
                message = message.replace(new RegExp(placeholder, 'g'), strValue);
            }
        }

        // Simuler l'envoi de notification
        console.log(`[SendNotification] 📨 Sending notification:`.green);
        console.log(`---`.gray);
        console.log(message);
        console.log(`---`.gray);

        return {
            success: true,
            data: {
                sent: true,
                message: message,
                timestamp: new Date().toISOString()
            }
        };
    }
}
