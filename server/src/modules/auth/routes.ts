import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database/connection';
import { signToken, verifyRefreshToken } from '../../utils/jwt';
import { success, error, unauthorized } from '../../utils/response';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return error(res, '用户名和密码不能为空');
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
  if (!user) {
    return error(res, '用户名或密码错误', 1, 401);
  }

  if (user.status !== 'active') {
    return error(res, '账号已被禁用', 1, 403);
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return error(res, '用户名或密码错误', 1, 401);
  }

  // Get user roles
  const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `).all(user.id) as { name: string }[];

  const roleNames = roles.map(r => r.name);
  const tokens = signToken({ userId: user.id, username: user.username, roles: roleNames });

  // Record audit log
  const { v4: uuid } = require('uuid');
  db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, resource_id, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuid(), user.id, 'login', 'auth', user.id, '用户登录', req.ip || '');

  return success(res, {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar,
      department: user.department,
      roles: roleNames,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return error(res, '缺少刷新令牌');
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return unauthorized(res, '刷新令牌无效或已过期');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;
  if (!user || user.status !== 'active') {
    return unauthorized(res, '用户不存在或已禁用');
  }

  const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `).all(user.id) as { name: string }[];

  const tokens = signToken({ userId: user.id, username: user.username, roles: roles.map(r => r.name) });

  return success(res, {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authenticate, (req: Request, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) {
    return unauthorized(res, '用户不存在');
  }

  const roles = db.prepare(`
    SELECT r.name, r.description FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `).all(user.id) as any[];

  const permissions = db.prepare(`
    SELECT DISTINCT p.resource, p.action FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
  `).all(user.id) as any[];

  return success(res, {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar,
    department: user.department,
    phone: user.phone,
    roles,
    permissions,
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: Request, res: Response) => {
  const { v4: uuid } = require('uuid');
  db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, resource_id, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuid(), req.user!.userId, 'logout', 'auth', req.user!.userId, '用户登出', req.ip || '');
  return success(res, null, '已登出');
});

// ===== 用户管理 (管理员) =====
router.get('/users', authenticate, requirePermission('user', 'manage'), (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', keyword = '' } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let query = 'SELECT id, username, email, display_name, avatar, department, phone, status, created_at FROM users WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params: any[] = [];

  if (keyword) {
    const kw = `%${keyword}%`;
    query += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ? OR department LIKE ?)';
    countQuery += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ? OR department LIKE ?)';
    params.push(kw, kw, kw, kw);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const total = (db.prepare(countQuery).get(...params) as any).total;
  const list = db.prepare(query).all(...params, Number(pageSize), offset);

  return res.json({ code: 0, message: 'success', data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
});

// GET /api/auth/permissions
router.get('/permissions', authenticate, (req: Request, res: Response) => {
  const permissions = db.prepare('SELECT * FROM permissions ORDER BY resource, action').all();
  return success(res, permissions);
});

// GET /api/auth/roles
router.get('/roles', authenticate, (req: Request, res: Response) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY name').all();
  return success(res, roles);
});

export default router;
