import { Response } from 'express';

export function success(res: Response, data: any = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

export function paginated(res: Response, list: any[], total: number, page: number, pageSize: number) {
  return res.json({
    code: 0,
    message: 'success',
    data: { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

export function error(res: Response, message: string, code = 1, status = 400) {
  return res.status(status).json({ code, message, data: null });
}

export function unauthorized(res: Response, message = '未登录或登录已过期') {
  return res.status(401).json({ code: 401, message, data: null });
}

export function forbidden(res: Response, message = '无权限访问') {
  return res.status(403).json({ code: 403, message, data: null });
}

export function notFound(res: Response, message = '资源不存在') {
  return res.status(404).json({ code: 404, message, data: null });
}
