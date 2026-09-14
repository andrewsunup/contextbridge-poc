# ContextBridge POC 技术方案

> 对应 PRD：[PRD_ContextBridge.md](./PRD_ContextBridge.md)  
> 版本：v0.1  
> 状态：待确认后实施  
> 原则：本地优先、稳定优先、少依赖、演示体验优先

## 1. 方案结论

### 1.1 推荐架构

采用一个小型前后端分离的本地 Web 应用：

```text
React + Vite + TypeScript（浏览器 UI）
              │ HTTP / localhost
              ▼
Express + TypeScript（本地 API / 可选 LLM 代理）
              │
              ├── 读取内置 Mock 文件
              ├── 运行确定性策略与验收计算
              └── 可选：调用大模型完成抽取与角色化转换
```

这是本 POC 最小且可靠的选择：

- 不使用数据库：会话状态保存在浏览器内存和 `localStorage`；
- 不使用真实 CRM、文件库、SSO 或 OAuth：所谓“线上文件”均是内置快照；
- 不引入 LangGraph、Dify、向量数据库、消息队列或多 Agent 框架；
- 不把模型调用放进浏览器：API Key 只存在于本地 Node 服务；
- Demo 默认可离线完成；真实 LLM 仅作为可选增强模式。

### 1.2 关键产品/技术取舍

ContextBridge 的“Agent”采用**受控工作流**而不是自由规划型 Agent：

```text
选择 Context
→ 加载源资料
→ 抽取候选记忆（可选 LLM）
→ 规则治理（确定性）
→ 角色化转换（可选 LLM + 确定性组装）
→ 人工确认
→ FDE 检查与编辑
→ 接手验证（确定性）
```

理由：这个 POC 的价值在于“可信地跨角色转换”，而非展示 Agent 可以任意行动。敏感拦截、冲突处理、发布前置条件和就绪度计算不应交给模型自由决定。

### 1.3 两种运行模式

| 模式 | 是否需要 API Key | 使用场景 | 数据/结果 |
|---|---|---|---|
| `Demo Replay`（默认） | 否 | 日常开发、首次录屏、答辩兜底 | 加载 PRD 定义的固定运行产物；所有交互均真实可操作。 |
| `Live Agent`（可选） | 是 | 证明模型确实可针对所选 Context 做转换 | 调用真实 LLM，输出经过 Schema 与策略校验。 |

两种模式共用完全相同的 UI、人工确认、FDE 修改、审计和验证链路。页面必须明确显示当前模式，不能把 Replay 输出伪装为实时模型生成。

**录屏建议：** 先使用 `Demo Replay` 录制一个稳定、完整的版本；如果 API Key 已配置并连续验证通过，再额外录制或替换为 `Live Agent` 版本。提交说明中如实说明 Demo Replay 的目的：让评审可无网络复现完整流程。

---

## 2. 技术栈与依赖

### 2.1 运行时技术栈

| 层 | 选择 | 原因 |
|---|---|---|
| 前端 | React + TypeScript + Vite | 开发/启动快，适合单页交互工作台。 |
| 样式 | 原生 CSS + CSS Variables | 比引入完整设计系统或 Tailwind 配置更直接；便于精确实现三栏布局。 |
| 图标 | `lucide-react` | 单一轻量图标库，保证状态/来源类型易读。 |
| 本地 API | Express + TypeScript | 仅承担环境变量保护、Mock 文件读取和可选 LLM 调用。 |
| Schema 校验 | Zod | 前后端共享领域对象、校验模型返回 JSON。 |
| LLM SDK（可选） | 官方 `openai` JavaScript SDK | 仅在 Node 服务端使用。 |
| 测试 | Vitest | 用于策略、就绪度、编辑和敏感信息不泄露的单元测试。 |

不使用数据库、React Router、状态管理库、图表库、富文本编辑器、拖拽库或认证方案。页面仅有一个 App 状态树，使用 React `useReducer` 足够。

### 2.2 依赖清单

```text
dependencies
  react, react-dom
  express
  zod
  dotenv
  openai                 # 仅 Live Agent 模式使用
  lucide-react

devDependencies
  typescript, vite
  tsx                    # 运行 TypeScript 本地服务
  concurrently           # 一个 npm 命令启动前后端
  @types/node, @types/express
  vitest
```

