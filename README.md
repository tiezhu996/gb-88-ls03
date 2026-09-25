# Mock API Server

在线 API Mock 服务管理平台，通过配置 Mock 规则模拟 API 响应，加速前后端并行开发。

## 快速启动

### Docker Compose 一键部署

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看服务状态
docker compose ps
```

启动后访问：
- 前端管理界面：http://localhost:8119
- 后端 API：http://localhost:3119
- 健康检查：http://localhost:3119/api/health

### 初始化种子数据

```bash
# 进入后端容器执行种子数据脚本
docker exec -it mock-backend sh
npm run seed
exit
```

种子数据包含：
- 用户：dev/dev123（普通用户）、lead/lead123（管理员）
- 预置项目：「用户管理系统」
- 5 个示例 API 接口
- 10 条请求日志记录

## 本地开发

### 环境要求
- Node.js 18+
- MongoDB 6+

### 后端启动

```bash
cd backend
npm install
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 | 3.3+ |
| 前端语言 | TypeScript | 5.3+ |
| UI 组件库 | Arco Design Vue | 2.53+ |
| 构建工具 | Vite | 5.0+ |
| 状态管理 | Pinia | 2.1+ |
| 代码编辑器 | Monaco Editor | - |
| 后端框架 | Express | 4.18+ |
| 后端语言 | TypeScript | 5.3+ |
| 数据库 | MongoDB | 6+ |
| ODM | Mongoose | 8.0+ |
| Mock 引擎 | Faker.js | 8.3+ |

## 项目目录结构

```
.
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/            # API 请求封装
│   │   ├── components/     # 公共组件
│   │   ├── store/          # Pinia 状态管理
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── views/          # 页面组件
│   │   ├── App.vue         # 根组件
│   │   └── main.ts         # 入口文件
│   ├── Dockerfile          # 前端 Docker 配置
│   ├── nginx.conf          # Nginx 配置
│   └── package.json
├── backend/                # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── index.ts        # 入口文件
│   ├── Dockerfile          # 后端 Docker 配置
│   └── package.json
├── database/               # 数据库脚本
├── docker-compose.yml      # Docker Compose 配置
├── .env.example            # 环境变量示例
└── README.md
```

## 核心功能

### 1. 项目管理
- 创建、编辑、删除 Mock 项目
- 每个项目独立的 API 配置空间

### 2. API 配置
- 支持所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
- 自定义响应状态码
- 自定义响应头
- 响应延迟模拟

### 3. 动态响应
- 集成 Faker.js 模板语法
- 支持在 JSON 响应中使用 `{{name.fullName}}`、`{{internet.email}}` 等模板
- 每次请求生成随机但真实的数据

### 4. 条件响应
- 基于请求头、查询参数、请求体的条件匹配
- 支持等于、包含、开头、结尾等匹配模式
- 不同条件返回不同响应内容

### 5. 请求日志
- 记录所有 Mock 请求的详细信息
- 请求方法、路径、头信息、请求体、响应状态
- 支持日志搜索和清空

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3000 |
| MONGODB_URI | MongoDB 连接字符串 | mongodb://localhost:27017/mock-api-db |
| JWT_SECRET | JWT 签名密钥 | your-secret-key |

## Docker 部署说明

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| 前端 | 80 | 8119 | 管理界面 |
| 后端 | 3000 | 3119 | API 服务和 Mock 服务 |
| MongoDB | 27017 | 2919 | 数据库 |

### 数据卷

- `mock-mongodb-data`：MongoDB 数据持久化

### 常用命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 停止服务并删除数据卷
docker compose down -v

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart
```

### 常见问题

#### 1. 前端无法连接后端
- 检查后端服务是否正常启动：`docker compose ps`
- 检查 nginx 配置中的代理地址是否正确
- 查看后端日志：`docker compose logs -f backend`

#### 2. 数据库连接失败
- 检查 MongoDB 健康检查状态
- 确认连接字符串中的用户名密码是否正确
- 查看 MongoDB 日志：`docker compose logs -f mongodb`

#### 3. 种子数据执行失败
- 确保数据库服务已正常启动
- 检查环境变量配置
- 手动进入容器执行：`docker exec -it mock-backend npm run seed`

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| dev | dev123 | 普通用户 | 默认测试账号 |
| lead | lead123 | 管理员 | 管理员权限 |

## API 示例

### 用户登录
```bash
curl -X POST http://localhost:3119/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dev","password":"dev123"}'
```

### 调用 Mock API
```bash
# 假设项目 ID 为 {projectId}
curl http://localhost:3119/mock/{projectId}/api/users
```

## License

MIT
