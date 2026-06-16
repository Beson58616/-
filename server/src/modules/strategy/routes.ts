import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database/connection';
import { success, error, paginated, notFound } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ===================== 品牌目标管理 =====================
router.get('/brand-goals', authenticate, (req: Request, res: Response) => {
  const { status } = req.query;
  let query = 'SELECT bg.*, u.display_name as creator_name FROM brand_goals bg LEFT JOIN users u ON u.id = bg.created_by';
  const params: any[] = [];

  if (status) { query += ' WHERE bg.status = ?'; params.push(status); }
  query += ' ORDER BY bg.created_at DESC';

  const list = db.prepare(query).all(...params);
  return success(res, list);
});

router.post('/brand-goals', authenticate, (req: Request, res: Response) => {
  const { title, objective, okrKeyResults, timeFrame, progress } = req.body;
  if (!title) return error(res, '品牌目标标题不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO brand_goals (id, title, objective, okr_key_results, time_frame, progress, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(id, title, objective || '', okrKeyResults ? JSON.stringify(okrKeyResults) : '', timeFrame || '', progress || 0, req.user!.userId);

  const goal = db.prepare('SELECT * FROM brand_goals WHERE id = ?').get(id);
  return success(res, goal, '品牌目标创建成功');
});

router.put('/brand-goals/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM brand_goals WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '品牌目标不存在');

  const { title, objective, okrKeyResults, timeFrame, status, progress } = req.body;
  db.prepare(`
    UPDATE brand_goals
    SET title = ?, objective = ?, okr_key_results = ?, time_frame = ?, status = ?, progress = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || existing.title, objective !== undefined ? objective : existing.objective,
    okrKeyResults ? JSON.stringify(okrKeyResults) : existing.okr_key_results,
    timeFrame !== undefined ? timeFrame : existing.time_frame,
    status || existing.status, progress !== undefined ? progress : existing.progress,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM brand_goals WHERE id = ?').get(req.params.id);
  return success(res, updated, '品牌目标更新成功');
});

router.delete('/brand-goals/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM brand_goals WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '品牌目标不存在');
  db.prepare('DELETE FROM brand_goals WHERE id = ?').run(req.params.id);
  return success(res, null, '品牌目标已删除');
});

// ===================== 渠道管理 =====================
router.get('/channels', authenticate, (req: Request, res: Response) => {
  const { platform, status } = req.query;
  let query = 'SELECT * FROM channels WHERE 1=1';
  const params: any[] = [];
  if (platform) { query += ' AND platform = ?'; params.push(platform); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY followers DESC';

  const list = db.prepare(query).all(...params);
  return success(res, list);
});

router.post('/channels', authenticate, (req: Request, res: Response) => {
  const { name, platform, accountName, accountId, followers, description } = req.body;
  if (!name || !platform) return error(res, '渠道名称和平台不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO channels (id, name, platform, account_name, account_id, followers, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(id, name, platform, accountName || '', accountId || '', followers || 0, description || '');

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  return success(res, channel, '渠道创建成功');
});

router.put('/channels/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '渠道不存在');

  const { name, platform, accountName, accountId, followers, description, status } = req.body;
  db.prepare(`
    UPDATE channels
    SET name = ?, platform = ?, account_name = ?, account_id = ?, followers = ?, description = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name, platform || existing.platform,
    accountName !== undefined ? accountName : existing.account_name,
    accountId !== undefined ? accountId : existing.account_id,
    followers !== undefined ? followers : existing.followers,
    description !== undefined ? description : existing.description,
    status || existing.status, req.params.id,
  );

  const updated = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  return success(res, updated, '渠道更新成功');
});

// ===================== 栏目管理 =====================
router.get('/columns', authenticate, (req: Request, res: Response) => {
  const { channelId } = req.query;
  let query = 'SELECT c.*, ch.name as channel_name, ch.platform FROM columns_table c LEFT JOIN channels ch ON ch.id = c.channel_id WHERE 1=1';
  const params: any[] = [];
  if (channelId) { query += ' AND c.channel_id = ?'; params.push(channelId); }
  query += ' ORDER BY c.sort_order ASC';

  const list = db.prepare(query).all(...params);
  return success(res, list);
});