### 2.3 不采用的方案

| 不采用 | 原因 |
|---|---|
| Next.js | 本 POC 不需要 SSR、路由、部署平台或服务端渲染。 |
| LangGraph / 多 Agent | 会增加工作流状态、依赖和调试成本；不增加本次演示价值。 |
| Dify / Coze | 会使 repo 交付依赖外部平台、账号或分享权限，难以保证本地复现。 |
| 向量数据库 / RAG | 只有 6–8 份小型固定 Mock 资料；全文放入上下文更简单且证据可控。 |
| 本地 Ollama | 需要下载模型、受机器性能影响；不适合作为面试 Demo 的唯一运行路径。 |
| 真实在线连接器 | 会引入 OAuth、网络和客户数据问题；本期用带同步时间的本地快照模拟。 |

---

## 3. 本地运行方式

### 3.1 目录结构

```text
contextbridge/
├── src/
│   ├── app/                 # App 状态、Reducer、常量
│   ├── components/          # 页面组件和通用 UI
│   ├── mock/                # 浏览器端可直接使用的固定场景/Fixture
│   ├── domain/              # TypeScript 类型、Zod Schema、规则、评分
│   ├── services/            # Demo / Live API 客户端适配器
│   └── styles/              # tokens.css、app.css
├── server/
│   ├── index.ts             # Express 启动与静态文件服务
│   ├── routes.ts            # /health、/transfer
│   ├── liveTransfer.ts      # OpenAI Responses API 调用
│   └── loadContext.ts       # 仅按白名单 ID 读取 mock 文件
├── mock/                    # 与 PRD 8.2 一致的 Markdown/JSON/CSV 文件
├── tests/
│   ├── policy.test.ts
│   ├── readiness.test.ts
│   ├── target-edit.test.ts
│   └── secret-leak.test.ts
├── .env.example
├── package.json
└── README.md
```

`mock/` 是唯一的业务数据源；`src/mock/` 可保存由这些数据预编译的 Demo Fixture。这样既方便前端离线运行，也能让 Live Agent 服务读取完全相同的原始资料。

### 3.2 启动命令

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认打开 `http://localhost:5173`。`npm run dev` 同时启动：

- Vite 前端：`localhost:5173`；
- Express 本地 API：`localhost:8787`；
- Vite 仅将 `/api/*` 代理给 `localhost:8787`。

正式本地预览使用：

```bash
npm run build
npm run start
```

Express 在 `localhost:8787` 提供构建后的静态页面和可选 API。

### 3.3 环境变量

`.env.example`：

```dotenv
# 默认无需 API Key，完整跑通 POC
CONTEXTBRIDGE_MODE=demo

# 仅 Live Agent 模式需要填写；不要提交 .env.local
OPENAI_API_KEY=
OPENAI_MODEL=
```

前端不能读取 `OPENAI_API_KEY`。本地服务的 `/api/health` 只返回 `liveAgentConfigured: true|false`，绝不返回 Key、模型账户信息或完整环境变量。

---

## 4. 前端实现方案

### 4.1 页面结构

PRD 中所有页面通过一个 `AppShell` 和有限状态切换实现，不需要前端路由。

```text
AppShell
├── TopBar
├── ScenarioHome                 # 初始页
├── ContextPickerDrawer           # 全局抽屉
├── TransferWorkspace             # 主工作台
│   ├── SourceContextPanel        # 左栏
│   ├── BridgePipelinePanel       # 中栏
│   └── TargetBriefPanel          # 右栏
├── ReviewCenterModal             # 发起方处理冲突/高风险项
├── TargetCheckPanel              # FDE 确认、编辑、标缺失
├── ReadinessPanel                # 验证问题和就绪度
└── AuditDrawer
```

### 4.2 UI 视觉原则

采用“克制、留白、信息密度高”的 OpenAI 风格感受，但不复制 OpenAI 品牌资产、文案或组件。

