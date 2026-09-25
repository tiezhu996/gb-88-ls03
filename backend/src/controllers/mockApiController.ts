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
    const { path, method, statusCode, responseBody, responseHeaders, delay, conditions, priority, enabled } = req.body;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    const api = await MockAPI.create({
      projectId,
      path,
      method,
      statusCode: statusCode || 200,
      responseBody: responseBody || '{}',
      responseHeaders: responseHeaders || {},
      delay: delay || 0,
      conditions: conditions || [],
      priority: typeof priority === 'number' ? priority : 0,
      enabled: typeof enabled === 'boolean' ? enabled : true
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
    const { path, method, statusCode, responseBody, responseHeaders, delay, conditions, priority, enabled } = req.body;

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
      { path, method, statusCode, responseBody, responseHeaders, delay, conditions, priority, enabled },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedApi });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 API 失败' });
  }
};

export const toggleMockAPI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'enabled 必须为布尔值' });
      return;
    }

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

    api.enabled = enabled;
    await api.save();

    res.json({ success: true, data: api });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 API 状态失败' });
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
