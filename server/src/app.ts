import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './database/schema';

// Initialize database tables
initializeDatabase();

// Import routes
import authRoutes from './modules/auth/routes';
import contentRoutes from './modules/content/routes';
import dataRoutes from './modules/data/routes';
import collaborationRoutes from './modules/collaboration/routes';
import strategyRoutes from './modules/strategy/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/collab', collaborationRoutes);
app.use('/api/strategy', strategyRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({ code: 404, message: 'API 接口不存在' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`\n🚀 新媒体经营中台 API Server 已启动`);
  console.log(`   📡 地址: http://localhost:${PORT}`);
  console.log(`   📖 API 文档: http://localhost:${PORT}/api/health`);
  console.log(`   🔑 测试账号: admin / 123456\n`);
});

export default app;