| 项目 | 设计选择 |
|---|---|
| 字体 | 系统无衬线字体栈：`ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI"`；不依赖网络字体。 |
| 基础色 | 页面底色 `#F7F7F5`、卡片 `#FFFFFF`、正文 `#171717`、主操作色深绿 `#0E5B4F`。 |
| 强调色 | 蓝色用于迁移、紫色用于重构、琥珀色用于待确认、红色用于拦截；始终搭配文字标签。 |
| 边框与阴影 | 1px 中性边框、极轻阴影；避免发光、渐变、大面积深色背景和装饰性插画。 |
| 动效 | 只在流水线、抽屉、状态变化处使用 150–250ms 过渡；运行演示总动画 ≤ 2.5 秒。 |
| 图标 | 文件、记忆、云快照、盾牌、箭头、编辑、校验等线性图标；每个图标均有文字。 |

### 4.3 Context Picker 的功能实现

Context Picker 是本次升级的关键页面能力。它不是真实文件管理器，而是一个可用、可交互的数据源选择器。

```ts
type ContextSourceType =
  | 'agent_memory'
  | 'knowledge'
  | 'local_file'
  | 'online_snapshot';

type ContextSource = {
  id: string;
  name: string;
  type: ContextSourceType;
  path: string;
  selectedByDefault: boolean;
  syncedAt?: string;
};
```

实现细则：

1. 从 `mock/context_sources.json` 加载 8 个来源；默认选中 6 个；
2. 顶部筛选按钮按类型过滤，复选框直接修改 `selectedContextIds`；
3. “线上文件”只显示 `本地同步快照 · 09:20`，无链接、无网络请求；
4. 用户点击“应用”后，如果当前已有草案，Reducer 将状态重置到 `not_started`，并展示 `Context 已变化，请重新生成草案`；
5. “恢复推荐组合”恢复 6 个默认来源；
6. `block` 政策与来源是否选中无关：竞品分析即使被勾选，也会在策略层被拦截。

为了低复杂度，P0 不支持上传真实文件；“添加来源”是 P1，不应出现在本次录屏主要路径中。

### 4.4 工作台状态与交互

核心 App 状态：

```ts
type AppState = {
  mode: 'demo' | 'live';
  selectedContextIds: string[];
  transferStatus: TransferStatus;
  session?: TransferSession;
  selectedMemoryItemId?: string;
  reviewDecisions: Record<string, ReviewDecision>;
  targetEdits: Record<string, TargetBriefItemEdit>;
  activeModal?: 'contextPicker' | 'reviewCenter' | 'audit';
};
```

关键 UI 规则：

- 三栏工作台的选中卡片需联动：左栏原文高亮、中栏映射详情展开、右栏目标字段浅色高亮；
- 运行按钮在没有选中任何 Context 时禁用；
- `review` 项只能在 Review Center 中处理；
- `block` 项无“强制迁移”按钮；
- FDE 编辑每次都需要 1–80 字理由，保存后生成 Diff；
- 未完成 FDE 检查或验证前，发布按钮显示禁用原因；
- “重新开始”显示二次确认，随后恢复所有默认数据和 6/8 的 Context 选择。

### 4.5 页面实现优先级

| 优先级 | 页面/组件 | 最小可用效果 |
|---|---|---|
| P0 | 首页 + Context Picker | 展示通用定位；可真实勾选 8 个静态来源。 |
| P0 | 三栏工作台 | 点击运行、流水线动画、映射联动、目标简报。 |
| P0 | Review Center | 处理日期冲突和 Sponsor 判断。 |
| P0 | FDE Target Check | 确认、编辑首周计划、标记缺失、Diff。 |
| P0 | Readiness + Publish + Audit | 4 个验证题、86 分、发布成功。 |
| P1 | 导出 Markdown | 将 TargetBrief 拼成 Blob 下载。 |
| 不做 | 自由文件上传、登录、真实连接器 | 明确留在后续版本。 |

---

## 5. 领域逻辑与 Mock 运行引擎

### 5.1 Demo Replay 引擎

Demo 模式不需要服务器响应。前端按照预置 Fixture 执行：

```text
selectedContextIds
  → 根据 sourceId 过滤 memory_items.json
  → 使用固定 policy action
  → 组装 target_brief.json
  → 应用人工 Review 决策
  → 应用 FDE target_check_edits.json
  → 计算 readiness 及 audit events
```

