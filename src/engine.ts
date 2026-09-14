import { baseBrief, demoItems } from './data';
import type { AuditEvent, Brief, LocalFile, MemoryItem, ReviewChoice, TargetEdit, TransferTask } from './types';

const has = (files: LocalFile[], token: string) => files.some((file) => file.content.includes(token));

export function isTaskValid(sourceRole: string, targetRole: string, memoryFiles: LocalFile[], knowledgeFiles: LocalFile[], prompt: string) {
  return Boolean(sourceRole && targetRole && sourceRole !== targetRole && memoryFiles.length && knowledgeFiles.length && prompt.trim());
}

export function buildItems(task: TransferTask): MemoryItem[] {
  const allFiles = [...task.memoryFiles, ...task.knowledgeFiles];
  const ids = new Set(allFiles.map((file) => file.id));
  const matched = demoItems.filter((item) => ids.has(item.sourceFileId) || allFiles.some((file) => file.content.includes(item.sourceText.slice(0, 18))));
  if (matched.length) return matched;
  const text = allFiles.map((file) => file.content).join('\n');
  const generic: MemoryItem[] = [{ id: 'generic-context', sourceFileId: allFiles[0].id, sourceFileName: allFiles[0].name, sourceText: text.slice(0, 260) || '已选择本地文件', sourceLanguage: 'confirmed_fact', action: 'reframe', targetSection: 'scope', targetText: `已读取 ${task.memoryFiles.length} 份 Agent Memory 与 ${task.knowledgeFiles.length} 份 Knowledge；请在技术发现会中确认范围和责任人。`, reason: '自定义文件未命中 Demo Fixture 规则，保留原文并生成可验证的通用接手项。' }];
  if (/secret|token|api[_-]?key/i.test(text)) generic.push({ id: 'generic-sensitive', sourceFileId: allFiles[0].id, sourceFileName: allFiles[0].name, sourceText: '检测到可能的凭据字段', sourceLanguage: 'sensitive', action: 'block', targetText: '已阻断疑似凭据。', reason: '凭据不可迁移。' });
  return generic;
}

export function buildBrief(task: TransferTask, reviews: Record<string, ReviewChoice>, edits: TargetEdit[]): Brief {
  const brief = structuredClone(baseBrief);
  const allFiles = [...task.memoryFiles, ...task.knowledgeFiles];
  const visibleText = allFiles.map((file) => file.content).join('\n');
  if (!has(task.knowledgeFiles, '库存系统')) brief.scope = brief.scope.filter((line) => !line.includes('库存'));
  if (!has(task.knowledgeFiles, 'Azure AD')) brief.dependencies = brief.dependencies.filter((line) => !line.includes('Azure AD'));
  if (reviews['M-02'] !== 'reference') brief.risks[0] = '上线日期仍待技术发现会确认；售前预估不作为交付承诺。';
  if (reviews['M-03'] === 'signal') brief.risks.push('待验证信号：首次发现会确认 Champion 对试点价值的认同度。');
  if (reviews['M-04'] === 'open') brief.risks[1] = '内网/私有化保留为发现会高优先级澄清项。';
  if (reviews['M-09'] === 'prepare') brief.firstWeekPlan.push('与客户共同确认试点用户分组、培训计划和验收样本。');
  if (!/折扣|ExampleAssist/.test(visibleText)) brief.blockedSummary = brief.blockedSummary.filter((line) => !line.includes('商业'));
  if (!/SECRET|secret|token/i.test(visibleText)) brief.blockedSummary = brief.blockedSummary.filter((line) => !line.includes('凭据'));
  for (const edit of edits) if (brief[edit.field][edit.index] !== undefined) brief[edit.field][edit.index] = edit.after;
  return brief;
}

export function createAudit(task: TransferTask, reviews: Record<string, ReviewChoice>, edits: TargetEdit[], published: boolean): AuditEvent[] {
  const events: AuditEvent[] = [
    { actor: 'Agent', title: '读取本地交接任务', detail: `${task.memoryFiles.length} 份 Codex Local Agent Memory，${task.knowledgeFiles.length} 份本地 Knowledge。` },
    { actor: 'Agent', title: '按角色边界完成转换', detail: `${task.sourceRole} 的原话已按 ${task.targetRole} 的职责改写为交付 Brief。` },
    { actor: 'Agent', title: '敏感信息已阻断', detail: '凭据、折扣与竞品策略没有进入目标 Brief。', tone: 'block' }
  ];
  Object.entries(reviews).forEach(([id, choice]) => events.push({ actor: '交接发起人', title: `人工处理 ${id}`, detail: `决策：${choice}`, tone: 'review' }));
  edits.forEach((edit) => events.push({ actor: 'FDE', title: `修改${edit.field}`, detail: edit.reason, tone: 'review' }));
  if (published) events.push({ actor: 'FDE', title: '发布交接包', detail: '接手检查已完成。' });
  return events;
}
