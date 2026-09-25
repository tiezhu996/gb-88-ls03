import { Response } from 'express';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目列表失败' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const project = await Project.findOne({ _id: id, userId });
    
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目失败' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    const project = await Project.create({
      name,
      description: description || '',
      baseUrl: `/mock`,
      userId
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建项目失败' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.id;

    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { name, description },
      { new: true, runValidators: true }
    );

    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新项目失败' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const project = await Project.findOneAndDelete({ _id: id, userId });

    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }

    res.json({ success: true, message: '删除项目成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除项目失败' });
  }
};