运行动画只模拟各阶段的可视化进度，不伪装为模型 Token 流。顶部状态固定写为 `Demo Replay · Mock data`。

`Demo Replay` 仍然是一个完整可用的交互产品：取消勾选来源会移除与该来源关联的记忆条目；人工决策、FDE 编辑、就绪度和发布前置条件都会实时计算，不是单纯的页面跳转。

### 5.2 确定性治理层

无论 Demo 还是 Live 模式，以下逻辑必须由 TypeScript 函数控制：

| 函数 | 输入 | 输出 |
|---|---|---|
| `detectSensitivity()` | 原始片段 | `secret`、`commercial`、`normal`。 |
| `detectConflict()` | MemoryItem[] | 相同主题的冲突集合。 |
| `applyPolicy()` | MemoryItem、Policy | action、reason、是否必须 Review。 |
| `composeBrief()` | 处理后的条目、人工决定、FDE 编辑 | TargetBrief。 |
| `calculateReadiness()` | TargetBrief、检查状态 | 分项分数与总分。 |
| `validateNoSecrets()` | TargetBrief、回答、导出文本 | pass/fail 与泄露位置。 |

初版敏感检测使用明示的正则和关键词，足以覆盖 Mock：

```text
credential: /(secret|token|password|api[_-]?key)\s*[:=]/i
commercial: /(折扣底线|竞品|签约概率)/
```

模型输出若建议 `transfer` 一条命中敏感规则的文本，治理层必须强制改为 `block`。这也是技术上能证明“人/规则优先于 Agent 幻觉”的地方。

### 5.3 目标记忆编辑

`TargetBrief` 在浏览器内以字段卡片渲染。FDE 编辑不是编辑源资料，而是覆盖目标字段的展示文本：

```ts
type TargetBriefItemEdit = {
  briefField: string;
  originalText: string;
  editedText?: string;
  status: 'confirmed' | 'edited' | 'needs_info';
  reason?: string;
  addedQuestion?: string;
};
```

`composeBrief()` 最后应用这些编辑：

- `confirmed`：保留 Agent 草案，添加 FDE 已确认标记；
- `edited`：替换目标字段文案，保留原文和 Diff；
- `needs_info`：保留原字段，但把缺口加入 `openQuestions`；
- 所有操作追加一条 `AuditEvent`。

---

## 6. 大模型接入方案

### 6.1 是否需要 API Key？

**运行 Demo Replay 不需要 API Key。** 这应是默认和最稳定的本地体验。

