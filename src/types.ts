export type RoleId = 'sales' | 'csm' | 'support' | 'fde' | 'ops';
export type AgentId = 'codex' | 'cursor' | 'claude_code';
export type FileKind = 'agent_memory' | 'knowledge';
export type FileOrigin = 'agent_memory_path' | 'desktop_upload' | 'demo_fixture';
export type Action = 'transfer' | 'reframe' | 'review' | 'block';
export type TaskStatus = 'configure' | 'ready' | 'running' | 'review' | 'target_check' | 'published';

export type RoleProfile = { id: RoleId; label: string; shortLabel: string; type: 'source' | 'target' | 'both'; description: string; focus: string[] };
export type LocalFile = { id: string; name: string; kind: FileKind; origin: FileOrigin; pathLabel: string; content: string; size: number };
export type TaskDraft = { sourceRole: RoleId | ''; targetRole: RoleId | ''; selectedAgent: AgentId | ''; memoryFiles: LocalFile[]; knowledgeFiles: LocalFile[]; prompt: string };
export type TransferTask = Omit<TaskDraft, 'sourceRole' | 'targetRole' | 'selectedAgent'> & { id: string; sourceRole: RoleId; targetRole: RoleId; selectedAgent: AgentId; status: Exclude<TaskStatus, 'configure'> };
export type MemoryItem = { id: string; sourceFileId: string; sourceFileName: string; sourceText: string; sourceLanguage: 'customer_quote' | 'sales_promise' | 'subjective_signal' | 'sensitive' | 'confirmed_fact' | 'dependency_gap'; action: Action; targetSection?: keyof Brief; targetText: string; reason: string };
export type Brief = { scope: string[]; dependencies: string[]; risks: string[]; firstWeekPlan: string[]; blockedSummary: string[] };
export type ReviewChoice = 'reference' | 'signal' | 'open' | 'prepare';
export type TargetEdit = { field: keyof Brief; index: number; before: string; after: string; reason: string };
export type AuditEvent = { actor: 'Agent' | '交接发起人' | 'FDE'; title: string; detail: string; tone?: 'review' | 'block' };
