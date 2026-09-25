import { Router } from 'express';
import {
  getMockAPIs,
  getMockAPIById,
  createMockAPI,
  updateMockAPI,
  deleteMockAPI
} from '../controllers/mockApiController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, getMockAPIs);
router.get('/:id', authMiddleware, getMockAPIById);
router.post('/', authMiddleware, createMockAPI);
router.put('/:id', authMiddleware, updateMockAPI);
router.delete('/:id', authMiddleware, deleteMockAPI);

export default router;
