import { Router } from 'express';
import { getRequestLogs, clearRequestLogs } from '../controllers/requestLogController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, getRequestLogs);
router.delete('/', authMiddleware, clearRequestLogs);

export default router;
