# ContextBridge POC

一个可本地运行的企业场景 Demo：把售前人员的 Agent 记忆、离线文件和线上系统快照，转换为 FDE 可以检查、编辑和接手的交付上下文。

默认演示场景是“售前人员 → FDE”，产品能力本身不绑定任意两个角色。

## 本地运行

前置条件：Node.js 20+ 与 pnpm 9+。

```bash
pnpm install
pnpm dev
```

在浏览器打开 `http://127.0.0.1:5173`。默认的 **Demo Replay** 完全使用本地 Mock 数据，不需要 API Key，也不会访问 CRM、文件系统或任何第三方服务。

## 三分钟演示路径

1. 首页点击“开始交接”，在 Context Picker 展示来自 Agent 记忆、离线文件、知识与线上快照的可选来源。
2. 保持推荐的 6 个来源，点击“生成 FDE 交接草案”。
3. 在中栏查看直接迁移、角色化重构、人工确认与敏感拦截的差异；重点点开含凭据/商业策略的“已拦截”记录。
4. 处理 4 条人工确认项。这里故意保留上线日期、主观判断、部署约束和验收准备度给人决定。
5. 将草案交给 FDE；对“范围、风险、首周计划”执行检查，并任选一项编辑、填写理由。
6. 发布交接包，展示四道接手验证题和审计记录。

## 可选：Live Agent

该模式只提供后端接口，避免浏览器暴露密钥；录屏请保持默认 Demo Replay，以保障结果稳定。

```bash
cp .env.example .env
# 在 .env 中填写：
# OPENAI_API_KEY=...
# OPENAI_MODEL=...
```

然后调用 `POST /api/live-transfer`，请求体为 `{ "sourceIds": ["CTX-01"] }`。未配置密钥时接口明确返回 409；不会静默降级或把密钥传到前端。

## 项目结构

- `src/data.ts`：Mock Context、记忆条目、目标角色简报。
- `src/engine.ts`：确定性转换、敏感信息阻断、人工确认和就绪度规则。
- `src/main.tsx`：完整三步交互界面。
- `server/index.ts`：健康检查和可选的服务端模型调用。
- `tests/engine.test.ts`：敏感信息不迁移与转换规则测试。

完整的产品与工程说明见 [PRD_ContextBridge.md](./PRD_ContextBridge.md) 和 [TECHNICAL_PLAN_ContextBridge.md](./TECHNICAL_PLAN_ContextBridge.md)。
