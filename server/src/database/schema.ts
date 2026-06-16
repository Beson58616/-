import db from './connection';

export function initializeDatabase(): void {
  // ===== 用户与权限 =====
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      avatar TEXT DEFAULT '',
      department TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'read',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- ===== 内容中台 =====
    CREATE TABLE IF NOT EXISTS brand_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      objective TEXT DEFAULT '',
      okr_key_results TEXT DEFAULT '',
      time_frame TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','archived','completed')),
      progress REAL DEFAULT 0,
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','in_progress','completed','rejected','archived')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      brand_goal_id TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      assigned_to TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT DEFAULT '',
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','review','approved','published')),
      author_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS script_versions (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL,
      content TEXT DEFAULT '',
      version INTEGER NOT NULL,
      change_note TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('image','video','document','audio','other')),
      name TEXT NOT NULL,
      url TEXT DEFAULT '',
      file_path TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      tags TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_plans (
      id TEXT PRIMARY KEY,
      topic_id TEXT,
      script_id TEXT,
      title TEXT NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('weibo','wechat','douyin','kuaishou','xiaohongshu','bilibili','other')),
      scheduled_at TEXT DEFAULT '',
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned','published','failed','cancelled')),
      published_url TEXT DEFAULT '',
      published_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS publish_logs (
      id TEXT PRIMARY KEY,
      content_plan_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('success','failed','pending')),
      message TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      published_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (content_plan_id) REFERENCES content_plans(id) ON DELETE CASCADE
    );

    -- ===== 数据中台 =====
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('api','csv','manual','crawl')),
      platform TEXT DEFAULT '',
      config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      last_sync_at TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'content' CHECK(type IN ('content','conversion','overview','custom')),
      config TEXT DEFAULT '{}',
      is_default INTEGER DEFAULT 0,
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      dashboard_id TEXT,
      name TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      value REAL DEFAULT 0,
      unit TEXT DEFAULT '',
      platform TEXT DEFAULT '',
      dimension TEXT DEFAULT '',
      recorded_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT DEFAULT '',
      target TEXT DEFAULT '',
      visit_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      rate REAL DEFAULT 0,
      revenue REAL DEFAULT 0,
      platform TEXT DEFAULT '',
      recorded_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ===== 协同中台 =====
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      assignee_id TEXT DEFAULT '',
      creator_id TEXT DEFAULT '',
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','review','done','cancelled')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      due_date TEXT DEFAULT '',
      related_type TEXT DEFAULT '' CHECK(related_type IN ('','topic','script','content_plan','review','other')),
      related_id TEXT DEFAULT '',
      completed_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_type TEXT NOT NULL CHECK(content_type IN ('topic','script','content_plan','publish','other')),
      content_id TEXT NOT NULL,
      requester_id TEXT DEFAULT '',
      approver_id TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
      comment TEXT DEFAULT '',
      approved_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('task','approval','mention','system','alert')),
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      related_type TEXT DEFAULT '',
      related_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      review_type TEXT NOT NULL CHECK(review_type IN ('content','campaign','monthly','quarterly','platform')),
      content_id TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      conclusion TEXT DEFAULT '',
      action_items TEXT DEFAULT '',
      metrics_snapshot TEXT DEFAULT '{}',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','completed','shared')),
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ===== 策略中台 =====
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      account_name TEXT DEFAULT '',
      account_id TEXT DEFAULT '',
      followers INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS columns_table (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      channel_id TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','archived')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('brand','platform','content','growth')),
      content TEXT DEFAULT '',
      brand_goal_id TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (brand_goal_id) REFERENCES brand_goals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_reviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      period TEXT NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      conclusion TEXT DEFAULT '',
      action_items TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','completed','shared')),
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ===== 操作日志 =====
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT '',
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT DEFAULT '',
      detail TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database tables initialized successfully');
}
