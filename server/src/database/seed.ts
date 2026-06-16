import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from './connection';
import { initializeDatabase } from './schema';

function seed() {
  initializeDatabase();

  console.log('🌱 Seeding database...');

  // ===== 权限 =====
  const perms = [
    { id: 'perm_admin', name: 'admin:all', resource: '*', action: 'manage' },
    { id: 'perm_content_read', name: 'content:read', resource: 'content', action: 'read' },
    { id: 'perm_content_write', name: 'content:write', resource: 'content', action: 'write' },
    { id: 'perm_data_read', name: 'data:read', resource: 'data', action: 'read' },
    { id: 'perm_data_write', name: 'data:write', resource: 'data', action: 'write' },
    { id: 'perm_collab_read', name: 'collab:read', resource: 'collaboration', action: 'read' },
    { id: 'perm_collab_write', name: 'collab:write', resource: 'collaboration', action: 'write' },
    { id: 'perm_strategy_read', name: 'strategy:read', resource: 'strategy', action: 'read' },
    { id: 'perm_strategy_write', name: 'strategy:write', resource: 'strategy', action: 'write' },
    { id: 'perm_approve', name: 'approval:manage', resource: 'approval', action: 'manage' },
    { id: 'perm_user_manage', name: 'user:manage', resource: 'user', action: 'manage' },
  ];

  const insertPerm = db.prepare('INSERT OR IGNORE INTO permissions (id, name, resource, action) VALUES (?, ?, ?, ?)');
  for (const p of perms) {
    insertPerm.run(p.id, p.name, p.resource, p.action);
  }

  // ===== 角色 =====
  const roles = [
    { id: 'role_admin', name: '系统管理员', description: '拥有全部权限' },
    { id: 'role_brand_manager', name: '品牌负责人', description: '管理品牌目标与策略' },
    { id: 'role_content_editor', name: '内容运营', description: '管理内容选题与脚本' },
    { id: 'role_data_analyst', name: '数据分析师', description: '查看和分析数据' },
    { id: 'role_channel_manager', name: '渠道经理', description: '管理多平台渠道' },
    { id: 'role_growth_specialist', name: '增长专员', description: '管理增长与转化' },
    { id: 'role_risk_manager', name: '风控管理员', description: '审批与风控' },
  ];

  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
  for (const r of roles) {
    insertRole.run(r.id, r.name, r.description);
  }

  // ===== 角色-权限映射 =====
  const rolePerms: [string, string][] = [
    ['role_admin', 'perm_admin'],
    ['role_admin', 'perm_user_manage'],
    ['role_brand_manager', 'perm_content_read'],
    ['role_brand_manager', 'perm_data_read'],
    ['role_brand_manager', 'perm_strategy_read'],
    ['role_brand_manager', 'perm_strategy_write'],
    ['role_brand_manager', 'perm_approve'],
    ['role_content_editor', 'perm_content_read'],
    ['role_content_editor', 'perm_content_write'],
    ['role_data_analyst', 'perm_data_read'],
    ['role_data_analyst', 'perm_data_write'],
    ['role_channel_manager', 'perm_content_read'],
    ['role_channel_manager', 'perm_data_read'],
    ['role_channel_manager', 'perm_collab_read'],
    ['role_growth_specialist', 'perm_data_read'],
    ['role_growth_specialist', 'perm_strategy_read'],
    ['role_risk_manager', 'perm_approve'],
    ['role_risk_manager', 'perm_collab_read'],
    ['role_risk_manager', 'perm_collab_write'],
  ];

  const insertRolePerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  for (const [rid, pid] of rolePerms) {
    insertRolePerm.run(rid, pid);
  }

  // ===== 用户 =====
  const passwordHash = bcrypt.hashSync('123456', 10);
  const users = [
    { id: 'user_admin', username: 'admin', email: 'admin@example.com', display_name: '系统管理员', department: '技术部' },
    { id: 'user_brand', username: 'brand', email: 'brand@example.com', display_name: '张品牌', department: '市场部' },
    { id: 'user_editor', username: 'editor', email: 'editor@example.com', display_name: '李编辑', department: '内容部' },
    { id: 'user_analyst', username: 'analyst', email: 'analyst@example.com', display_name: '王分析', department: '数据部' },
    { id: 'user_channel', username: 'channel', email: 'channel@example.com', display_name: '赵渠道', department: '运营部' },
    { id: 'user_growth', username: 'growth', email: 'growth@example.com', display_name: '孙增长', department: '增长部' },
    { id: 'user_risk', username: 'risk', email: 'risk@example.com', display_name: '周风控', department: '风控部' },
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, department) VALUES (?, ?, ?, ?, ?, ?)');
  for (const u of users) {
    insertUser.run(u.id, u.username, u.email, passwordHash, u.display_name, u.department);
  }

  // ===== 用户-角色映射 =====
  const userRoles: [string, string][] = [
    ['user_admin', 'role_admin'],
    ['user_brand', 'role_brand_manager'],
    ['user_editor', 'role_content_editor'],
    ['user_analyst', 'role_data_analyst'],
    ['user_channel', 'role_channel_manager'],
    ['user_growth', 'role_growth_specialist'],
    ['user_risk', 'role_risk_manager'],
  ];

  const insertUserRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');
  for (const [uid, rid] of userRoles) {
    insertUserRole.run(uid, rid);
  }

  // ===== 品牌目标 =====
  const goals = [
    { id: 'goal_1', title: 'Q2 品牌知名度提升', objective: '在全平台提升品牌知名度 30%', okr_key_results: '{"kr1":"微博粉丝增长 5 万","kr2":"公众号阅读量提升 50%","kr3":"抖音播放量突破 1000 万"}', time_frame: '2024-Q2', progress: 65, created_by: 'user_brand' },
    { id: 'goal_2', title: '新产品线推广', objective: '为新产品线建立市场认知', okr_key_results: '{"kr1":"产品相关内容触达 500 万人次","kr2":"转化率 3%以上","kr3":"线下活动报名 1000 人"}', time_frame: '2024-Q2', progress: 40, created_by: 'user_brand' },
  ];

  const insertGoal = db.prepare('INSERT OR IGNORE INTO brand_goals (id, title, objective, okr_key_results, time_frame, progress, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const g of goals) {
    insertGoal.run(g.id, g.title, g.objective, g.okr_key_results, g.time_frame, g.progress, g.created_by);
  }

  // ===== 渠道 =====
  const channels = [
    { id: 'ch_1', name: '官方微博', platform: 'weibo', account_name: '@品牌官方微博', followers: 250000 },
    { id: 'ch_2', name: '微信公众号', platform: 'wechat', account_name: '品牌官方公众号', followers: 180000 },
    { id: 'ch_3', name: '抖音官方号', platform: 'douyin', account_name: '@品牌抖音', followers: 500000 },
    { id: 'ch_4', name: '小红书官方', platform: 'xiaohongshu', account_name: '@品牌小红书', followers: 120000 },
    { id: 'ch_5', name: 'B站官方号', platform: 'bilibili', account_name: '品牌B站', followers: 80000 },
  ];

  const insertChannel = db.prepare('INSERT OR IGNORE INTO channels (id, name, platform, account_name, followers) VALUES (?, ?, ?, ?, ?)');
  for (const c of channels) {
    insertChannel.run(c.id, c.name, c.platform, c.account_name, c.followers);
  }

  // ===== 栏目 =====
  const cols = [
    { id: 'col_1', name: '产品测评', description: '产品功能评测与对比', channel_id: 'ch_3' },
    { id: 'col_2', name: '品牌故事', description: '品牌文化与人物故事', channel_id: 'ch_2' },
    { id: 'col_3', name: '行业洞察', description: '行业趋势分析', channel_id: 'ch_2' },
    { id: 'col_4', name: '用户案例', description: '用户真实案例分享', channel_id: 'ch_4' },
  ];

  const insertCol = db.prepare('INSERT OR IGNORE INTO columns_table (id, name, description, channel_id) VALUES (?, ?, ?, ?)');
  for (const c of cols) {
    insertCol.run(c.id, c.name, c.description, c.channel_id);
  }

  // ===== 选题 =====
  const topics = [
    { id: 'topic_1', title: '春季新品发布预告', description: '为即将到来的春季新品做预热宣传', status: 'approved', priority: 'high', brand_goal_id: 'goal_2', created_by: 'user_editor', assigned_to: 'user_editor', tags: '新品,春季,预热' },
    { id: 'topic_2', title: '用户故事：从0到1的成长', description: '深度采访典型用户的使用体验', status: 'in_progress', priority: 'medium', brand_goal_id: 'goal_1', created_by: 'user_editor', assigned_to: 'user_editor', tags: '用户故事,案例' },
    { id: 'topic_3', title: '618大促活动策划', description: '年中大促整体活动方案与内容规划', status: 'draft', priority: 'urgent', brand_goal_id: 'goal_1', created_by: 'user_brand', assigned_to: 'user_editor', tags: '618,促销,活动' },
    { id: 'topic_4', title: '行业白皮书解读', description: '解读最新行业白皮书核心观点', status: 'submitted', priority: 'low', brand_goal_id: 'goal_1', created_by: 'user_analyst', assigned_to: 'user_editor', tags: '行业,白皮书,分析' },
    { id: 'topic_5', title: '品牌3周年特别企划', description: '围绕品牌3周年策划系列纪念内容', status: 'draft', priority: 'high', brand_goal_id: 'goal_1', created_by: 'user_brand', assigned_to: 'user_editor', tags: '周年,品牌,特别企划' },
  ];

  const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (id, title, description, status, priority, brand_goal_id, created_by, assigned_to, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const t of topics) {
    insertTopic.run(t.id, t.title, t.description, t.status, t.priority, t.brand_goal_id, t.created_by, t.assigned_to, t.tags);
  }

  // ===== 脚本 =====
  const scripts = [
    { id: 'script_1', topic_id: 'topic_1', title: '春季新品发布预告-短视频脚本', content: '【开场】画面：春日花园，产品特写\n旁白：春天来了，新的开始...\n【痛点】画面：用户日常使用场景\n旁白：你是否也遇到过这些问题？\n【解决方案】画面：新品功能演示\n旁白：我们的新品，为你解决一切...\n【结尾】画面：品牌LOGO+Slogan\n旁白：XX品牌，让生活更美好\n\n#春季新品 #科技改变生活', version: 2, status: 'approved', author_id: 'user_editor' },
    { id: 'script_2', topic_id: 'topic_2', title: '用户故事采访提纲', content: '【采访对象】典型用户代表 - 小王\n【使用产品】XX 系列\n【使用时长】2年\n\n采访问题：\n1. 第一次了解我们品牌是什么时候？\n2. 选择我们产品的主要原因是什么？\n3. 使用过程中印象最深的一件事？\n4. 对产品的改进建议？\n5. 会推荐给朋友吗？为什么？\n\n【拍摄计划】\n- 用户日常使用场景（家中/办公）\n- 产品特写\n- 用户采访（半身中景）\n- 产品+用户互动场景', version: 1, status: 'draft', author_id: 'user_editor' },
    { id: 'script_3', topic_id: 'topic_3', title: '618大促活动推文', content: '# 618年中盛典 | 全年最低价，错过再等一年！\n\n🎉 活动时间：6月1日-6月18日\n🔥 全场低至5折\n🎁 满300减50，满500减100\n💎 会员专属额外95折\n\n## 爆款推荐\n- XX产品：原价999，活动价499\n- YY套装：原价1599，活动价899\n\n## 限时秒杀\n每天10点/14点/20点\n限量100件，手慢无！\n\n👉 点击链接，立即抢购\n\n#618大促 #年中盛典 #限时优惠', version: 1, status: 'draft', author_id: 'user_editor' },
  ];

  const insertScript = db.prepare('INSERT OR IGNORE INTO scripts (id, topic_id, title, content, version, status, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const s of scripts) {
    insertScript.run(s.id, s.topic_id, s.title, s.content, s.version, s.status, s.author_id);
  }

  // ===== 素材 =====
  const assets = [
    { id: 'asset_1', type: 'image', name: '春季新品海报_v1', url: '/uploads/spring_poster_v1.jpg', metadata: '{"resolution":"1920x1080","format":"jpg"}', tags: '春季,新品,海报', created_by: 'user_editor' },
    { id: 'asset_2', type: 'video', name: '产品功能演示视频', url: '/uploads/product_demo.mp4', metadata: '{"duration":"120s","resolution":"1080p"}', tags: '产品,演示,视频', created_by: 'user_editor' },
    { id: 'asset_3', type: 'image', name: '618活动banner', url: '/uploads/618_banner.jpg', metadata: '{"resolution":"1200x600","format":"jpg"}', tags: '618,促销,banner', created_by: 'user_editor' },
    { id: 'asset_4', type: 'document', name: '品牌VI手册2024', url: '/uploads/brand_vi_2024.pdf', metadata: '{"pages":45,"format":"pdf"}', tags: '品牌,VI,手册', created_by: 'user_brand' },
  ];

  const insertAsset = db.prepare('INSERT OR IGNORE INTO assets (id, type, name, url, metadata, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const a of assets) {
    insertAsset.run(a.id, a.type, a.name, a.url, a.metadata, a.tags, a.created_by);
  }

  // ===== 内容排期 =====
  const plans = [
    { id: 'plan_1', topic_id: 'topic_1', script_id: 'script_1', title: '春季新品预告-抖音发布', platform: 'douyin', scheduled_at: '2024-06-20 10:00:00', status: 'planned', created_by: 'user_editor' },
    { id: 'plan_2', topic_id: 'topic_1', script_id: 'script_1', title: '春季新品预告-微博发布', platform: 'weibo', scheduled_at: '2024-06-20 12:00:00', status: 'planned', created_by: 'user_editor' },
    { id: 'plan_3', topic_id: 'topic_2', script_id: 'script_2', title: '用户故事-公众号发布', platform: 'wechat', scheduled_at: '2024-06-22 09:00:00', status: 'planned', created_by: 'user_editor' },
  ];

  const insertPlan = db.prepare('INSERT OR IGNORE INTO content_plans (id, topic_id, script_id, title, platform, scheduled_at, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of plans) {
    insertPlan.run(p.id, p.topic_id, p.script_id, p.title, p.platform, p.scheduled_at, p.status, p.created_by);
  }

  // ===== 任务 =====
  const tasks = [
    { id: 'task_1', title: '完成春季新品预告脚本终稿', assignee_id: 'user_editor', creator_id: 'user_brand', status: 'in_progress', priority: 'high', due_date: '2024-06-18', related_type: 'script', related_id: 'script_1' },
    { id: 'task_2', title: '审核618大促活动方案', assignee_id: 'user_risk', creator_id: 'user_editor', status: 'todo', priority: 'urgent', due_date: '2024-06-17', related_type: 'topic', related_id: 'topic_3' },
    { id: 'task_3', title: '整理Q2用户数据分析报告', assignee_id: 'user_analyst', creator_id: 'user_brand', status: 'todo', priority: 'medium', due_date: '2024-06-25' },
    { id: 'task_4', title: '小红书渠道内容策略调整', assignee_id: 'user_channel', creator_id: 'user_brand', status: 'done', priority: 'medium', due_date: '2024-06-10', completed_at: '2024-06-09' },
  ];

  const insertTask = db.prepare('INSERT OR IGNORE INTO tasks (id, title, assignee_id, creator_id, status, priority, due_date, related_type, related_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const t of tasks) {
    insertTask.run(t.id, t.title, t.assignee_id, t.creator_id, t.status, t.priority, t.due_date, t.related_type, t.related_id, t.completed_at);
  }

  // ===== 审批 =====
  const approvals = [
    { id: 'approval_1', title: '春季新品预告脚本审批', content_type: 'script', content_id: 'script_1', requester_id: 'user_editor', approver_id: 'user_risk', status: 'approved', comment: '内容符合品牌调性，同意发布', approved_at: '2024-06-15' },
    { id: 'approval_2', title: '618大促活动方案审批', content_type: 'topic', content_id: 'topic_3', requester_id: 'user_editor', approver_id: 'user_risk', status: 'pending' },
  ];

  const insertApproval = db.prepare('INSERT OR IGNORE INTO approvals (id, title, content_type, content_id, requester_id, approver_id, status, comment, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const a of approvals) {
    insertApproval.run(a.id, a.title, a.content_type, a.content_id, a.requester_id, a.approver_id, a.status, a.comment || '', a.approved_at || '');
  }

  // ===== 通知 =====
  const notifications = [
    { id: 'notif_1', user_id: 'user_editor', type: 'task', title: '新的任务分配', message: '张品牌给你分配了新任务：完成春季新品预告脚本终稿' },
    { id: 'notif_2', user_id: 'user_risk', type: 'approval', title: '待审批', message: '李编辑提交了618大促活动方案，等待你的审批' },
    { id: 'notif_3', user_id: 'user_editor', type: 'system', title: '脚本审批通过', message: '春季新品预告脚本已通过审批' },
  ];

  const insertNotif = db.prepare('INSERT OR IGNORE INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)');
  for (const n of notifications) {
    insertNotif.run(n.id, n.user_id, n.type, n.title, n.message);
  }

  // ===== 数据源 =====
  const dataSources = [
    { id: 'ds_1', name: '微博数据API', type: 'api', platform: 'weibo', is_active: 1 },
    { id: 'ds_2', name: '抖音数据导入', type: 'csv', platform: 'douyin', is_active: 1 },
    { id: 'ds_3', name: '公众号数据', type: 'api', platform: 'wechat', is_active: 0 },
  ];

  const insertDS = db.prepare('INSERT OR IGNORE INTO data_sources (id, name, type, platform, is_active) VALUES (?, ?, ?, ?, ?)');
  for (const d of dataSources) {
    insertDS.run(d.id, d.name, d.type, d.platform, d.is_active);
  }

  // ===== 看板 =====
  const dashboards = [
    { id: 'db_1', name: '内容表现总览', type: 'content', is_default: 1, created_by: 'user_analyst' },
    { id: 'db_2', name: '转化漏斗看板', type: 'conversion', is_default: 1, created_by: 'user_analyst' },
  ];

  const insertDB = db.prepare('INSERT OR IGNORE INTO dashboards (id, name, type, is_default, created_by) VALUES (?, ?, ?, ?, ?)');
  for (const d of dashboards) {
    insertDB.run(d.id, d.name, d.type, d.is_default, d.created_by);
  }

  // ===== 指标 =====
  const now = new Date();
  const metricsData = [];
  const platforms = ['weibo', 'wechat', 'douyin', 'xiaohongshu', 'bilibili'];
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    for (const p of platforms) {
      metricsData.push({
        id: `metric_${p}_${d}_impression`, dashboard_id: 'db_1', name: '曝光量', metric_key: 'impression',
        value: Math.floor(Math.random() * 100000 + 10000), unit: '次', platform: p, recorded_at: dateStr,
      });
      metricsData.push({
        id: `metric_${p}_${d}_engagement`, dashboard_id: 'db_1', name: '互动量', metric_key: 'engagement',
        value: Math.floor(Math.random() * 10000 + 500), unit: '次', platform: p, recorded_at: dateStr,
      });
      metricsData.push({
        id: `metric_${p}_${d}_share`, dashboard_id: 'db_1', name: '分享量', metric_key: 'share',
        value: Math.floor(Math.random() * 1000 + 50), unit: '次', platform: p, recorded_at: dateStr,
      });
    }
  }

  const insertMetric = db.prepare('INSERT OR IGNORE INTO metrics (id, dashboard_id, name, metric_key, value, unit, platform, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const m of metricsData) {
    insertMetric.run(m.id, m.dashboard_id, m.name, m.metric_key, m.value, m.unit, m.platform, m.recorded_at);
  }

  // ===== 转化数据 =====
  const convData = [
    { id: 'conv_1', name: '微博 -> 官网', source: 'weibo', target: '官网', visit_count: 15000, conversion_count: 450, rate: 3.0, revenue: 22500, platform: 'weibo' },
    { id: 'conv_2', name: '抖音 -> 商城', source: 'douyin', target: '商城', visit_count: 80000, conversion_count: 3200, rate: 4.0, revenue: 160000, platform: 'douyin' },
    { id: 'conv_3', name: '公众号 -> 落地页', source: 'wechat', target: '落地页', visit_count: 12000, conversion_count: 600, rate: 5.0, revenue: 30000, platform: 'wechat' },
    { id: 'conv_4', name: '小红书 -> 商城', source: 'xiaohongshu', target: '商城', visit_count: 25000, conversion_count: 1250, rate: 5.0, revenue: 62500, platform: 'xiaohongshu' },
  ];

  const insertConv = db.prepare('INSERT OR IGNORE INTO conversions (id, name, source, target, visit_count, conversion_count, rate, revenue, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const c of convData) {
    insertConv.run(c.id, c.name, c.source, c.target, c.visit_count, c.conversion_count, c.rate, c.revenue, c.platform);
  }

  // ===== 复盘 =====
  const reviews = [
    { id: 'review_1', title: '5月内容表现复盘', review_type: 'monthly', summary: '5月整体内容表现良好，抖音平台增长显著', conclusion: '加大短视频投入，优化公众号内容结构', action_items: '["增加每周短视频发布频率至5条","公众号增加行业洞察栏目","小红书KOC合作计划启动"]', status: 'completed', created_by: 'user_analyst' },
  ];

  const insertReview = db.prepare('INSERT OR IGNORE INTO reviews (id, title, review_type, summary, conclusion, action_items, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const r of reviews) {
    insertReview.run(r.id, r.title, r.review_type, r.summary, r.conclusion, r.action_items, r.status, r.created_by);
  }

  // ===== 月度复盘 =====
  const monthlyReviews = [
    { id: 'mr_1', title: '2024年5月品牌月度复盘', period: '2024-05', summary: '品牌全网曝光量环比增长25%，互动率提升15%', content: '## 5月整体表现\n- 全平台发布内容 120 篇\n- 总曝光量 850 万次\n- 总互动量 45 万次\n- 新增粉丝 8.5 万人\n\n## 亮点\n- 抖音短视频系列播放量突破 500 万\n- 微博话题 #品牌故事# 阅读量 200 万\n\n## 待改进\n- 公众号打开率下降 5%\n- B站内容频率不足', conclusion: '短视频策略成效显著，需持续投入；公众号需调整内容策略', action_items: '["6月启动B站周更计划","公众号内容改版：增加互动性内容","618大促内容准备"]', status: 'completed', created_by: 'user_brand' },
  ];

  const insertMR = db.prepare('INSERT OR IGNORE INTO monthly_reviews (id, title, period, summary, content, conclusion, action_items, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const mr of monthlyReviews) {
    insertMR.run(mr.id, mr.title, mr.period, mr.summary, mr.content, mr.conclusion, mr.action_items, mr.status, mr.created_by);
  }

  // ===== 策略 =====
  const strategies = [
    { id: 'strat_1', name: 'Q2 品牌传播策略', type: 'brand', content: '以"品质生活"为核心传播主题，通过多平台内容矩阵提升品牌认知', brand_goal_id: 'goal_1', status: 'active', created_by: 'user_brand' },
    { id: 'strat_2', name: '抖音平台增长策略', type: 'platform', content: '以短视频+直播双轮驱动，打造品牌人设，提升粉丝粘性和转化', brand_goal_id: 'goal_1', status: 'active', created_by: 'user_channel' },
  ];

  const insertStrategy = db.prepare('INSERT OR IGNORE INTO strategies (id, name, type, content, brand_goal_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const s of strategies) {
    insertStrategy.run(s.id, s.name, s.type, s.content, s.brand_goal_id, s.status, s.created_by);
  }

  console.log('✅ Seed data inserted successfully');
  console.log('📋 Test accounts (password: 123456):');
  console.log('  admin / 123456 - 系统管理员');
  console.log('  brand / 123456 - 品牌负责人');
  console.log('  editor / 123456 - 内容运营');
  console.log('  analyst / 123456 - 数据分析师');
}

seed();
