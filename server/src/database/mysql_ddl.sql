-- ============================================
-- 新媒体经营中台 - MySQL DDL
-- 用于生产环境部署
-- ============================================

CREATE DATABASE IF NOT EXISTS new_media_platform
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE new_media_platform;

-- ===== 用户与权限 =====
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  department VARCHAR(100) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL DEFAULT 'read',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== 策略中台 =====
CREATE TABLE brand_goals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  objective TEXT,
  okr_key_results JSON,
  time_frame VARCHAR(50),
  status ENUM('active','archived','completed') DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0,
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===== 内容中台 =====
CREATE TABLE topics (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('draft','submitted','approved','in_progress','completed','rejected','archived') DEFAULT 'draft',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  brand_goal_id VARCHAR(36),
  created_by VARCHAR(36),
  assigned_to VARCHAR(36),
  tags VARCHAR(500) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE scripts (
  id VARCHAR(36) PRIMARY KEY,
  topic_id VARCHAR(36),
  title VARCHAR(200) DEFAULT '',
  content TEXT,
  version INT DEFAULT 1,
  status ENUM('draft','review','approved','published') DEFAULT 'draft',
  author_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE script_versions (
  id VARCHAR(36) PRIMARY KEY,
  script_id VARCHAR(36) NOT NULL,
  content TEXT,
  version INT NOT NULL,
  change_note VARCHAR(500) DEFAULT '',
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assets (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('image','video','document','audio','other') NOT NULL,
  name VARCHAR(200) NOT NULL,
  url VARCHAR(500) DEFAULT '',
  file_path VARCHAR(500) DEFAULT '',
  metadata JSON,
  tags VARCHAR(500) DEFAULT '',
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT '',
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE content_plans (
  id VARCHAR(36) PRIMARY KEY,
  topic_id VARCHAR(36),
  script_id VARCHAR(36),
  title VARCHAR(200) NOT NULL,
  platform ENUM('weibo','wechat','douyin','kuaishou','xiaohongshu','bilibili','other') NOT NULL,
  scheduled_at DATETIME,
  status ENUM('planned','published','failed','cancelled') DEFAULT 'planned',
  published_url VARCHAR(500) DEFAULT '',
  published_at DATETIME,
  notes TEXT,
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE publish_logs (
  id VARCHAR(36) PRIMARY KEY,
  content_plan_id VARCHAR(36),
  status ENUM('success','failed','pending') NOT NULL,
  message VARCHAR(500) DEFAULT '',
  platform VARCHAR(50) DEFAULT '',
  published_url VARCHAR(500) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_plan_id) REFERENCES content_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== 数据中台 =====
CREATE TABLE data_sources (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('api','csv','manual','crawl') NOT NULL,
  platform VARCHAR(50) DEFAULT '',
  config JSON,
  is_active TINYINT(1) DEFAULT 1,
  last_sync_at DATETIME,
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE dashboards (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('content','conversion','overview','custom') DEFAULT 'content',
  config JSON,
  is_default TINYINT(1) DEFAULT 0,
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE metrics (
  id VARCHAR(36) PRIMARY KEY,
  dashboard_id VARCHAR(36),
  name VARCHAR(100) NOT NULL,
  metric_key VARCHAR(50) NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT '',
  platform VARCHAR(50) DEFAULT '',
  dimension VARCHAR(50) DEFAULT '',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE conversions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  source VARCHAR(100) DEFAULT '',
  target VARCHAR(100) DEFAULT '',
  visit_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  rate DECIMAL(8,2) DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  platform VARCHAR(50) DEFAULT '',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===== 协同中台 =====
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id VARCHAR(36),
  creator_id VARCHAR(36),
  status ENUM('todo','in_progress','review','done','cancelled') DEFAULT 'todo',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  due_date DATE,
  related_type ENUM('','topic','script','content_plan','review','other') DEFAULT '',
  related_id VARCHAR(36) DEFAULT '',
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE approvals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content_type ENUM('topic','script','content_plan','publish','other') NOT NULL,
  content_id VARCHAR(36) NOT NULL,
  requester_id VARCHAR(36),
  approver_id VARCHAR(36),
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  comment TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('task','approval','mention','system','alert') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  related_type VARCHAR(50) DEFAULT '',
  related_id VARCHAR(36) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  review_type ENUM('content','campaign','monthly','quarterly','platform') NOT NULL,
  content_id VARCHAR(36) DEFAULT '',
  summary TEXT,
  conclusion TEXT,
  action_items JSON,
  metrics_snapshot JSON,
  status ENUM('draft','completed','shared') DEFAULT 'draft',
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===== 策略中台 =====
CREATE TABLE channels (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(100) DEFAULT '',
  account_id VARCHAR(100) DEFAULT '',
  followers INT DEFAULT 0,
  description TEXT,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE columns_table (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  channel_id VARCHAR(36),
  status ENUM('active','archived') DEFAULT 'active',
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE strategies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type ENUM('brand','platform','content','growth') NOT NULL,
  content TEXT,
  brand_goal_id VARCHAR(36),
  status ENUM('draft','active','archived') DEFAULT 'draft',
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_goal_id) REFERENCES brand_goals(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE monthly_reviews (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  period VARCHAR(20) NOT NULL,
  summary TEXT,
  content TEXT,
  conclusion TEXT,
  action_items JSON,
  status ENUM('draft','completed','shared') DEFAULT 'draft',
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===== 操作日志 =====
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT '',
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36) DEFAULT '',
  detail TEXT,
  ip_address VARCHAR(45) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
