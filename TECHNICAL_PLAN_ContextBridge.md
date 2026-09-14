# ContextBridge POC 技术方案（v3）

> **v3 输入收敛**：录屏固定使用 3 份中文 Mock 文件：两份通过“选择 Agent → Codex Mock 记忆路径”勾选的记忆，及一份由系统文件选择器添加的本地知识文件。记忆选择不调用真实 Codex 内部数据，也不使用浏览器上传；`~/.codex/agents/sales/memory/` 是明确标注的 Mock 路径。本文中任何旧的“五份文件、记忆 FileReader、多份知识文件”表述均以此为准。

## 1. 方案结论

本次 MVP 使用 **React + Vite + TypeScript + 原生 CSS**。默认采用完全本地、确定性的 `Demo Replay`：从选择的 Agent Mock 记忆与本地知识文件读取文本，按预置治理规则生成可验证的交接结果。无需 API Key、无需网络、无需数据库。

可选的 Express 服务仅提供健康检查和后续 Live Agent 扩展入口；录屏主路径不依赖它。这样既能演示“文件和 Prompt 可配置”，也能保证结果稳定、可测试、可在个人电脑运行。

```
Browser (React)
  ├─ Task Composer：角色、Agent 记忆路径、单份知识 File input、Prompt、任务卡
  ├─ Agent Mock catalog：模拟读取 Codex 记忆目录
  ├─ FileReader：只读取用户本地知识 .md/.txt/.json
  ├─ Demo Replay engine：规则匹配、角色化改写、审阅状态
  └─ UI：源语言 / Bridge 决策 / 目标语言并排

Express (optional)
  ├─ GET /api/health
  └─ POST /api/live-transfer（可选、服务端 Key）
```

## 2. 取舍与边界

| 决策 | 选择 | 原因 |
|---|---|---|
| Agent 记忆 | 选择 Agent → Mock 路径目录 → 勾选文件 | 体现“从 Agent 的工作记忆中选取”，又不声称已读取真实 Codex 数据。 |
| 本地知识文件 | 浏览器 `<input type=file>` + FileReader，限制一份 | 不需要后端上传、无权限复杂度，实际可从桌面选择。 |
| Codex 目录 | `~/.codex/agents/sales/memory/` 的静态目录样式 | 录屏清楚表达产品连接模式；真实接入留给上线阶段的授权连接器。 |
| 文件格式 | `.md,.txt,.json` | 足够承载高质量 Mock，避免 PDF/OCR/Office 解析。 |
| 转换 | 规则驱动 Replay | 录像稳定，能准确展示人工边界和前后差异。 |
| 任务快照 | React state | 生成任务卡后冻结；改配置即作废，无需持久化。 |
| LLM | 可选后端接口 | 演示并不需要 Key；若启用，Key 永不进入浏览器。 |

不使用数据库、向量库、登录、在线 CRM/网盘连接、LangGraph、Dify 或复杂工作流引擎。

## 3. 本地运行

### 3.1 前置条件

Node.js 20+，pnpm 9+。安装后：

```bash
pnpm install
pnpm dev
```

访问 `http://127.0.0.1:5173`。Demo Replay 不需要 `.env` 或 API Key。

### 3.2 目录结构

```text
contextbridge-poc/
├── demo-inputs/                   # 受版本控制的桌面演示文件原件
│   ├── 售前工作记忆_陈宇.md
│   ├── 售前客户跟进_陈宇.md
│   └── 项目交接知识_澄澈零售.md
├── src/
│   ├── data.ts                    # 角色、内置 Fixture、转换证据
│   ├── engine.ts                  # 规则、任务快照、Brief 组装
│   ├── main.tsx                   # 配置器、任务卡、工作台、审阅/检查
│   ├── types.ts                   # 领域类型
│   └── styles.css
├── server/index.ts                # 可选 Live Agent 后端
└── tests/engine.test.ts
```

本次交付已将仓库中的同名文件复制到 `~/Desktop/ContextBridge Demo Inputs/`。在另一台电脑上运行时，可直接从 `demo-inputs/` 复制这三个虚构样例；两份记忆由界面中的 Codex Mock 目录提供，知识文件可在桌面实际选择。MVP 同时保留“载入三份 Demo 文件”快捷按钮，便于稳定录屏。

