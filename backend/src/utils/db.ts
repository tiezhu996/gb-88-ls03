import mongoose from 'mongoose';
import MockAPI from '../models/MockAPI';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mock-api-db';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');

    // 同步索引：移除旧版本 (projectId, path, method) 唯一索引，允许同路径配置多份 Mock
    try {
      await MockAPI.syncIndexes();
    } catch (indexError) {
      console.warn('MockAPI index sync warning:', indexError);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}
