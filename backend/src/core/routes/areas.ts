import { Router } from 'express';
import { AreaController } from '../controllers/AreaController';
import { requireAuth } from '../middleware/auth';
import { validateIdParam } from '../middleware/urlParamValidation';

const router = Router();
const areaController = new AreaController();

router.use(requireAuth);

router
    .route('/')
    .post(areaController.createArea)
    .get(areaController.getAreas);

router
    .route('/:id')
    .all(validateIdParam())
    .get(areaController.getAreaById)
    .patch(areaController.updateArea)
    .delete(areaController.deleteArea);

router
    .route('/:id/toggle')
    .all(validateIdParam())
    .patch(areaController.toggleArea);

export default router;