router.post('/columns', authenticate, (req: Request, res: Response) => {
  const { name, description, channelId, sortOrder } = req.body;
  if (!name) return error(res, '栏目名称不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO columns_table (id, name, description, channel_id, sort_order, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(id, name, description || '', channelId || '', sortOrder || 0);

  const column = db.prepare('SELECT * FROM columns_table WHERE id = ?').get(id);
  return success(res, column, '栏目创建成功');
});

router.put('/columns/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM columns_table WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '栏目不存在');

  const { name, description, channelId, status, sortOrder } = req.body;
  db.prepare(`
    UPDATE columns_table
    SET name = ?, description = ?, channel_id = ?, status = ?, sort_order = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name, description !== undefined ? description : existing.description,
    channelId !== undefined ? channelId : existing.channel_id,
    status || existing.status, sortOrder !== undefined ? sortOrder : existing.sort_order,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM columns_table WHERE id = ?').get(req.params.id);
  return success(res, updated, '栏目更新成功');
});

// ===================== 月度复盘 =====================
router.get('/monthly-reviews', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', period } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (period) { conditions.push('period = ?'); params.push(period); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM monthly_reviews ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT mr.*, u.display_name as creator_name
    FROM monthly_reviews mr
    LEFT JOIN users u ON u.id = mr.created_by
    ${where}
    ORDER BY mr.period DESC LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

router.post('/monthly-reviews', authenticate, (req: Request, res: Response) => {
  const { title, period, summary, content, conclusion, actionItems } = req.body;
  if (!title || !period) return error(res, '复盘标题和周期不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO monthly_reviews (id, title, period, summary, content, conclusion, action_items, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, title, period, summary || '', content || '', conclusion || '', actionItems ? JSON.stringify(actionItems) : '[]', req.user!.userId);

  const review = db.prepare('SELECT * FROM monthly_reviews WHERE id = ?').get(id);
  return success(res, review, '月度复盘创建成功');
});

router.put('/monthly-reviews/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM monthly_reviews WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '月度复盘不存在');

  const { title, summary, content, conclusion, actionItems, status } = req.body;
  db.prepare(`
    UPDATE monthly_reviews
    SET title = ?, summary = ?, content = ?, conclusion = ?, action_items = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || existing.title, summary !== undefined ? summary : existing.summary,
    content !== undefined ? content : existing.content,
    conclusion !== undefined ? conclusion : existing.conclusion,
    actionItems ? JSON.stringify(actionItems) : existing.action_items,
    status || existing.status, req.params.id,
  );

  const updated = db.prepare('SELECT * FROM monthly_reviews WHERE id = ?').get(req.params.id);
  return success(res, updated, '月度复盘更新成功');
});

// ===================== 策略管理 =====================
router.get('/strategies', authenticate, (req: Request, res: Response) => {
  const { type, status } = req.query;
  let query = 'SELECT s.*, bg.title as goal_title, u.display_name as creator_name FROM strategies s LEFT JOIN brand_goals bg ON bg.id = s.brand_goal_id LEFT JOIN users u ON u.id = s.created_by WHERE 1=1';
  const params: any[] = [];

  if (type) { query += ' AND s.type = ?'; params.push(type); }
  if (status) { query += ' AND s.status = ?'; params.push(status); }
  query += ' ORDER BY s.created_at DESC';

  const list = db.prepare(query).all(...params);
  return success(res, list);
});

router.post('/strategies', authenticate, (req: Request, res: Response) => {
  const { name, type, content, brandGoalId } = req.body;
  if (!name) return error(res, '策略名称不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO strategies (id, name, type, content, brand_goal_id, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, name, type || 'brand', content || '', brandGoalId || '', req.user!.userId);

  const strategy = db.prepare('SELECT * FROM strategies WHERE id = ?').get(id);
  return success(res, strategy, '策略创建成功');
});

router.put('/strategies/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM strategies WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '策略不存在');

  const { name, type, content, brandGoalId, status } = req.body;
  db.prepare(`
    UPDATE strategies
    SET name = ?, type = ?, content = ?, brand_goal_id = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name, type || existing.type,
    content !== undefined ? content : existing.content,
    brandGoalId !== undefined ? brandGoalId : existing.brand_goal_id,
    status || existing.status, req.params.id,
  );

  const updated = db.prepare('SELECT * FROM strategies WHERE id = ?').get(req.params.id);
  return success(res, updated, '策略更新成功');
});

export default router;