**使用 Live Agent 需要一个可用的 OpenAI API 项目 Key 与可用模型。** 用户在本地 `.env.local` 中配置 `OPENAI_API_KEY` 和 `OPENAI_MODEL` 后重启本地服务即可。Key 必须只保存在服务端环境变量中，不能放进 React 代码、`VITE_*` 变量或提交到仓库；OpenAI 官方文档也明确要求不要把 API Key 暴露在浏览器或客户端代码中。[OpenAI API Overview](https://developers.openai.com/api/reference/overview)

不假设 ChatGPT/Codex 登录本身就是可供本地程序调用的 API 凭据；是否具备可用 Key 和模型访问权限，应在 OpenAI API 项目设置中单独确认。

### 6.2 Live Agent 的最小实现

只发起 **一次** 模型请求，不使用文件搜索、Web 搜索、MCP、并发工具调用或多轮对话：

```text
POST /api/transfer
  1. 服务端按白名单加载 selectedContextIds 对应的本地文件
  2. 将 Source Role Profile、Target Role Profile、Policy 和资料拼成输入
  3. 调用 Responses API，要求输出结构化 MemoryCandidate[]
  4. Zod 校验返回结果
  5. 用确定性治理层覆盖敏感项/冲突项
  6. composeBrief() 生成 TransferSession 并返回浏览器
```

Responses API 可生成 JSON 输出，并支持使用 JSON Schema 约束结构化结果，适合让 UI 消费固定字段而不是解析模型散文。[Create a model response](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)

### 6.3 模型请求契约

服务端输入由以下四部分组成：

1. `Source Role Profile`：售前关注客户目标、关系、承诺、商机节奏；
2. `Target Role Profile`：FDE 需要范围、依赖、风险、验收、首周计划；
3. `Transfer Policy`：含敏感信息、外部承诺、主观判断等规则；
4. `Selected Context Sources`：每段带不可变的 `sourceId`、文件名和正文。

模型系统指令关键约束：

```text
- 仅基于提供的资料，不得补充外部事实。
- 每个候选条目必须返回 sourceId 和资料中逐字可定位的 quote。
- 不确定、冲突、外部承诺和主观判断必须建议 review，不能写成 confirmed。
- 不返回凭据、折扣、竞品策略的明文。
- 使用目标角色语言改写，而不是复制源句。
```

结构化输出最小 Schema：

```ts
const MemoryCandidateSchema = z.object({
  sourceId: z.string(),
  quote: z.string().min(1),
  type: z.enum([
    'fact', 'customer_goal', 'requirement', 'commitment',
    'risk', 'opinion', 'credential', 'commercial_strategy'
  ]),
  reliability: z.enum(['confirmed', 'unverified', 'opinion', 'conflicted']),
  suggestedAction: z.enum(['transfer', 'reframe', 'review', 'block', 'discard']),
  targetField: z.string().nullable(),
  targetText: z.string().min(1),
  confidence: z.number().min(0).max(100),
  reason: z.string().min(1)
});
```

服务端二次校验：

```text
sourceId 必须已选中
quote 必须是该来源原文的子串
敏感规则命中时 action 强制为 block
冲突主题必须为 review
pending review 不能进入 confirmedScope / businessOutcome
```

如果模型返回无效 JSON、引用无法定位或网络失败：API 返回标准错误；浏览器停留在运行前状态，显示“Live Agent 未完成，请重试或切换 Demo Replay”。**不得静默降级为 Replay 并显示成 Live 结果。**

### 6.4 模型、费用与数据最小化

- `OPENAI_MODEL` 不在代码中硬编码；由用户填入其 API 项目里已启用、适合低延迟文本抽取的模型；
- 模型仅接收用户本地选中的 Mock 文本，不上传整个项目目录；
- Live 请求设置 `store: false`，并将 `max_output_tokens` 限制在满足 JSON 输出所需的范围；Responses API 的 `store` 选项默认值为 true，因此这里显式设为 false。[Create a model response](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- 不在 POC 内展示真实价格或编造成本；若成功返回 usage，可只在审计抽屉显示输入/输出 Token 数；
- 每次 Live 请求生成本地 trace ID，日志只记录模式、耗时、成功状态、Token 和错误摘要，不记录 API Key。

### 6.5 为什么不让 LLM 决定一切

| 任务 | 实现方式 | 原因 |
|---|---|---|
| 从自然语言中抽取候选记忆 | LLM（Live）/Fixture（Demo） | 语义理解最有价值。 |
| 源句是否真实存在 | 程序字符串校验 | 防止编造引用。 |
| 凭据/折扣是否拦截 | 确定性规则 | 不能由模型自由裁量。 |
| 冲突项是否发布 | 人工确认 | 涉及项目承诺与责任。 |
| Brief 组装、就绪度 | 确定性函数 | 保证录屏稳定、可测、可解释。 |

---

## 7. 本地 API 设计

### 7.1 端点

| 方法 | 路径 | 模式 | 作用 |
|---|---|---|---|
| `GET` | `/api/health` | 全部 | 返回应用版本、Demo 是否可用、Live Agent 是否已配置。 |
| `POST` | `/api/transfer` | Live | 按已选 Context 运行一次真实 LLM 转换并返回 `TransferSession`。 |
| `GET` | `/api/mock/context/:id` | 可选 | 开发期按白名单返回原始 Mock 内容；生产 UI 可直接静态导入而不调用。 |

Demo Replay 不需要调用 `/api/transfer`。

### 7.2 `POST /api/transfer`

请求：

```json
{
  "contextIds": ["CTX-01", "CTX-02", "CTX-03", "CTX-04", "CTX-05", "CTX-06"],
  "sourceRoleId": "sales",
  "targetRoleId": "fde"
}
```

成功响应：

```json
{
  "mode": "live",
  "session": { "...": "TransferSession" },
  "usage": { "inputTokens": 0, "outputTokens": 0 },
  "traceId": "cb-local-001"
}
```

错误响应：

```json
{
  "error": {
    "code": "LIVE_AGENT_NOT_CONFIGURED | MODEL_OUTPUT_INVALID | UPSTREAM_FAILED",
    "message": "可供用户阅读的错误说明"
  }
}
```

### 7.3 安全边界

- 服务端使用 `contextId → 固定文件路径` 映射，不能接收浏览器传来的任意路径；
- `.env.local` 加入 `.gitignore`；`.env.example` 只留空值；
- `/api/health` 不透露 Key 存在与否之外的信息；
- Mock 内的 `SSO_CLIENT_SECRET` 只作为敏感拦截测试文本，不能出现在 API 响应最终 Brief、导出物或客户端日志中；
- 本期 Express 只绑定 `127.0.0.1`，不暴露局域网。

---

## 8. 测试与验收实施

### 8.1 必须自动化的测试

| 测试 | 断言 |
|---|---|
| 推荐 Context 组合 | 初始为 CTX-01 至 CTX-06，共 6 个。 |
| Context 过滤 | 取消 `CTX-04` 后，该来源关联的技术依赖不进入输出。 |
| 敏感拦截 | 包含 `SSO_CLIENT_SECRET`、折扣底线、竞品信息的文本不能出现在 Brief、验证答案或导出物。 |
| 冲突规则 | M-03 在人工确认前保持 `review`，不能进入正式排期。 |
| 主观判断 | M-04 只能以“待验证信号”迁移。 |
| FDE 编辑 | 无理由无法保存；保存后能看到原文、编辑文案和审计事件。 |
| 发布前置条件 | 未完成 Review、FDE Check 或验证时，发布不可用。 |
| 就绪度 | 默认场景结果为 86；规则变化时能解释分项。 |

### 8.2 手工验收

1. 无 `.env.local` 或没有 Key 时，`npm run dev` 可完整完成 Replay；
2. 打开 Context Picker，可看见四种来源；勾选/恢复推荐组合可用；
3. 三栏联动清晰，不会因窄屏重叠；
4. Review Center 与 FDE 编辑的视觉状态明确；
5. 录屏走一遍不超过 3 分钟；
6. 配置 Live 后，成功/失败都不会泄露 Key 或伪装运行模式。

---

## 9. 实施顺序与工作量控制

### 9.1 实施顺序

1. 搭建 Vite/React/TypeScript 与全局视觉 Tokens；
2. 建立 PRD 中定义的 Mock 文件、领域类型和 Fixture；
3. 完成 Context Picker、首页和三栏静态布局；
4. 实现 Demo Replay 状态机、策略、Review、FDE 编辑和就绪度；
5. 补 Vitest 测试与录屏路径；
6. 最后才接入 Express 与可选 Live Agent；
7. 用 Demo Replay 完成最终视觉和交互验收后，再测试 Live Agent。

### 9.2 复杂度红线

以下条件任一出现，就不应继续扩展，而应回到 P0：

- 需要用户登录、真实账户授权或第三方 API；
- 需要上传和解析 PDF/Office 文件；
- 需要持久化数据库；
- 需要模型连续多轮规划或执行真实工具动作；
- 为实现某个视觉效果引入大型 UI 框架、动画库或图表库；
- 为了 Live 模型而牺牲 Replay 模式的稳定录屏流程。

---

## 10. 与题目三个加分项的技术落点

| 题目问题 | 产品机制 | 技术实现 |
|---|---|---|
| 3.1 为什么保留人工 | Review Center + FDE Target Check | 状态机阻止自动发布；ReviewDecision / TargetBriefItemEdit 进入审计。 |
| 3.2 最容易错、如何验证 | 承诺/推测被误当事实；来源/敏感泄露 | 引用子串校验、策略覆盖、敏感泄露测试、四题接手验证。 |
| 3.3 下周上线最难补什么 | 权威、实时、可授权的交付数据与组织流程 | POC 仅用快照；技术方案明确真实连接器、权限、环境、评测与审计是生产缺口。 |

本技术方案的终点是一个稳定、可复现、诚实标注 Demo/Live 模式差异的本地 POC；不是伪装成已经能连接企业生产系统的平台。
