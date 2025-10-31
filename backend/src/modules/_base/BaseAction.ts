import { VariableReplacer } from '../../shared/utils/VariableReplacer';
import 'colors';

/**
 * Interface de configuration d'une action
 */
export interface ActionConfig {
    [key: string]: any;
}

/**
 * Contexte d'exécution fourni à l'action
 */
export interface ActionContext {
    areaId: string;
    userId: string;
    triggerData: any;
    executionId: string;
    timestamp: string;
    previousOutputs?: Record<string, any>;
}

/**
 * Résultat de l'exécution d'une action
 */
export interface ActionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime?: number;
    message?: string;
}

/**
 * Classe abstraite de base pour toutes les REActions
 * Chaque service doit étendre cette classe pour ses actions
 */
export abstract class BaseAction {
    /**
     * Nom unique de l'action (ex: 'send_email', 'post_message')
     */
    abstract getName(): string;

    /**
     * Description de l'action
     */
    abstract getDescription(): string;

    /**
     * Schéma de configuration attendu (JSON Schema)
     */
    abstract getConfigSchema(): any;

    /**
     * Schéma des données retournées par l'action (JSON Schema)
     * Ces données seront disponibles dans context.previousOutputs pour les actions suivantes
     */
    getOutputSchema(): any {
        return null; // Par défaut, pas d'output schema
    }

    /**
     * Scopes OAuth2 requis (si applicable)
     */
    abstract getRequiredScopes(): string[];

    /**
     * Rate limit par heure (défaut: 1000)
     */
    getRateLimit(): number {
        return 1000;
    }

    /**
     * Valider la configuration fournie par l'utilisateur
     * @throws Error si la config est invalide
     */
    abstract validate(config: ActionConfig): boolean;

    /**
     * Exécuter l'action
     * @param config - Configuration de l'action
     * @param context - Contexte d'exécution
     * @returns Résultat de l'exécution
     */
    abstract execute(
        config: ActionConfig,
        context: ActionContext
    ): Promise<ActionResult>;

    /**
     * Hook appelé avant l'exécution
     */
    protected async onBeforeExecute(config: ActionConfig, context: ActionContext): Promise<void> {
    }

    /**
     * Hook appelé après l'exécution
     */
    protected async onAfterExecute(result: ActionResult, context: ActionContext): Promise<void> {
    }

    /**
     * Hook appelé en cas d'erreur
     */
    protected async onError(error: Error, context: ActionContext): Promise<void> {
        console.error(`[${this.getName()}] Action failed:`.red, error);
    }

    /**
     * Wrapper d'exécution avec hooks et mesure du temps
     */
    public async run(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[${this.getName()}] Starting execution for AREA ${context.areaId}`.cyan);
            this.validate(config);
            await this.onBeforeExecute(config, context);
            const result = await this.execute(config, context);
            result.executionTime = Date.now() - startTime;
            await this.onAfterExecute(result, context);
            console.log(`[${this.getName()}] Execution completed in ${result.executionTime}ms`.green);
            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            await this.onError(error as Error, context);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }

    /**
     * Vérifier si les scopes nécessaires sont disponibles
     */
    protected hasRequiredScopes(userScopes: string[]): boolean {
        const requiredScopes = this.getRequiredScopes();
        return requiredScopes.every(scope => userScopes.includes(scope));
    }

    /**
     * Replace template variables in a string
     * Example: "Hello {{author.username}}" with context.triggerData.author.username = "John"
     *          => "Hello John"
     *
     * @param text - Text containing {{variable.path}} patterns
     * @param context - Action context with triggerData and previousOutputs
     * @param debug - Enable debug logging (default: false)
     * @returns Text with all variables replaced
     */
    protected replaceVariables(text: string, context: ActionContext, debug: boolean = false): string {
        return VariableReplacer.replace(text, context, debug);
    }

    /**
     * Replace variables in an entire config object (recursively)
     * Useful for processing the entire action config at once
     *
     * @param config - Config object with strings containing {{variable.path}}
     * @param context - Action context
     * @param debug - Enable debug logging (default: false)
     * @returns New config object with all variables replaced
     */
    protected replaceVariablesInConfig(config: ActionConfig, context: ActionContext, debug: boolean = false): ActionConfig {
        return VariableReplacer.replaceInObject(config, context, debug);
    }

    /**
     * Get list of available variables from context
     * Useful for debugging or validation
     *
     * @param context - Action context
     * @returns Array of available variable paths (e.g., ['message.content', 'author.username'])
     */
    protected getAvailableVariables(context: ActionContext): string[] {
        return VariableReplacer.getAvailableVariables(context);
    }

    /**
     * Check if a string contains template variables
     *
     * @param text - Text to check
     * @returns true if text contains {{...}} patterns
     */
    protected hasVariables(text: string): boolean {
        return VariableReplacer.hasVariables(text);
    }

    /**
     * Extract all variable references from a string
     *
     * @param text - Text to extract from
     * @returns Array of variable paths found (e.g., ['message.content', 'author.tag'])
     */
    protected extractVariables(text: string): string[] {
        return VariableReplacer.extractVariables(text);
    }
}
