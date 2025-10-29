import { Router, Request, Response } from 'express';
import { moduleRegistry } from '../../modules/registry';
import { appBootstrap } from '../../shared/bootstrap/ApplicationBootstrap';
import path from 'path';
import fs from 'fs';
import 'colors';

const router = Router();

/**
 * GET /about.json
 * Retourne la liste des services disponibles et leurs actions/reactions
 */
router.get('/about.json', (req: Request, res: Response) => {
    try {
        if (!moduleRegistry.isInitialized())
            throw new Error('Application not initialized yet');
        const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
        const activeModules = moduleRegistry.getActiveModules();
        const services = activeModules.map(module => {
            const moduleInfo = module.getModuleInfo();
            return {
                name: moduleInfo.name,
                actions: moduleInfo.actions,
                reactions: moduleInfo.reactions
            };
        });

        res.json({
            client: { 
                host: clientIP 
            },
            server: { 
                current_time: Math.floor(Date.now() / 1000), 
                services: services 
            }
        });
        console.log(`[System] /about.json served with ${services.length} service(s)`.green);
    } catch (error) {
        console.error('[System] /about.json failed:'.red, error);
        res.status(500).json({
            error: 'Failed to load services',
            message: error instanceof Error ? error.message : 'Unknown error',
            client: { 
                host: req.ip || req.socket.remoteAddress || 'unknown' 
            },
            server: { 
                current_time: Math.floor(Date.now() / 1000), 
                services: [] 
            }
        });
    }
});

/**
 * GET /health
 * Health check de l'application
 */
router.get('/health', (req: Request, res: Response) => {
    try {
        const healthStatus = appBootstrap.getHealthStatus();
        const modulesCount = moduleRegistry.getAllModules().length;
        const isHealthy = 
            healthStatus.initialized &&
            healthStatus.services.database &&
            healthStatus.services.redis &&
            healthStatus.services.eventBus &&
            healthStatus.services.modules;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'OK' : 'DEGRADED',
            timestamp: new Date().toISOString(),
            service: 'area-backend',
            modules_loaded: modulesCount,
            services: healthStatus.services,
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('[System] Health check failed:'.red, error);
        
        res.status(503).json({
            status: 'DEGRADED',
            timestamp: new Date().toISOString(),
            service: 'area-backend',
            error: 'Health check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /download/apk
 * Télécharge l'APK de l'application mobile
 */
router.get('/download/apk', (req: Request, res: Response): void => {
    try {
        const apkPath = path.join(__dirname, '../../../public/app.apk');

        if (!fs.existsSync(apkPath)) {
            console.error('[System] APK file not found at:'.red, apkPath);
            res.status(404).json({error: 'APK file not found', message: 'Please ensure the APK file is placed in the public directory'});
            return;
        }
        console.log('[System] APK download requested from'.green, req.ip || 'unknown');
        res.download(apkPath, 'auto.apk', (err) => {
            if (err) {
                console.error('[System] APK download failed:'.red, err);
                if (!res.headersSent)
                    res.status(500).json({ error: 'Download failed' });
            } else
                console.log('[System] APK downloaded successfully'.green);
        });
    } catch (error) {
        console.error('[System] APK download error:'.red, error);
        res.status(500).json({error: 'Download failed', message: error instanceof Error ? error.message : 'Unknown error'});
    }
});

export default router;
