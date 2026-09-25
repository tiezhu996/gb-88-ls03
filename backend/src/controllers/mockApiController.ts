import { Response } from 'express';
import MockAPI from '../models/MockAPI';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const getMockAPIs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    // 与 Mock 引擎的命中顺序一致：优先级大的在前，相同优先级按创建时间早的在前
    const apis = await MockAPI.find({ projectId }).sort({ priority: -1, createdAt: 1 });
    res.json({ success: true, data: apis });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 API 列表失败' });
  }
};

export const getMockAPIById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const api = await MockAPI.findById(id);
    if (!api) {
      res.status(404).json({ success: false, error: 'API 不存在' });
      return;
    }

    const project = await Project.findOne({ _id: api.projectId, userId });
    if (!project) {
      res.status(403).json({ success: false, error: '无权限访问' });
      return;
    }

    res.json({ success: true, data: api });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 API 失败' });
  }
};

export const createMockAPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const {
      name,
      path,
      method,
      priority,
      enabled,
      statusCode,
      responseBody,
      responseHeaders,
      delay,
      conditions
    } = req.body;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    // 同一路径允许配置多份 Mock，通过优先级和启用开关决定命中哪一份
    const api = await MockAPI.create({
      projectId,
      name: name || '',
      path,
      method,
      priority: typeof priority === 'number' ? priority : 0,
      enabled: typeof enabled === 'boolean' ? enabled : true,
      statusCode: statusCode || 200,
      responseBody: responseBody || '{}',
      responseHeaders: responseHeaders || {},
      delay: delay || 0,
      conditions: conditions || []
    });

    res.status(201).json({ success: true, data: api });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建 API 失败' });
  }
};

export const updateMockAPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      name,
      path,
      method,
      priority,
      enabled,
      statusCode,
      responseBody,
      responseHeaders,
      delay,
      conditions
    } = req.body;

    const api = await MockAPI.findById(id);
    if (!api) {
      res.status(404).json({ success: false, error: 'API 不存在' });
      return;
    }

    const project = await Project.findOne({ _id: api.projectId, userId });
    if (!project) {
      res.status(403).json({ success: false, error: '无权限访问' });
      return;
    }

    const updatedApi = await MockAPI.findByIdAndUpdate(
      id,
      {
        name,
        path,
        method,
        priority,
        enabled,
        statusCode,
        responseBody,
        responseHeaders,
        delay,
        conditions
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedApi });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 API 失败' });
  }
};

// 列表页快速开关启用状态、调整优先级使用
export const patchMockAPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { enabled, priority, name } = req.body;

    const api = await MockAPI.findById(id);
    if (!api) {
      res.status(404).json({ success: false, error: 'API 不存在' });
      return;
    }

    const project = await Project.findOne({ _id: api.projectId, userId });
    if (!project) {
      res.status(403).json({ success: false, error: '无权限访问' });
      return;
    }

    const update: { enabled?: boolean; priority?: number; name?: string } = {};
    if (typeof enabled === 'boolean') {
      update.enabled = enabled;
    }
    if (priority !== undefined) {
      const num = Number(priority);
      if (!Number.isFinite(num)) {
        res.status(400).json({ success: false, error: '优先级必须是数字' });
        return;
      }
      update.priority = num;
    }
    if (typeof name === 'string') {
      update.name = name;
    }

    const updatedApi = await MockAPI.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    res.json({ success: true, data: updatedApi });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 API 失败' });
  }
};

export const deleteMockAPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const api = await MockAPI.findById(id);
    if (!api) {
      res.status(404).json({ success: false, error: 'API 不存在' });
      return;
    }

    const project = await Project.findOne({ _id: api.projectId, userId });
    if (!project) {
      res.status(403).json({ success: false, error: '无权限访问' });
      return;
    }

    await MockAPI.findByIdAndDelete(id);
    res.json({ success: true, message: '删除 API 成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除 API 失败' });
  }
};
