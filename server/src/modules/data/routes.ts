import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database/connection';
import { success, error, paginated, notFound } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ===================== 数据源管理 =====================
router.get('/sources', authenticate, (req: Request, res: Response) => {
  const list = db.prepare('SELECT * FROM data_sources ORDER BY created_at DESC').all();
  return success(res, list);
});

router.post('/sources', authenticate, (req: Request, res: Response) => {
  const { name, type, platform, config, isActive } = req.body;
  if (!name) return error(res, '数据源名称不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO data_sources (id, name, type, platform, config, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type || 'api', platform || '', config ? JSON.stringify(config) : '{}', isActive !== false ? 1 : 0, req.user!.userId);

  const source = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(id);
  return success(res, source, '数据源创建成功');
});

router.put('/sources/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '数据源不存在');

  const { name, type, platform, config, isActive } = req.body;
  db.prepare(`
    UPDATE data_sources SET name = ?, type = ?, platform = ?, config = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name, type || existing.type, platform !== undefined ? platform : existing.platform,
    config ? JSON.stringify(config) : existing.config, isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(req.params.id);
  return success(res, updated, '数据源更新成功');
});

router.delete('/sources/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '数据源不存在');
  db.prepare('DELETE FROM data_sources WHERE id = ?').run(req.params.id);
  return success(res, null, '数据源已删除');
});

// ===================== 看板管理 =====================
router.get('/dashboards', authenticate, (req: Request, res: Response) => {
  const list = db.prepare('SELECT * FROM dashboards ORDER BY is_default DESC, created_at DESC').all();
  return success(res, list);
});

router.post('/dashboards', authenticate, (req: Request, res: Response) => {
  const { name, type, config } = req.body;
  if (!name) return error(res, '看板名称不能为空');

  const id = uuidv4();
  db.prepare('INSERT INTO dashboards (id, name, type, config, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, type || 'content', config ? JSON.stringify(config) : '{}', req.user!.userId);

  const dashboard = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(id);
  return success(res, dashboard, '看板创建成功');
});

// ===================== 指标数据 =====================
router.get('/metrics', authenticate, (req: Request, res: Response) => {
  const { dashboardId, platform, metricKey, startDate, endDate } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];

  if (dashboardId) { conditions.push('dashboard_id = ?'); params.push(dashboardId); }
  if (platform) { conditions.push('platform = ?'); params.push(platform); }
  if (metricKey) { conditions.push('metric_key = ?'); params.push(metricKey); }
  if (startDate) { conditions.push('recorded_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('recorded_at <= ?'); params.push(endDate + ' 23:59:59'); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const list = db.prepare(`SELECT * FROM metrics ${where} ORDER BY recorded_at DESC LIMIT 200`).all(...params);
  return success(res, list);
});

// GET /api/data/dashboard-overview - 首页总览数据
router.get('/dashboard-overview', authenticate, (req: Request, res: Response) => {
  // Today stats
  const today = new Date().toISOString().split('T')[0];

  // Total topics
  const totalTopics = (db.prepare('SELECT COUNT(*) as count FROM topics').get() as any).count;
  const activeTopics = (db.prepare("SELECT COUNT(*) as count FROM topics WHERE status IN ('in_progress','approved')").get() as any).count;

  // Total scripts
  const totalScripts = (db.prepare('SELECT COUNT(*) as count FROM scripts').get() as any).count;
  const publishedScripts = (db.prepare("SELECT COUNT(*) as count FROM scripts WHERE status = 'published'").get() as any).count;

  // Today's plans
  const todayPlans = db.prepare(`
    SELECT cp.*, t.title as topic_title, ch.name as channel_name
    FROM content_plans cp
    LEFT JOIN topics t ON t.id = cp.topic_id
    LEFT JOIN channels ch ON ch.platform = cp.platform
    WHERE cp.scheduled_at LIKE ?
    ORDER BY cp.scheduled_at ASC
  `).all(`${today}%`);

  // Pending approvals
  const pendingApprovals = (db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'").get() as any).count;

  // Pending tasks
  const pendingTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('todo','in_progress')").get() as any).count;

  // Platform metrics summary (latest per platform)
  const platformMetrics = db.prepare(`
    SELECT platform,
      SUM(CASE WHEN metric_key = 'impression' THEN value ELSE 0 END) as impressions,
      SUM(CASE WHEN metric_key = 'engagement' THEN value ELSE 0 END) as engagements,
      SUM(CASE WHEN metric_key = 'share' THEN value ELSE 0 END) as shares
    FROM metrics
    WHERE recorded_at >= date('now', '-7 days')
    GROUP BY platform
    ORDER BY impressions DESC
  `).all();

  // Conversion summary
  const conversionSummary = db.prepare(`
    SELECT platform, SUM(visit_count) as visits, SUM(conversion_count) as conversions, AVG(rate) as avgRate, SUM(revenue) as totalRevenue
    FROM conversions
    GROUP BY platform
  `).all();

  // Brand goals progress
  const brandGoals = db.prepare("SELECT * FROM brand_goals WHERE status = 'active' ORDER BY progress DESC").all();

  // Recent tasks
  const recentTasks = db.prepare(`
    SELECT t.*, u.display_name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    ORDER BY t.updated_at DESC LIMIT 10
  `).all();

  // Recent notifications
  const recentNotifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.user!.userId);

  return success(res, {
    stats: {
      totalTopics, activeTopics, totalScripts, publishedScripts,
      pendingApprovals, pendingTasks,
    },
    todayPlans,
    platformMetrics,
    conversionSummary,
    brandGoals,
    recentTasks,
    recentNotifications,
  });
});

// ===================== 转化数据 =====================
router.get('/conversions', authenticate, (req: Request, res: Response) => {
  const { platform } = req.query;
  let query = 'SELECT * FROM conversions';
  const params: any[] = [];
  if (platform) { query += ' WHERE platform = ?'; params.push(platform); }
  query += ' ORDER BY recorded_at DESC LIMIT 100';
  const list = db.prepare(query).all(...params);
  return success(res, list);
});

router.post('/conversions', authenticate, (req: Request, res: Response) => {
  const { name, source, target, visitCount, conversionCount, rate, revenue, platform } = req.body;
  if (!name) return error(res, '名称不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO conversions (id, name, source, target, visit_count, conversion_count, rate, revenue, platform)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, source || '', target || '', visitCount || 0, conversionCount || 0, rate || 0, revenue || 0, platform || '');

  const conversion = db.prepare('SELECT * FROM conversions WHERE id = ?').get(id);
  return success(res, conversion, '转化数据创建成功');
});

// ===================== 全局搜索 =====================
router.get('/search', authenticate, (req: Request, res: Response) => {
  const { keyword } = req.query;
  if (!keyword) return error(res, '搜索关键词不能为空');

  const kw = `%${keyword}%`;

  const topics = db.prepare('SELECT id, title, status, "topic" as type FROM topics WHERE title LIKE ? LIMIT 5').all(kw);
  const scripts = db.prepare('SELECT id, title, status, "script" as type FROM scripts WHERE title LIKE ? LIMIT 5').all(kw);
  const assets = db.prepare('SELECT id, name as title, type as status_type, "asset" as type FROM assets WHERE name LIKE ? LIMIT 5').all(kw);
  const tasks = db.prepare('SELECT id, title, status, "task" as type FROM tasks WHERE title LIKE ? LIMIT 5').all(kw);

  return success(res, { topics, scripts, assets, tasks });
});

export default router;
