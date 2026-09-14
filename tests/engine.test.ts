import { describe, expect, it } from 'vitest';
import { buildBrief, defaultSourceIds, selectedItems } from '../src/engine';

describe('ContextBridge deterministic rules', () => {
  it('selects the recommended demo context and keeps sensitive values out of the brief', () => {
    const items = selectedItems(defaultSourceIds);
    expect(items).toHaveLength(13);
    expect(items.filter((item) => item.action === 'review')).toHaveLength(4);
    expect(items.filter((item) => item.action === 'block')).toHaveLength(2);

    const serialized = JSON.stringify(buildBrief(defaultSourceIds, {}, []));
    expect(serialized).not.toContain('atlas-demo-secret');
    expect(serialized).not.toContain('18%');
    expect(serialized).not.toContain('ExampleAssist');
  });

  it('reflects target-source selection and human confirmation in the resulting brief', () => {
    const withoutQuestionnaire = buildBrief(
      defaultSourceIds.filter((id) => id !== 'CTX-04'),
      {},
      []
    );
    expect(withoutQuestionnaire.dependencies.join(' ')).not.toContain('租户 ID');

    const reviewed = buildBrief(defaultSourceIds, { 'M-03': 'confirmed', 'M-13': 'confirmed' }, []);
    expect(reviewed.risks.join(' ')).toContain('10/13 启动两周试点');
    expect(reviewed.risks.join(' ')).toContain('用户分组');
  });
});
