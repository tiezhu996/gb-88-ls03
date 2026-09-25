import { Response } from 'express';
import RequestLog from '../models/RequestLog';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const getRequestLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const logs = await RequestLog.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await RequestLog.countDocuments({ projectId });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取请求日志失败' });
  }
};

export const clearRequestLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    await RequestLog.deleteMany({ projectId });

    res.json({ success: true, message: '清空日志成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '清空日志失败' });
  }
};
