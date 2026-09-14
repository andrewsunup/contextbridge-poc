export type ContextKind = 'agent_memory' | 'knowledge' | 'local_file' | 'online_snapshot';
export type Action = 'transfer' | 'reframe' | 'review' | 'block' | 'discard';
export type SessionStatus = 'not_started' | 'running' | 'draft' | 'review' | 'target_check' | 'published';

export type ContextSource = {
  id: string;
  name: string;
  kind: ContextKind;
  content: string;
  syncedAt?: string;
  selectedByDefault: boolean;
};

export type MemoryItem = {
  id: string;
  sourceId: string;
  source: string;
  quote: string;
  type: string;
  action: Action;
  targetField?: keyof Brief;
  targetText: string;
  confidence: number;
  reason: string;
};

export type Brief = {
  overview: string[];
  outcome: string[];
  scope: string[];
  stakeholders: string[];
  dependencies: string[];
  risks: string[];
  firstWeekPlan: string[];
  questions: string[];
};

export type ReviewChoice = 'confirmed' | 'signal' | 'open';
export type TargetEdit = {
  field: keyof Brief;
  index: number;
  before: string;
  after: string;
  reason: string;
};

export type AuditEvent = {
  actor: 'Agent' | '交接发起人' | 'FDE';
  title: string;
  detail: string;
  tone?: 'normal' | 'review' | 'block';
};
