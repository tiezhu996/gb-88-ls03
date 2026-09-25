import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db';
import { mockEngine } from './middleware/mockEngine';
import MockAPI from './models/MockAPI';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import mockApiRoutes from './routes/mockApiRoutes';
import requestLogRoutes from './routes/requestLogRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 全局挂载，由 mockEngine 内部正则识别 /mock/ 前缀请求；
// 不能用 app.use('/mock/*')，Express 4 会把匹配段挪到 req.baseUrl 导致 req.path 丢失
app.use(mockEngine);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/apis', mockApiRoutes);
app.use('/api/projects/:projectId/logs', requestLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Mock API Server is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

async function startServer() {
  try {
    await connectDB();
    // 同步索引：移除早期版本 projectId+path+method 的唯一索引，允许同路径配置多份 Mock
    try {
      await MockAPI.syncIndexes();
    } catch (indexError) {
      console.error('Failed to sync MockAPI indexes:', indexError);
    }
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
