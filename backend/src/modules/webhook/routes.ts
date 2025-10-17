import { Router, Request, Response } from 'express';
import express from 'express';
import { WebhookRegistry } from './WebhookRegistry';
import { webhookModule } from './service';
import { asyncHandler } from '../../core/middleware/error';
import 'colors';

const router = Router();

// Add raw text parser for text/plain and text/html
router.use(express.text({ type: ['text/plain', 'text/html', 'text/*'], limit: '10mb' }));
// Add raw buffer parser for other content types
router.use(express.raw({ type: '*/*', limit: '10mb' }));

/**
 * Public webhook endpoint - receives POST requests without authentication
 * 
 * This endpoint is intentionally placed BEFORE auth middleware in the main app
 * to allow external devices/services to send data without JWT tokens.
 * 
 * @route POST /webhook/:name
 * @param name - User-defined webhook name (alphanumeric, dash, underscore)
 * @body Any JSON or form-data payload
 * 
 * @returns 200 OK with success message if webhook is registered
 * @returns 404 Not Found if webhook name doesn't exist
 * @returns 400 Bad Request if payload is invalid
 * @returns 413 Payload Too Large if body exceeds limit
 * 
 * @example
 * ```bash
 * # Send JSON data
 * curl -X POST https://api.mirror-area.com/webhook/temperature-sensor \
 *   -H "Content-Type: application/json" \
 *   -d '{"temp": 22.5, "humidity": 60}'
 * 
 * # Send form data
 * curl -X POST https://api.mirror-area.com/webhook/form-webhook \
 *   -d "name=John&email=john@example.com"
 * ```
 */
router.post(
    '/:name',
    asyncHandler(async (req: Request, res: Response) => {
        const webhookName = req.params.name;

        console.log(
            `[Webhook Routes] 📨 Received POST on /webhook/${webhookName}`.cyan
        );

        // Check if webhook exists in registry
        const registry = WebhookRegistry.getInstance();
        if (!registry.exists(webhookName)) {
            console.warn(
                `[Webhook Routes] ⚠️  Webhook "${webhookName}" not found`.yellow
            );

            return res.status(404).json({
                success: false,
                error: `Webhook "${webhookName}" not found`,
                message: 'This webhook is not registered. Please check the webhook name or create a new workflow.'
            });
        }

                // Parse body based on Content-Type
        let parsedBody: any;
        let rawText: string | null = null;
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            // JSON already parsed by express.json()
            parsedBody = req.body;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Form data - check if it's actually plain text (curl default behavior)
            // When curl sends: curl -d "text", it becomes: {"text": ""}
            // We treat this as plain text for convenience
            const keys = Object.keys(req.body || {});
            if (keys.length === 1 && req.body[keys[0]] === '') {
                // Single key with empty value = plain text sent via curl
                rawText = keys[0];
                parsedBody = { text: rawText };
            } else {
                // Real form data with key=value pairs
                parsedBody = req.body;
            }
        } else if (contentType.includes('text/') || !contentType) {
            // Text content (text/plain, text/html, etc.) or no content-type
            rawText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            parsedBody = { text: rawText };
        } else {
            // Raw data or unknown type
            parsedBody = req.body || null;
        }

        // Enrich payload with metadata
        const enrichedPayload = {
            receivedAt: new Date().toISOString(),
            webhookName,
            contentType: req.headers['content-type'] || 'text/plain',
            body: parsedBody,
            text: rawText, // Direct access to raw text for convenience
            headers: {
                'user-agent': req.headers['user-agent'],
                'referer': req.headers['referer'],
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip
            }
        };

        console.log(
            `[Webhook Routes] 📦 Payload:`.cyan,
            JSON.stringify(enrichedPayload.body).substring(0, 100)
        );

        // Get trigger instance and handle webhook
        const trigger = webhookModule.getTrigger('webhook_received');

        if (!trigger) {
            console.error('[Webhook Routes] ❌ webhook_received trigger not found'.red);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Webhook trigger is not available'
            });
        }

        try {
            // Fire the trigger
            await trigger.handleIncomingWebhook(webhookName, enrichedPayload);

            console.log(
                `[Webhook Routes] ✓ Webhook processed successfully`.green
            );

            // Return success response (standard webhook pattern)
            return res.status(200).json({
                success: true,
                message: 'Webhook received and processed',
                webhook: webhookName,
                receivedAt: enrichedPayload.receivedAt
            });
        } catch (error: any) {
            console.error(
                `[Webhook Routes] ❌ Error processing webhook:`.red,
                error.message
            );

            return res.status(500).json({
                success: false,
                error: 'Failed to process webhook',
                message: error.message
            });
        }
    })
);

/**
 * Health check endpoint for webhook service
 * Useful for monitoring and debugging
 * 
 * @route GET /webhook/health
 * @returns 200 OK with service status
 */
router.get('/health', (req: Request, res: Response) => {
    const registry = WebhookRegistry.getInstance();

    return res.status(200).json({
        success: true,
        service: 'webhook',
        status: 'operational',
        activeWebhooks: registry.size(),
        timestamp: new Date().toISOString()
    });
});

export default router;
