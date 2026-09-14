import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sources } from '../src/data';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const mode = process.env.CONTEXTBRIDGE_MODE ?? 'demo';

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, mode, liveModelConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) });
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

  const selectedIds = Array.isArray(request.body?.sourceIds)
    ? request.body.sourceIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];
  const selected = sources.filter((source) => selectedIds.includes(source.id));
  if (!selected.length) {
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
          content: selected.map((source) => `## ${source.name}\n${source.content}`).join('\n\n')
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