### 3.3 环境变量（可选）

```bash
cp .env.example .env

# 默认 Demo Replay 不需要填写
OPENAI_API_KEY=
OPENAI_MODEL=
```

模型 Key 仅由 `server/index.ts` 读取；禁止使用 `VITE_*` 暴露给前端，也不提交 `.env`。

## 4. 数据模型

```ts
type RoleId = 'sales' | 'csm' | 'support' | 'fde' | 'ops';
type AgentId = 'codex' | 'cursor' | 'claude_code';

type SelectedFile = {
  id: string;
  name: string;
  kind: 'agent_memory' | 'knowledge';
  origin: 'agent_memory_path' | 'desktop_upload' | 'demo_fixture';
  pathLabel: string;
  content: string;
  size: number;
};

type TaskDraft = {
  sourceRole?: RoleId;
  targetRole?: RoleId;
  selectedAgent?: AgentId;
  memoryFiles: SelectedFile[];
  knowledgeFiles: SelectedFile[];
  prompt: string;
};

type TransferTask = Required<TaskDraft> & {
  id: string;
  createdAtLabel: string;
  status: 'ready' | 'running' | 'review' | 'target_check' | 'published';
};

type MemoryItem = {
  id: string;
  sourceFileId: string;
  sourceText: string;
  sourceLanguage: 'customer_quote' | 'sales_promise' | 'subjective_signal' | 'sensitive' | 'confirmed_fact' | 'dependency_gap';
  action: 'transfer' | 'reframe' | 'review' | 'block';
  targetSection?: 'scope' | 'dependencies' | 'risks' | 'firstWeekPlan';
  targetText: string;
  reason: string;
};
```

## 5. 前端设计与状态

### 5.1 页面状态

```text
configure (initial)
  -- valid inputs --> task-card
  -- edit configuration --> configure (card invalidated)
task-card -- start --> running -- 1.2s --> review
review -- all human decisions --> target-check
target-check -- required checks --> published
```

初始页面绝不渲染任务卡或“开始交接”。`generateTask` 会深拷贝当前 `TaskDraft`；之后对表单任意编辑都会清除 task snapshot 和下游状态。

### 5.2 任务配置器

- 源/目标角色用原生 `<select>` 实现，目标角色过滤与源相同的选项；
- Agent 下拉框展示 Codex、Cursor、Claude Code；本期只有 Codex 显示记忆目录；
- 选择 Codex 后显示 `~/.codex/agents/sales/memory/` 及两份可勾选的中文 Mock 记忆；它们的 `origin` 为 `agent_memory_path`；
- 唯一隐藏 input 为 `knowledgeInputRef`，`multiple=false`，限定 `.md,.txt,.json`；`onChange` 用 `file.text()` 转为 `SelectedFile`，标记 `desktop_upload`；
- 显示文件名、大小、来源、移除按钮；不将文件上传到网络；
- “载入三份 Demo 文件”选择 Codex、两份记忆和一份内置知识 Fixture，给录屏备用；
- Prompt 受控输入、500 字限制，任务卡展示前 90 字。

### 5.3 工作台

不再使用固定 6/8 Context Picker、线上快照或多段流水线。

| 区域 | React 数据 | 表现 |
|---|---|---|
| 源语言 | `task.memoryFiles + task.knowledgeFiles + MemoryItem.sourceText` | 文件 tabs + 纯原话，标签指出售前承诺/判断/敏感。 |
| Bridge | `MemoryItem` | 四种动作的紧凑列表；选中条目展示“原文 → 目标文本 → 理由”。 |
| 目标语言 | `Brief` | FDE 范围/依赖/风险/首周动作；人审后可进入目标检查。 |

“前后差异”是主要视觉层级：左栏标题使用“交接前：售前怎么说”，右栏标题使用“交接后：FDE 怎么接手”。字体大小不低于 14px 的主要文本；仅元数据可用 12px。

### 5.4 人工与目标检查

