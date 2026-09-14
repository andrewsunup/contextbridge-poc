import { describe, expect, it } from 'vitest';
import { demoKnowledgeFiles, demoMemoryFiles, demoPrompt } from '../src/data';
import { buildBrief, buildItems, isTaskValid } from '../src/engine';
import type { TransferTask } from '../src/types';

const task: TransferTask = { id: 'test', sourceRole: 'sales', targetRole: 'fde', memoryFiles: demoMemoryFiles, knowledgeFiles: demoKnowledgeFiles, prompt: demoPrompt, status: 'ready' };

describe('ContextBridge task configuration and governance', () => {
  it('requires a configured source/target, local memory, knowledge and prompt before generating a task card', () => {
    expect(isTaskValid('sales', 'fde', demoMemoryFiles, demoKnowledgeFiles, demoPrompt)).toBe(true);
    expect(isTaskValid('sales', 'sales', demoMemoryFiles, demoKnowledgeFiles, demoPrompt)).toBe(false);
    expect(isTaskValid('sales', 'fde', [], demoKnowledgeFiles, demoPrompt)).toBe(false);
    expect(isTaskValid('sales', 'fde', demoMemoryFiles, [], demoPrompt)).toBe(false);
  });

  it('converts the demo files into role-specific evidence while keeping unsafe content out of the target brief', () => {
    const items = buildItems(task);
    expect(items.filter((item) => item.action === 'review')).toHaveLength(4);
    expect(items.filter((item) => item.action === 'block')).toHaveLength(2);
    const serialized = JSON.stringify(buildBrief(task, {}, []));
    expect(serialized).not.toContain('atlas-demo-secret');
    expect(serialized).not.toContain('18%');
    expect(serialized).not.toContain('ExampleAssist');
    expect(serialized).toContain('Azure AD');
  });

  it('does not turn a sales estimate into an FDE commitment before human review', () => {
    const before = buildBrief(task, {}, []);
    const after = buildBrief(task, { 'M-02': 'reference' }, []);
    expect(before.risks[0]).toContain('售前预估');
    expect(after.risks[0]).toContain('不构成交付承诺');
  });
});
