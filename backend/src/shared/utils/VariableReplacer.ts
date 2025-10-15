import { ActionContext } from '../../modules/_base/BaseAction';
import 'colors';

/**
 * Utility class for replacing template variables in strings
 * Supports nested object access like {{message.content}}, {{author.username}}
 *
 * Example usage:
 * ```typescript
 * const context = {
 *   previousOutputs: { node1: { message: { content: 'Hello' } } },
 *   triggerData: { author: { username: 'John' } }
 * };
 *
 * const result = VariableReplacer.replace('Message: {{message.content}} from {{author.username}}', context);
 * // Result: "Message: Hello from John"
 * ```
 */
export class VariableReplacer {
    /**
     * Replace all template variables in a string
     * @param text - Text containing template variables like {{variable.path}}
     * @param context - Action context with previousOutputs and triggerData
     * @param debug - Enable debug logging
     * @returns Text with all variables replaced
     */
    static replace(text: string, context: ActionContext, debug: boolean = false): string {
        const variablePattern = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
        let result = text;
        let match;
        const availableData = this.collectAvailableData(context);

        if (!text || typeof text !== 'string')
            return text;
        if (debug) {
            console.log('[VariableReplacer] Available data:'.yellow);
            console.log(JSON.stringify(availableData, null, 2));
        }
        while ((match = variablePattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const path = match[1];
            const value = this.getNestedValue(availableData, path);
            if (value !== undefined && value !== null) {
                result = result.replace(fullMatch, String(value));
                if (debug)
                    console.log(`[VariableReplacer] Replaced ${fullMatch} -> ${value}`.green);
            } else {
                if (debug)
                    console.log(`[VariableReplacer] No value found for ${fullMatch}`.red);
            }
        }
        return result;
    }

    /**
     * Replace variables in an entire object (recursively)
     * Useful for replacing variables in config objects
     * @param obj - Object containing strings with template variables
     * @param context - Action context
     * @param debug - Enable debug logging
     * @returns New object with all string values having variables replaced
     */
    static replaceInObject(obj: any, context: ActionContext, debug: boolean = false): any {
        if (typeof obj === 'string')
            return this.replace(obj, context, debug);
        if (Array.isArray(obj))
            return obj.map(item => this.replaceInObject(item, context, debug));
        if (obj !== null && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj))
                result[key] = this.replaceInObject(value, context, debug);
            return result;
        }
        return obj;
    }

    /**
     * Collect all available data from context.previousOutputs and context.triggerData
     * Flattens the data structure for easy access
     */
    private static collectAvailableData(context: ActionContext): any {
        const data: any = {};

        if (context.previousOutputs) {
            for (const nodeId in context.previousOutputs) {
                const nodeOutput = context.previousOutputs[nodeId];
                Object.assign(data, nodeOutput);
            }
        }
        if (context.triggerData)
            Object.assign(data, context.triggerData);
        return data;
    }

    /**
     * Get a nested value from an object using a dot-notation path
     * Example: getNestedValue({ message: { content: 'Hello' } }, 'message.content') => 'Hello'
     * @param obj - Object to search in
     * @param path - Dot-notation path (e.g., "message.content", "author.username")
     * @returns The value at the path, or undefined if not found
     */
    private static getNestedValue(obj: any, path: string): any {
        const keys = path.split('.');
        let current = obj;

        if (!obj || typeof obj !== 'object')
            return undefined;
        for (const key of keys) {
            if (current === null || current === undefined)
                return undefined;
            if (typeof current === 'object' && key in current)
                current = current[key];
            else
                return undefined;
        }
        return current;
    }

    /**
     * Extract all variable references from a string
     * Example: "Hello {{message.content}} from {{author.username}}"
     *          => ["message.content", "author.username"]
     * @param text - Text containing template variables
     * @returns Array of variable paths found
     */
    static extractVariables(text: string): string[] {
        const variablePattern = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
        const variables: string[] = [];
        let match;

        if (!text || typeof text !== 'string')
            return [];
        while ((match = variablePattern.exec(text)) !== null)
            variables.push(match[1]);
        return variables;
    }

    /**
     * Check if a string contains any template variables
     * @param text - Text to check
     * @returns true if text contains {{...}} patterns
     */
    static hasVariables(text: string): boolean {
        if (!text || typeof text !== 'string')
            return false;
        return /\{\{[a-zA-Z0-9_.]+\}\}/.test(text);
    }

    /**
     * Get a list of available variables from context
     * Useful for debugging or showing users what variables they can use
     * @param context - Action context
     * @returns Array of available variable paths
     */
    static getAvailableVariables(context: ActionContext): string[] {
        const data = this.collectAvailableData(context);
        return this.flattenObjectPaths(data);
    }

    /**
     * Flatten an object into an array of dot-notation paths
     * Example: { message: { content: 'Hi' } } => ['message.content']
     */
    private static flattenObjectPaths(obj: any, prefix: string = ''): string[] {
        const paths: string[] = [];

        if (obj === null || obj === undefined || typeof obj !== 'object')
            return paths;
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            if (value !== null && typeof value === 'object' && !Array.isArray(value))
                paths.push(...this.flattenObjectPaths(value, currentPath));
            else
                paths.push(currentPath);
        }

        return paths;
    }
}
