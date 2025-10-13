import { Router } from 'express';
import { ConnectedServicesController } from '../controllers/ServiceController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const servicesController = new ConnectedServicesController();

router.get('/', servicesController.getAllServices);
router.get('/name/:name', servicesController.getServiceByName);

router.get('/connected', requireAuth, servicesController.getConnectedServices);
router.get('/:serviceName/status', requireAuth, servicesController.getServiceStatus);

router.get('/:id', servicesController.getServiceById);

export default router;
    