# ContextBridge POC

ContextBridge 是一个可本地运行的跨角色 Context 转换 Demo：它不只是整理文件，而是将源角色的工作记忆按目标角色的职责、风险边界与下一步动作重构为可接手的交接包。

默认场景为“售前人员 → FDE”，但角色配置本身不绑定这一条路径。

## 1. 快速运行

### 前置条件

- Node.js 20+
- pnpm 9+

### 启动

```bash
git clone <repo-url>
cd contextbridge-poc
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:5173`。

`pnpm dev` 会同时启动：

- 前端界面：`127.0.0.1:5173`
- 本地服务：`127.0.0.1:8787`，负责桌面文件导出和可选的 Live Model 接口

默认使用 **Demo Replay**，不需要 API Key，也不会请求任何外部模型或企业系统。

## 2. Mock 数据与演示配置

仓库内只有三份中文 Mock 文件，位于 `demo-inputs/`：

| 文件 | 在 Demo 中的来源 | 作用 |
|---|---|---|
| `售前工作记忆_陈宇.md` | Codex Mock 记忆路径 | 售前口吻的业务目标、日期预估、主观判断和敏感噪声。 |
| `售前客户跟进_陈宇.md` | Codex Mock 记忆路径 | 售前跟进线索、试点门店与未确认验收样本。 |
| `项目交接知识_澄澈零售.md` | 本地知识文件 | 已确认范围、技术依赖和上线前缺口。 |

首页操作方式：

1. 选择源用户“售前人员”和目标用户“FDE”。
2. 在 Agent 中选择 `Codex（本地）`，然后在显示的 Mock 目录 `~/.codex/agents/sales/memory/` 勾选两份记忆。
3. 点击“选择知识文件”，在克隆项目的 `demo-inputs/` 目录中选择 `项目交接知识_澄澈零售.md`。
4. 填写转换要求，生成任务卡并开始交接。

这里的 Codex 目录是产品交互 Mock，不会读取用户真实的 Codex 记忆文件；它用来演示“先选择 Agent，再选择其记忆”的产品逻辑。

## 3. 发布与本地交接包

完成 3 条人工确认、FDE 检查和发布后，系统会生成一份完整的 Markdown 交接包，包含：

- 角色、转换要求和输入文件清单；
- 已确认范围、依赖、风险、首周动作；
- 已阻断内容摘要；
- 人工确认记录和 FDE 修改理由。

文件写入**运行 Demo 的当前本地用户**桌面：

```text
~/Desktop/ContextBridge_<源角色>_to_<目标角色>_交接包_<时间>.md
```

路径通过 Node.js `os.homedir()` 动态计算，未写死任何用户名。发布页会显示实际文件路径。

## 4. API Key 与 Live Model（可选）

### 配置 API Key

1. 在 OpenAI Platform 创建 API Key。
2. 在项目根目录创建本地环境变量文件：

```bash
cp .env.example .env
```

3. 编辑 `.env`：

```env
CONTEXTBRIDGE_MODE=demo
OPENAI_API_KEY=你的_API_Key
OPENAI_MODEL=gpt-5
```

4. 重启 `pnpm dev`，然后检查本地服务：

```bash
curl http://127.0.0.1:8787/api/health
```

当响应中出现以下字段时，说明服务端已读取 Key：

```json
{ "liveModelConfigured": true }
```

OpenAI 官方建议将 Key 放在服务器环境变量中，而非浏览器端代码中。[OpenAI API Quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request)

### 当前 Live Model 的边界

项目已实现服务端接口 `POST /api/live-transfer`：它读取 `.env` 中的 Key，通过 OpenAI Responses API 处理调用方传入的文件内容，并使用 `store: false`。

但当前页面默认、且仅使用 **Demo Replay** 来完成主流程；配置 Key **不会自动把页面切换为真实模型输出**。这样可以保证面试录屏结果稳定、可复现，也不产生外部调用成本。

如需验证接口，可向 `POST /api/live-transfer` 发送：

```json
{
  "files": [
    { "name": "memory.md", "content": "需要转换的 Context 内容" }
  ]
}
```

未配置 `OPENAI_API_KEY` 或 `OPENAI_MODEL` 时，接口会返回 `409`，不会静默伪装为模型已运行。

若要在产品页面中真正启用 Live Model，还需要新增一个“Demo Replay / Live Model”模式开关，并将模型返回的结构化 Brief 回填到工作台；当前 POC 有意未启用该路径。

### 安全注意事项

- `.env` 已被 `.gitignore` 忽略，绝不能将其提交到远端仓库。
- 不要使用 `VITE_OPENAI_API_KEY`，也不要把 Key 放到浏览器代码、截图或录屏中。
- Live Model 会把调用方提供的 Context 文本发送到外部模型服务；真实企业数据接入前需完成数据权限、脱敏与合规评估。
- 仅用于本地演示时，优先使用默认 Demo Replay。

## 5. 常用命令

```bash
pnpm dev        # 启动前端与本地服务
pnpm typecheck  # TypeScript 检查
pnpm test       # 运行治理规则测试
pnpm build      # 构建前端生产产物
pnpm start      # 仅启动本地服务（用于托管 dist 或 API）
```

## 6. 项目结构

```text
demo-inputs/        三份中文 Mock 文件
src/data.ts         角色、Mock、转换证据和默认 Brief
src/engine.ts       确定性转换、敏感信息阻断、人工确认规则
src/main.tsx        配置器、交接工作台、FDE 检查和发布页面
server/index.ts     桌面导出与可选 OpenAI Live Model 服务端接口
tests/              规则测试
```

更多产品设计见 [PRD_ContextBridge.md](./PRD_ContextBridge.md)，工程细节见 [TECHNICAL_PLAN_ContextBridge.md](./TECHNICAL_PLAN_ContextBridge.md)。
