import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import 'colors';

const router = Router();

const loadAvailableServices = () => {
    const services: any[] = [];
    const modulesPath = path.join(__dirname, '../../modules');

    try {
        if (!fs.existsSync(modulesPath))
            throw new Error(`Modules directory not found at ${modulesPath}`);
        const moduleDirectories = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        if (moduleDirectories.length === 0)
            throw new Error('No modules found in modules directory');
        for (const moduleName of moduleDirectories) {
            try {
                const configPath = path.join(modulesPath, moduleName, 'config');
                const moduleConfig = require(configPath);

                if (!moduleConfig || !moduleConfig.name) {
                    console.warn(`WARNING: Module ${moduleName} has invalid config (missing name)`.yellow);
                    continue;
                }
                services.push({
                    name: moduleConfig.name,
                    actions: moduleConfig.actions || [],
                    reactions: moduleConfig.reactions || []
                });
                console.log(`SUCCESS: Loaded module: ${moduleConfig.name}`.green);
            } catch (error) {
                console.error(`ERROR: Failed to load module ${moduleName}:`.red, error instanceof Error ? error.message : String(error));
            }
        }
        if (services.length === 0)
            throw new Error('No valid modules could be loaded');
        return services;
    } catch (error) {
        console.error('ERROR: Loading modules failed:'.red, error instanceof Error ? error.message : String(error));
        throw error;
    }
};

router.get('/about.json', (req: Request, res: Response) => {
    try {
        const clientIP = req.ip || 'Ip address not found';
        const availableServices = loadAvailableServices();

        res.json({
            client: {host: clientIP},
            server: {current_time: Math.floor(Date.now() / 1000), services: availableServices}
        });
    } catch (error) {
        console.error('ERROR: /about.json failed:'.red, error instanceof Error ? error.message : String(error));
        res.status(500).json({
            error: 'Failed to load services',
            message: error instanceof Error ? error.message : 'Unknown error',
            client: {host: req.ip || req.connection.remoteAddress || '127.0.0.1'},
            server: {current_time: Math.floor(Date.now() / 1000), services: []}
        });
    }
});

router.get('/health', (req: Request, res: Response) => {
    try {
        const servicesCount = loadAvailableServices().length;

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'area-backend',
            modules_loaded: servicesCount
        });
    } catch (error) {
        console.error('WARNING: Health check degraded:'.yellow, error instanceof Error ? error.message : String(error));
        res.status(503).json({
            status: 'DEGRADED',
            timestamp: new Date().toISOString(),
            service: 'area-backend',
            error: 'Modules loading failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
