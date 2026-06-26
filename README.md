# 在线剪贴板 (Web Clipboard)

一个支持文字、图片、文件存储的在线剪贴板应用，基于 React + Express + SQLite 构建。

## 功能特性

- **文字剪贴板** — 复制粘贴文字内容，随时查看历史记录
- **图片剪贴板** — 上传图片到云端，支持预览和下载
- **文件剪贴板** — 上传任意文件，支持下载和原文件名保留
- **用户认证** — 注册 / 登录 / 修改密码，JWT 令牌鉴权
- **数据隔离** — 每位用户只能查看和管理自己的剪贴板内容
- **响应式设计** — 适配桌面和移动端浏览器

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | React 18 + React Router 6 |
| 构建工具 | Vite 4 |
| 后端框架 | Express 4 |
| 数据库 | SQLite 3 |
| 认证方式 | JWT (jsonwebtoken) + bcryptjs |
| 文件上传 | Multer |
| 开发工具 | concurrently（并行启动前后端） |

## 项目结构

```
web-clipboard/
├── server/
│   ├── index.js                 # 服务端入口
│   ├── database/
│   │   └── db.js                # 数据库初始化与连接管理
│   ├── middleware/
│   │   └── auth.js              # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.js              # 注册 / 登录 / 用户信息 / 修改密码
│   │   └── clipboard.js         # 文字 / 图片 / 文件 CRUD
│   └── uploads/                 # 上传文件存储目录
├── src/
│   ├── main.jsx                 # 应用入口
│   ├── App.jsx                  # 路由配置
│   ├── index.css                # 全局样式
│   ├── contexts/
│   │   ├── AuthContext.jsx       # 用户认证上下文
│   │   └── ClipboardContext.jsx  # 剪贴板刷新上下文
│   └── components/
│       ├── Header.jsx           # 导航栏
│       ├── Login.jsx            # 登录页
│       ├── Register.jsx         # 注册页
│       ├── Dashboard.jsx        # 主面板（三类剪贴板）
│       ├── ChangePassword.jsx   # 修改密码页
│       ├── Toast.jsx            # 消息提示组件
│       ├── FileIcon.jsx         # 文件类型图标
│       └── clipboards/
│           ├── TextClipboard.jsx    # 文字剪贴板
│           ├── ImageClipboard.jsx   # 图片剪贴板
│           ├── FileClipboard.jsx    # 文件剪贴板
│           └── ViewAllItems.jsx     # 查看全部记录
├── index.html                  # HTML 模板
├── vite.config.js              # Vite 配置（含 API 代理）
├── .env.production             # 生产环境变量
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7

### 安装

```bash
cd web-clipboard
npm install
```

### 配置环境变量

项目根目录下创建 `.env.production` 文件（已有示例可参考）：

```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=./server/database/clipboard.db
UPLOAD_PATH=./server/uploads
JWT_SECRET=替换为你的随机密钥
SESSION_SECRET=替换为你的随机密钥
```

> ⚠️ **生产环境务必修改 `JWT_SECRET` 为随机字符串**，默认密钥仅用于开发。

### 开发模式

前后端并行启动，支持热更新：

```bash
npm run dev
```

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:5000`
- Vite 自动将 `/api` 和 `/uploads` 请求代理到后端

### 生产部署

```bash
# 构建前端
npm run build

# 启动后端（服务 /api 和静态文件）
npm run server
```

构建后 Express 直接托管 `dist/` 目录，只需访问 `http://localhost:5000` 即可。

## API 接口

### 认证相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| GET | `/api/auth/me` | 获取当前用户 | 是 |
| POST | `/api/auth/change-password` | 修改密码 | 是 |

### 剪贴板相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/clipboard/text` | 保存文字 | 是 |
| GET | `/api/clipboard/text?limit=N` | 获取文字列表 | 是 |
| DELETE | `/api/clipboard/text/:id` | 删除文字 | 是 |
| POST | `/api/clipboard/image` | 上传图片 | 是 |
| GET | `/api/clipboard/image?limit=N` | 获取图片列表 | 是 |
| DELETE | `/api/clipboard/image/:id` | 删除图片 | 是 |
| POST | `/api/clipboard/file` | 上传文件 | 是 |
| GET | `/api/clipboard/file?limit=N` | 获取文件列表 | 是 |
| DELETE | `/api/clipboard/file/:id` | 删除文件 | 是 |

所有认证接口需在请求头携带 `Authorization: Bearer <token>`。

## 数据库

使用 SQLite 单文件数据库，包含四张表：

- **users** — 用户信息（邮箱、加密密码、昵称）
- **text_items** — 文字内容（关联用户 ID）
- **image_items** — 图片元信息（文件名、MIME、大小）
- **file_items** — 文件元信息（文件名、MIME、大小）

数据库文件和上传文件均位于 `server/` 目录下，不纳入版本控制。

## 限制说明

- 文字内容最大 **10,000** 个字符
- 文件上传大小受 Multer 默认限制（无 body 大小限制，文件无硬性截断）
- 单用户数据量取决于 SQLite 和磁盘空间
- 暂无分页，前端默认拉取最近 5 条，查看全部页面一次性加载所有记录

## License

MIT
