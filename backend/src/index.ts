import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db';
import { mockEngine } from './middleware/mockEngine';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import mockApiRoutes from './routes/mockApiRoutes';
import requestLogRoutes from './routes/requestLogRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/mock/*', mockEngine);

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
