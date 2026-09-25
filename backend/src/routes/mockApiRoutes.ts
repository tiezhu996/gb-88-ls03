import { Router } from 'express';
import {
  getMockAPIs,
  getMockAPIById,
  createMockAPI,
  updateMockAPI,
  toggleMockAPI,
  deleteMockAPI
} from '../controllers/mockApiController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, getMockAPIs);
router.get('/:id', authMiddleware, getMockAPIById);
router.post('/', authMiddleware, createMockAPI);
router.put('/:id', authMiddleware, updateMockAPI);
router.patch('/:id/toggle', authMiddleware, toggleMockAPI);
router.delete('/:id', authMiddleware, deleteMockAPI);

export default router;
