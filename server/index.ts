import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import os from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const mode = process.env.CONTEXTBRIDGE_MODE ?? 'demo';

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, mode, liveModelConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) });
});

const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => `- ${item}`).join('\n') : '- 无';
const safeLabel = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value.trim().replace(/[\\/:*?"<>|]/g, '-') : fallback;

app.post('/api/export-handoff', async (request, response) => {
  const task = request.body?.task;
  const brief = request.body?.brief;
  if (!task || !brief || typeof task !== 'object' || typeof brief !== 'object') {
    response.status(400).json({ error: '缺少可导出的交接任务或交接 Brief。' });
    return;
  }

  const source = safeLabel(task.sourceRoleLabel, '源角色');
  const target = safeLabel(task.targetRoleLabel, '目标角色');
  const prompt = typeof task.prompt === 'string' ? task.prompt.trim() : '未填写';
  const files = Array.isArray(task.files) ? task.files.filter((item: unknown): item is string => typeof item === 'string').map((item: string) => `- ${item}`).join('\n') : '- 无';
  const reviews = request.body?.reviews && typeof request.body.reviews === 'object'
    ? Object.entries(request.body.reviews).map(([id, value]) => `- ${id}：${String(value)}`).join('\n') || '- 无'
    : '- 无';
  const edits = Array.isArray(request.body?.edits)
    ? request.body.edits.filter((item: unknown): item is { field?: string; after?: string; reason?: string } => Boolean(item) && typeof item === 'object').map((item: { field?: string; after?: string; reason?: string }) => `- ${item.field ?? '目标内容'}：${item.after ?? ''}\n  修改理由：${item.reason ?? ''}`).join('\n') || '- 无'
    : '- 无';
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
  const fileName = `ContextBridge_${source}_to_${target}_交接包_${timestamp}.md`;
  const markdown = `# ContextBridge 交接包\n\n> 已发布：${new Date().toLocaleString('zh-CN')}\n\n## 交接路径\n\n${source} → ${target}\n\n## 转换要求\n\n${prompt}\n\n## 输入 Context\n\n${files}\n\n## 已确认范围与业务结果\n\n${list(brief.scope)}\n\n## 交付依赖\n\n${list(brief.dependencies)}\n\n## 风险与待确认\n\n${list(brief.risks)}\n\n## 首周动作\n\n${list(brief.firstWeekPlan)}\n\n## 不迁移内容\n\n${list(brief.blockedSummary)}\n\n## 人工确认记录\n\n${reviews}\n\n## 目标角色修订\n\n${edits}\n\n---\n\n由 ContextBridge Demo Replay 在本地生成。交接包可用于启动发现会，不等于对外承诺上线。\n`;

  try {
    const desktop = path.join(os.homedir(), 'Desktop');
    await mkdir(desktop, { recursive: true });
    const filePath = path.join(desktop, fileName);
    await writeFile(filePath, markdown, 'utf8');
    response.json({ ok: true, fileName, filePath });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : '无法写入桌面文件。' });
  }
});

/**
 * This endpoint intentionally stays optional: the UI ships with a deterministic
 * Demo Replay mode for recordings. It is useful when the interviewer asks how
 * the exact same product could call a model without exposing a browser API key.
 */
app.post('/api/live-transfer', async (request, response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    response.status(409).json({
      error: 'Live Agent 未配置。请在 .env 中设置 OPENAI_API_KEY 与 OPENAI_MODEL；Demo Replay 无需 API Key。'
    });
    return;
  }

  const files = Array.isArray(request.body?.files)
    ? request.body.files.filter((file: unknown): file is { name: string; content: string } => Boolean(file) && typeof (file as { name?: unknown }).name === 'string' && typeof (file as { content?: unknown }).content === 'string')
    : [];
  if (!files.length) {
    response.status(400).json({ error: '至少选择一个 Context 来源。' });
    return;
  }

  try {
    const client = new OpenAI({ apiKey });
    const result = await client.responses.create({
      model,
      store: false,
      input: [
        {
          role: 'system',
          content: '你是企业交接 Agent。将售前 Context 转换为 FDE 可执行交接简报。绝不输出凭据、折扣、竞品或未确认上线承诺。返回 JSON，对象字段为 overview, outcome, scope, stakeholders, dependencies, risks, firstWeekPlan, questions；每个字段是字符串数组。'
        },
        {
          role: 'user',
          content: files.map((file: { name: string; content: string }) => `## ${file.name}\n${file.content}`).join('\n\n')
        }
      ],
      text: { format: { type: 'json_object' } }
    });

    const text = result.output_text;
    response.json({ brief: JSON.parse(text), mode: 'live' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '模型调用失败';
    response.status(502).json({ error: message });
  }
});

const directory = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(directory, '../dist');
app.use(express.static(dist));

app.listen(port, '127.0.0.1', () => {
  console.log(`ContextBridge server listening on http://127.0.0.1:${port} (${mode} mode)`);
});
