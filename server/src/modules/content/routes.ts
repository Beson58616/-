import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database/connection';
import { success, error, paginated, notFound } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ===================== 选题管理 =====================

// GET /api/content/topics
router.get('/topics', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', status, priority, keyword, brandGoalId, assignedTo } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
  if (keyword) { conditions.push('(t.title LIKE ? OR t.tags LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  if (brandGoalId) { conditions.push('t.brand_goal_id = ?'); params.push(brandGoalId); }
  if (assignedTo) { conditions.push('t.assigned_to = ?'); params.push(assignedTo); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = (db.prepare(`SELECT COUNT(*) as total FROM topics t ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT t.*,
      u.display_name as creator_name,
      a.display_name as assignee_name,
      bg.title as brand_goal_title
    FROM topics t
    LEFT JOIN users u ON u.id = t.created_by
    LEFT JOIN users a ON a.id = t.assigned_to
    LEFT JOIN brand_goals bg ON bg.id = t.brand_goal_id
    ${where}
    ORDER BY t.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

// POST /api/content/topics
router.post('/topics', authenticate, (req: Request, res: Response) => {
  const { title, description, priority, brandGoalId, assignedTo, tags } = req.body;
  if (!title) return error(res, '选题标题不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO topics (id, title, description, status, priority, brand_goal_id, created_by, assigned_to, tags)
    VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)
  `).run(id, title, description || '', priority || 'medium', brandGoalId || '', req.user!.userId, assignedTo || '', tags || '');

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  return success(res, topic, '选题创建成功');
});

// GET /api/content/topics/:id
router.get('/topics/:id', authenticate, (req: Request, res: Response) => {
  const topic = db.prepare(`
    SELECT t.*, u.display_name as creator_name, a.display_name as assignee_name
    FROM topics t
    LEFT JOIN users u ON u.id = t.created_by
    LEFT JOIN users a ON a.id = t.assigned_to
    WHERE t.id = ?
  `).get(req.params.id);
  if (!topic) return notFound(res, '选题不存在');
  return success(res, topic);
});

// PUT /api/content/topics/:id
router.put('/topics/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '选题不存在');

  const { title, description, status, priority, brandGoalId, assignedTo, tags } = req.body;
  db.prepare(`
    UPDATE topics SET title = ?, description = ?, status = ?, priority = ?, brand_goal_id = ?, assigned_to = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || (existing as any).title,
    description !== undefined ? description : (existing as any).description,
    status || (existing as any).status,
    priority || (existing as any).priority,
    brandGoalId !== undefined ? brandGoalId : (existing as any).brand_goal_id,
    assignedTo !== undefined ? assignedTo : (existing as any).assigned_to,
    tags !== undefined ? tags : (existing as any).tags,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  return success(res, updated, '选题更新成功');
});

// DELETE /api/content/topics/:id
router.delete('/topics/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '选题不存在');

  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
  return success(res, null, '选题已删除');
});

// ===================== 脚本管理 =====================

// GET /api/content/scripts
router.get('/scripts', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', topicId, status, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (topicId) { conditions.push('s.topic_id = ?'); params.push(topicId); }
  if (status) { conditions.push('s.status = ?'); params.push(status); }
  if (keyword) { conditions.push('s.title LIKE ?'); params.push(`%${keyword}%`); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM scripts s ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT s.*, t.title as topic_title, u.display_name as author_name
    FROM scripts s
    LEFT JOIN topics t ON t.id = s.topic_id
    LEFT JOIN users u ON u.id = s.author_id
    ${where}
    ORDER BY s.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

// POST /api/content/scripts
router.post('/scripts', authenticate, (req: Request, res: Response) => {
  const { topicId, title, content } = req.body;
  if (!title) return error(res, '脚本标题不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO scripts (id, topic_id, title, content, version, status, author_id)
    VALUES (?, ?, ?, ?, 1, 'draft', ?)
  `).run(id, topicId || '', title, content || '', req.user!.userId);

  // Save initial version
  db.prepare('INSERT INTO script_versions (id, script_id, content, version, created_by) VALUES (?, ?, ?, 1, ?)')
    .run(uuidv4(), id, content || '', req.user!.userId);

  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
  return success(res, script, '脚本创建成功');
});

// GET /api/content/scripts/:id
router.get('/scripts/:id', authenticate, (req: Request, res: Response) => {
  const script = db.prepare(`
    SELECT s.*, t.title as topic_title, u.display_name as author_name
    FROM scripts s
    LEFT JOIN topics t ON t.id = s.topic_id
    LEFT JOIN users u ON u.id = s.author_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!script) return notFound(res, '脚本不存在');

  const versions = db.prepare('SELECT * FROM script_versions WHERE script_id = ? ORDER BY version DESC').all(req.params.id);
  return success(res, { ...(script as any), versions });
});

// PUT /api/content/scripts/:id
router.put('/scripts/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '脚本不存在');

  const { topicId, title, content, status } = req.body;
  const newVersion = content && content !== existing.content ? existing.version + 1 : existing.version;

  db.prepare(`
    UPDATE scripts SET topic_id = ?, title = ?, content = ?, version = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    topicId !== undefined ? topicId : existing.topic_id,
    title || existing.title,
    content !== undefined ? content : existing.content,
    newVersion,
    status || existing.status,
    req.params.id,
  );

  // Save version if content changed
  if (content && content !== existing.content) {
    db.prepare('INSERT INTO script_versions (id, script_id, content, version, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), req.params.id, content, newVersion, req.user!.userId);
  }

  const updated = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
  return success(res, updated, '脚本更新成功');
});

// DELETE /api/content/scripts/:id
router.delete('/scripts/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '脚本不存在');
  db.prepare('DELETE FROM scripts WHERE id = ?').run(req.params.id);
  return success(res, null, '脚本已删除');
});

// ===================== 素材管理 =====================

// GET /api/content/assets
router.get('/assets', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', type, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (keyword) { conditions.push('(name LIKE ? OR tags LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM assets ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT a.*, u.display_name as creator_name
    FROM assets a
    LEFT JOIN users u ON u.id = a.created_by
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

// POST /api/content/assets
router.post('/assets', authenticate, (req: Request, res: Response) => {
  const { type, name, url, metadata, tags } = req.body;
  if (!name) return error(res, '素材名称不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO assets (id, type, name, url, metadata, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type || 'other', name, url || '', metadata ? JSON.stringify(metadata) : '{}', tags || '', req.user!.userId);

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  return success(res, asset, '素材上传成功');
});

// PUT /api/content/assets/:id
router.put('/assets/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '素材不存在');

  const { type, name, url, metadata, tags } = req.body;
  db.prepare(`
    UPDATE assets SET type = ?, name = ?, url = ?, metadata = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    type || existing.type, name || existing.name, url !== undefined ? url : existing.url,
    metadata ? JSON.stringify(metadata) : existing.metadata, tags !== undefined ? tags : existing.tags,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  return success(res, updated, '素材更新成功');
});

// DELETE /api/content/assets/:id
router.delete('/assets/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '素材不存在');
  db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
  return success(res, null, '素材已删除');
});

// ===================== 内容排期与发布 =====================

// GET /api/content/plans
router.get('/plans', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '50', platform, status, startDate, endDate } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (platform) { conditions.push('cp.platform = ?'); params.push(platform); }
  if (status) { conditions.push('cp.status = ?'); params.push(status); }
  if (startDate) { conditions.push('cp.scheduled_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('cp.scheduled_at <= ?'); params.push(endDate + ' 23:59:59'); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM content_plans cp ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT cp.*, t.title as topic_title, s.title as script_title, u.display_name as creator_name
    FROM content_plans cp
    LEFT JOIN topics t ON t.id = cp.topic_id
    LEFT JOIN scripts s ON s.id = cp.script_id
    LEFT JOIN users u ON u.id = cp.created_by
    ${where}
    ORDER BY cp.scheduled_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

// POST /api/content/plans
router.post('/plans', authenticate, (req: Request, res: Response) => {
  const { topicId, scriptId, title, platform, scheduledAt, notes } = req.body;
  if (!title || !platform) return error(res, '标题和发布平台不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO content_plans (id, topic_id, script_id, title, platform, scheduled_at, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'planned', ?, ?)
  `).run(id, topicId || '', scriptId || '', title, platform, scheduledAt || '', notes || '', req.user!.userId);

  const plan = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(id);
  return success(res, plan, '排期创建成功');
});

// PUT /api/content/plans/:id
router.put('/plans/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '排期不存在');

  const { topicId, scriptId, title, platform, scheduledAt, status, notes } = req.body;
  db.prepare(`
    UPDATE content_plans
    SET topic_id = ?, script_id = ?, title = ?, platform = ?, scheduled_at = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    topicId !== undefined ? topicId : existing.topic_id,
    scriptId !== undefined ? scriptId : existing.script_id,
    title || existing.title,
    platform || existing.platform,
    scheduledAt !== undefined ? scheduledAt : existing.scheduled_at,
    status || existing.status,
    notes !== undefined ? notes : existing.notes,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(req.params.id);
  return success(res, updated, '排期更新成功');
});

// DELETE /api/content/plans/:id
router.delete('/plans/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '排期不存在');
  db.prepare('DELETE FROM content_plans WHERE id = ?').run(req.params.id);
  return success(res, null, '排期已删除');
});

// POST /api/content/plans/:id/publish - 执行发布
router.post('/plans/:id/publish', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '排期不存在');

  const { publishedUrl } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE content_plans SET status = 'published', published_at = ?, published_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(now, publishedUrl || '', req.params.id);

  // Create publish log
  db.prepare(`
    INSERT INTO publish_logs (id, content_plan_id, status, message, platform, published_url)
    VALUES (?, ?, 'success', '发布成功', ?, ?)
  `).run(uuidv4(), req.params.id, existing.platform, publishedUrl || '');

  // Create notification for the creator
  const notifyMsg = `"${existing.title || ''}" 已成功发布到 ${existing.platform || ''}`;
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), existing.created_by || '', 'system', '内容已发布', notifyMsg, 'content_plan', req.params.id);

  const updated = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(req.params.id);
  return success(res, updated, '发布成功');
});

export default router;
