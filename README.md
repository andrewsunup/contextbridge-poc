# ContextBridge POC

一个可本地运行的企业场景 Demo：把源角色的本地 Agent 记忆与本地知识文件，转换为目标角色可以检查、编辑和接手的工作上下文。

默认演示场景是“售前人员 → FDE”，产品能力本身不绑定任意两个角色。启动前，用户需要先配置角色、文件和转换要求，再生成任务卡。

## 本地运行

前置条件：Node.js 20+ 与 pnpm 9+。

```bash
pnpm install
pnpm dev
```

在浏览器打开 `http://127.0.0.1:5173`。默认的 **Demo Replay** 完全使用本地 Mock 数据，不需要 API Key，也不会访问 CRM、文件系统或任何第三方服务。

## 三分钟演示路径

1. 在首页选择“售前人员 → FDE”，选择 `Codex（本地）`，在 `~/.codex/agents/sales/memory/` 的 Mock 目录勾选两份中文记忆；再从 `~/Desktop/ContextBridge Demo Inputs/` 添加一份中文知识文件。也可点击“载入三份 Demo 文件”。
2. 输入转换要求，生成交接任务卡；从任务卡点击“开始交接”。
3. 对照左侧售前原话、中间的治理决策和右侧 FDE 行动语言；重点点开上线预估、主观判断和敏感凭据。
4. 处理 3 条人工确认项。
5. 将草案交给 FDE；检查“范围、风险、首周动作”，并任选一项编辑、填写理由。
6. 发布交接包，展示接手验证题和审计记录。

## 可选：Live Agent

该模式只提供后端接口，避免浏览器暴露密钥；录屏请保持默认 Demo Replay，以保障结果稳定。

```bash
cp .env.example .env
# 在 .env 中填写：
# OPENAI_API_KEY=...
# OPENAI_MODEL=...
```

然后调用 `POST /api/live-transfer`，请求体为 `{ "files": [{ "name": "memory.md", "content": "..." }] }`。未配置密钥时接口明确返回 409；不会静默降级或把密钥传到前端。

## 项目结构

- `demo-inputs/`：三份中文 Mock 文件。两份记忆由界面模拟为 Codex 记忆目录；一份知识文件可用系统文件选择器实际选择。
- `src/data.ts`：角色、Mock 文件、记忆条目、目标角色简报。
- `src/engine.ts`：确定性转换、敏感信息阻断、人工确认和就绪度规则。
- `src/main.tsx`：完整三步交互界面。
- `server/index.ts`：健康检查和可选的服务端模型调用。
- `tests/engine.test.ts`：敏感信息不迁移与转换规则测试。

完整的产品与工程说明见 [PRD_ContextBridge.md](./PRD_ContextBridge.md) 和 [TECHNICAL_PLAN_ContextBridge.md](./TECHNICAL_PLAN_ContextBridge.md)。
