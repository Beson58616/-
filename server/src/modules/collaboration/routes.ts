import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database/connection';
import { success, error, paginated, notFound } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ===================== 任务管理 =====================
router.get('/tasks', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', status, priority, assigneeId, creatorId, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
  if (assigneeId) { conditions.push('t.assignee_id = ?'); params.push(assigneeId); }
  if (creatorId) { conditions.push('t.creator_id = ?'); params.push(creatorId); }
  if (keyword) { conditions.push('t.title LIKE ?'); params.push(`%${keyword}%`); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM tasks t ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT t.*, u1.display_name as assignee_name, u2.display_name as creator_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    ${where}
    ORDER BY t.priority = 'urgent' DESC, t.priority = 'high' DESC, t.due_date ASC, t.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

router.post('/tasks', authenticate, (req: Request, res: Response) => {
  const { title, description, assigneeId, priority, dueDate, relatedType, relatedId } = req.body;
  if (!title) return error(res, '任务标题不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, assignee_id, creator_id, status, priority, due_date, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?)
  `).run(id, title, description || '', assigneeId || '', req.user!.userId, priority || 'medium', dueDate || '', relatedType || '', relatedId || '');

  // Notify assignee
  if (assigneeId) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_type, related_id)
      VALUES (?, ?, 'task', '新的任务分配', ?, 'task', ?)
    `).run(uuidv4(), assigneeId, `你有一个新任务：${title}`, id);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return success(res, task, '任务创建成功');
});

router.put('/tasks/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '任务不存在');

  const { title, description, assigneeId, status, priority, dueDate, relatedType, relatedId } = req.body;
  const completedAt = status === 'done' && existing.status !== 'done' ? new Date().toISOString() : existing.completed_at;

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, assignee_id = ?, status = ?, priority = ?, due_date = ?, related_type = ?, related_id = ?, completed_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || existing.title, description !== undefined ? description : existing.description,
    assigneeId !== undefined ? assigneeId : existing.assignee_id, status || existing.status,
    priority || existing.priority, dueDate !== undefined ? dueDate : existing.due_date,
    relatedType !== undefined ? relatedType : existing.related_type, relatedId !== undefined ? relatedId : existing.related_id,
    completedAt, req.params.id,
  );

  // Notify assignee if changed
  if (assigneeId && assigneeId !== existing.assignee_id) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_type, related_id)
      VALUES (?, ?, 'task', '任务已重新分配', ?, 'task', ?)
    `).run(uuidv4(), assigneeId, `任务"${existing.title}"已分配给你`, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  return success(res, updated, '任务更新成功');
});

router.delete('/tasks/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return notFound(res, '任务不存在');
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  return success(res, null, '任务已删除');
});

// ===================== 审批管理 =====================
router.get('/approvals', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) { conditions.push('a.status = ?'); params.push(status); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM approvals a ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT a.*, u1.display_name as requester_name, u2.display_name as approver_name
    FROM approvals a
    LEFT JOIN users u1 ON u1.id = a.requester_id
    LEFT JOIN users u2 ON u2.id = a.approver_id
    ${where}
    ORDER BY a.status = 'pending' DESC, a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

router.post('/approvals', authenticate, (req: Request, res: Response) => {
  const { title, contentType, contentId, approverId } = req.body;
  if (!title || !contentType || !contentId) return error(res, '标题、内容类型和内容ID不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO approvals (id, title, content_type, content_id, requester_id, approver_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, title, contentType, contentId, req.user!.userId, approverId || '');

  // Notify approver
  if (approverId) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_type, related_id)
      VALUES (?, ?, 'approval', '待审批', ?, 'approval', ?)
    `).run(uuidv4(), approverId, `${title} 需要你的审批`, id);
  }

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  return success(res, approval, '审批申请已提交');
});

router.put('/approvals/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '审批不存在');

  const { status, comment } = req.body;
  if (!status) return error(res, '审批状态不能为空');

  const approvedAt = status === 'approved' ? new Date().toISOString() : (existing.approved_at || '');

  db.prepare(`
    UPDATE approvals SET status = ?, comment = ?, approver_id = ?, approved_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, comment || '', req.user!.userId, approvedAt, req.params.id);

  // Notify requester
  const statusText = status === 'approved' ? '已通过' : '已拒绝';
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, related_type, related_id)
    VALUES (?, ?, 'approval', '审批结果', ?, 'approval', ?)
  `).run(uuidv4(), existing.requester_id, `"${existing.title}" 审批${statusText}${comment ? '：' + comment : ''}`, req.params.id);

  // If topic approval, update topic status
  if (existing.content_type === 'topic' && status === 'approved') {
    db.prepare("UPDATE topics SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(existing.content_id);
  } else if (existing.content_type === 'topic' && status === 'rejected') {
    db.prepare("UPDATE topics SET status = 'rejected', updated_at = datetime('now') WHERE id = ?").run(existing.content_id);
  }

  // If script approval, update script status
  if (existing.content_type === 'script' && status === 'approved') {
    db.prepare("UPDATE scripts SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(existing.content_id);
  } else if (existing.content_type === 'script' && status === 'rejected') {
    db.prepare("UPDATE scripts SET status = 'review', updated_at = datetime('now') WHERE id = ?").run(existing.content_id);
  }

  const updated = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  return success(res, updated, '审批已处理');
});

// ===================== 通知管理 =====================
router.get('/notifications', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', unread } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions = ['user_id = ?'];
  const params: any[] = [req.user!.userId];

  if (unread === 'true') { conditions.push('is_read = 0'); }

  const where = 'WHERE ' + conditions.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) as total FROM notifications ${where}`).get(...params) as any).total;
  const list = db.prepare(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

router.put('/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.userId);
  return success(res, null, '已标记为已读');
});

router.put('/notifications/read-all', authenticate, (req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .run(req.user!.userId);
  return success(res, null, '全部标记为已读');
});

// ===================== 复盘管理 =====================
router.get('/reviews', authenticate, (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', reviewType, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const conditions: string[] = [];
  const params: any[] = [];

  if (reviewType) { conditions.push('review_type = ?'); params.push(reviewType); }
  if (status) { conditions.push('status = ?'); params.push(status); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM reviews ${where}`).get(...params) as any).total;
  const list = db.prepare(`
    SELECT r.*, u.display_name as creator_name
    FROM reviews r
    LEFT JOIN users u ON u.id = r.created_by
    ${where}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  return paginated(res, list, total, Number(page), Number(pageSize));
});

router.post('/reviews', authenticate, (req: Request, res: Response) => {
  const { title, reviewType, contentId, summary, conclusion, actionItems } = req.body;
  if (!title) return error(res, '复盘标题不能为空');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, title, review_type, content_id, summary, conclusion, action_items, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, title, reviewType || 'content', contentId || '', summary || '', conclusion || '', actionItems ? JSON.stringify(actionItems) : '[]', req.user!.userId);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  return success(res, review, '复盘创建成功');
});

router.put('/reviews/:id', authenticate, (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id) as any;
  if (!existing) return notFound(res, '复盘不存在');

  const { title, summary, conclusion, actionItems, status } = req.body;
  db.prepare(`
    UPDATE reviews
    SET title = ?, summary = ?, conclusion = ?, action_items = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || existing.title, summary !== undefined ? summary : existing.summary,
    conclusion !== undefined ? conclusion : existing.conclusion,
    actionItems ? JSON.stringify(actionItems) : existing.action_items,
    status || existing.status, req.params.id,
  );

  const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  return success(res, updated, '复盘更新成功');
});

export default router;
