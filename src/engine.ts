import { baseBrief, memoryItems } from './data';
import type { AuditEvent, Brief, MemoryItem, ReviewChoice, TargetEdit } from './types';

export const defaultSourceIds = ['CTX-01', 'CTX-02', 'CTX-03', 'CTX-04', 'CTX-05', 'CTX-06'];

export function selectedItems(ids: string[]): MemoryItem[] {
  return memoryItems.filter((item) => ids.includes(item.sourceId));
}

export function buildBrief(selectedSourceIds: string[], reviews: Record<string, ReviewChoice>, edits: TargetEdit[]): Brief {
  const brief = structuredClone(baseBrief);
  // The demo's recommended selection is deliberately comprehensive. These light
  // source gates make the picker meaningful without adding a full retrieval stack.
  if (!selectedSourceIds.includes('CTX-01')) {
    brief.outcome = [];
    brief.stakeholders = brief.stakeholders.filter((line) => !line.startsWith('王敏'));
  }
  if (!selectedSourceIds.includes('CTX-02')) {
    brief.scope = brief.scope.filter((line) => !line.includes('门店运营手册') && !line.includes('库存'));
  }
  if (!selectedSourceIds.includes('CTX-04')) {
    brief.dependencies = brief.dependencies.filter((line) => !line.includes('Azure AD') && !line.includes('门店运营手册'));
  }
  if (!selectedSourceIds.includes('CTX-05')) {
    brief.overview = [];
    brief.stakeholders = brief.stakeholders.filter((line) => !line.startsWith('陈锐') && !line.startsWith('客户 IT Owner'));
    brief.questions = brief.questions.filter((line) => !line.includes('客户 IT Owner'));
  }
  if (!selectedSourceIds.includes('CTX-06')) {
    brief.dependencies = brief.dependencies.filter((line) => !line.includes('字段字典'));
  }
  if (selectedSourceIds.includes('CTX-07')) {
    brief.dependencies.unshift('产品能力已核对：支持 Azure AD SSO；仍需客户提供租户、协议和测试身份。');
  }
  if (reviews['M-03'] === 'confirmed') {
    brief.risks[0] = '当前参考排期：10/13 启动两周试点；10/06 为售前预估，不作为交付承诺。';
  }
  if (reviews['M-04'] === 'signal') {
    brief.risks.push('待验证信号：首次发现会确认业务 Champion 对试点价值的认同度。');
  }
  if (reviews['M-10'] === 'open') {
    brief.risks[1] = '内网/私有化部署被保留为技术发现会的高优先级澄清项。';
  }
  if (reviews['M-13'] === 'confirmed') {
    brief.risks.push('FDE 已确认：首周需补齐试点用户分组、培训计划与验收抽样方式。');
  }
  for (const edit of edits) {
    if (edit.field === 'questions') {
      brief.questions.push(edit.after);
    } else if (brief[edit.field][edit.index]) {
      brief[edit.field][edit.index] = edit.after;
    }
  }
  return brief;
}

export function readinessScore(reviews: Record<string, ReviewChoice>): number {
  return Math.min(86, 62 + Object.keys(reviews).length * 6);
}

export function createAudit(reviews: Record<string, ReviewChoice>, edits: TargetEdit[], published = false): AuditEvent[] {
  const events: AuditEvent[] = [
    { actor: 'Agent', title: '读取 6 个已选 Context', detail: '完成 Agent 记忆、离线文件与线上快照的受控加载。' },
    { actor: 'Agent', title: '完成记忆治理', detail: '7 条可迁移/重构、4 条待确认、2 条敏感拦截。' },
    { actor: 'Agent', title: '敏感信息已拦截', detail: '测试凭据、折扣底线和竞品策略未进入目标简报。', tone: 'block' }
  ];
  Object.entries(reviews).forEach(([id, choice]) => events.push({ actor: '交接发起人', title: `处理 ${id}`, detail: `人工决定：${choice === 'confirmed' ? '确认参考排期' : choice === 'signal' ? '转为待验证信号' : '保留为待确认项'}`, tone: 'review' }));
  edits.forEach((edit) => events.push({ actor: 'FDE', title: `修改${edit.field}`, detail: edit.reason, tone: 'review' }));
  if (published) events.push({ actor: 'FDE', title: '发布交接包 v1.0', detail: 'FDE 检查完成，接手验证通过。' });
  return events;
}
