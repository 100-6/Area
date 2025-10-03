import { Router } from 'express';
import { WorkflowController } from '../controllers/WorkflowController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const workflowController = new WorkflowController();

router.use(requireAuth);

router.get('/:areaId', workflowController.getWorkflow);

router
    .route('/:areaId/nodes')
    .post(workflowController.createNode);

router
    .route('/nodes/:nodeId')
    .patch(workflowController.updateNode)
    .delete(workflowController.deleteNode);

router
    .route('/:areaId/connections')
    .post(workflowController.createConnection);

router.delete('/connections/:connectionId', workflowController.deleteConnection);

export default router;
