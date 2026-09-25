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

    const apis = await MockAPI.find({ projectId }).sort({ createdAt: -1 });
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
    const { path, method, statusCode, responseBody, responseHeaders, delay, conditions } = req.body;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    const existingApi = await MockAPI.findOne({ projectId, path, method });
    if (existingApi) {
      res.status(400).json({ success: false, error: '该路径和方法的 API 已存在' });
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
    const { path, method, statusCode, responseBody, responseHeaders, delay, conditions } = req.body;

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
      { path, method, statusCode, responseBody, responseHeaders, delay, conditions },
      { new: true, runValidators: true }
    );

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
