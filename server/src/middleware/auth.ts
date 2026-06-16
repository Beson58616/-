import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { unauthorized, forbidden } from '../utils/response';
import db from '../database/connection';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// 认证中间件：验证 JWT Token
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, '未提供认证令牌');
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return unauthorized(res, '认证令牌无效或已过期');
  }

  req.user = payload;
  next();
}

// 可选的认证：有 token 就解析，没有也继续
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

// RBAC 权限检查中间件工厂函数
export function requirePermission(resource: string, action: string = 'read') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorized(res);
    }

    // Admin role has all permissions
    if (req.user.roles.includes('系统管理员')) {
      return next();
    }

    // Check specific permission via user roles
    const perm = db.prepare(`
      SELECT COUNT(*) as count FROM role_permissions rp
      JOIN user_roles ur ON ur.role_id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ? AND (p.resource = ? OR p.resource = '*')
        AND (p.action = ? OR p.action = 'manage')
    `).get(req.user.userId, resource, action) as { count: number };

    if (perm && perm.count > 0) {
      return next();
    }

    return forbidden(res, `需要 ${resource}:${action} 权限`);
  };
}

// 记录审计日志
export function auditLog(userId: string, action: string, resource: string, resourceId: string, detail: string, ip: string) {
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource, resource_id, detail, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, action, resource, resourceId, detail, ip);
}