- `review` 条目打开一次一条的 Dialog；
- 决策写入 `Record<itemId, ReviewDecision>`；
- FDE 编辑通过 textarea + 必填 reason；写入 `TargetEdit`；
- 发布条件：所有 visible review 条目有决定，且 `scope`、`risks`、`firstWeekPlan` 已 check；
- 发布页使用 state 生成验证题，不导出真实文件。

## 6. Replay 转换引擎

### 6.1 输入与输出

引擎接受 `TransferTask`。它只对选择的文件产生条目；默认 Fixture 使用可追溯的规则表。若用户选择任意同类自定义文件，页面仍会显示原文、任务配置和一个通用 Brief；不会谎称模型理解了不存在的语义。

```ts
runReplay(task): {
  items: MemoryItem[];
  brief: Brief;
  policySummary: { transferred: number; reframed: number; review: number; blocked: number };
}
```

### 6.2 规则

1. 任意命中 `CLIENT_SECRET|API_KEY|token|折扣|竞品` 的片段 → `block`；
2. 任意命中 `预计上线|上线|私有化|内网|我感觉|可能|验收` 的片段 → `review`；
3. 命中“库存/收银不接入”“运营手册”“Salesforce”“Azure AD”等确认句 → `transfer`；
4. 命中“4 小时/1 小时”“字段字典/API Scope/测试账号”等 → `reframe`；
5. 固定 Fixture 的精确条目优先于通用关键词，保证 Demo 中源/目标语言的强对照。

### 6.3 安全规则

- `block` 条目可以在源栏看到用于演示拦截，但其 `sourceText` 不得出现在 Brief、发布页、目标编辑初始值和审计的详细输出；
- Prompt 不能放宽 block/review 优先级；
- DOM 和控制台不记录完整用户上传文件之外的系统数据；
- 不在任何请求中上传文件，除非用户自行启用 Live Agent。

## 7. 可选 Live Agent

### 7.1 是否需要 API Key

**不需要。** 录屏和本地 Demo 只使用 Replay。`OPENAI_API_KEY` 和 `OPENAI_MODEL` 只有用户主动使用 `/api/live-transfer` 时才需要。

### 7.2 接口

| Method | Path | 行为 |
|---|---|---|
| GET | `/api/health` | 返回 Demo 与 Live 配置状态。 |
| POST | `/api/live-transfer` | 接收用户选择文件内容与角色/Prompt，调用模型后返回结构化 Brief。 |

请求应设置 `store: false`；服务端把模型输出解析为严格 JSON 后，再应用确定性 `block` 和 `review` 检查。无 Key 返回 409，绝不静默回退为“模型已运行”。

## 8. 测试计划

### 8.1 单元测试

- 选择 Codex Mock 目录后可勾选 2 个 memory，桌面知识文件限制为 1 个；
- 配置不完整时无法生成任务卡；
- 配置变更使任务卡失效；
- 10/06 只能为 review，不能自动变上线承诺；
- secret、折扣、竞品不进入目标 Brief；
- FDE 编辑必须有理由；
- 发布状态满足所有人工确认与三项 target checks。

### 8.2 手工验收

1. 在首页选择 Codex，确认 `~/.codex/agents/sales/memory/` 显示两份记忆并勾选；
2. 从 `~/Desktop/ContextBridge Demo Inputs/` 通过文件选择器添加一份知识文件；
3. 用“一键载入三份 Demo 文件”完成演示组合；
4. 生成任务卡后才出现“开始交接”；
5. 用售前 → FDE 主路径完成源/目标语言对照；
6. 切换到 CSM → 运维并确认任务卡角色变化；
7. 完整录屏不超过 3 分钟。

## 9. 实施顺序与复杂度控制

1. 创建/复制真实 Mock 文件；
2. 重建领域类型、fixture 和 Replay 规则；
3. 重建首页配置器与任务卡状态机；
4. 把工作台简化为“前语言 / 决策 / 后语言”；
5. 接回人工确认、FDE 编辑和发布页；
6. 编写规则测试、实际从桌面选择文件并完成浏览器验收。

红线：不为模拟连接器、文件系统权限、通用文档解析或真实 LLM 而增加录屏不稳定性。
