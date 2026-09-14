import type { Brief, LocalFile, MemoryItem, RoleProfile } from './types';
import salesMemory from '../demo-inputs/codex_sales_memory_chenyu.md?raw';
import csmMemory from '../demo-inputs/codex_csm_memory_hanlin.md?raw';
import discoveryNotes from '../demo-inputs/customer_discovery_notes.md?raw';
import scopeNotes from '../demo-inputs/solution_scope_and_commitment.md?raw';
import questionnaire from '../demo-inputs/technical_readiness_questionnaire.md?raw';

export const roles: RoleProfile[] = [
  { id: 'sales', label: '售前人员', shortLabel: 'Sales', type: 'source', description: '从客户需求、商机节奏、方案承诺和关系判断出发。', focus: ['客户痛点', '承诺', '关键人'] },
  { id: 'csm', label: '客户成功经理', shortLabel: 'CSM', type: 'both', description: '从采用风险、客户节奏、培训与价值实现出发。', focus: ['采用', '培训', '风险'] },
  { id: 'support', label: '一线支持负责人', shortLabel: 'Support', type: 'source', description: '从现场问题、升级路径和服务影响出发。', focus: ['问题', '影响', '升级'] },
  { id: 'fde', label: 'FDE', shortLabel: 'FDE', type: 'target', description: '从范围、技术依赖、责任人、风险和启动动作出发。', focus: ['范围', '依赖', '首周动作'] },
  { id: 'ops', label: '运维工程师', shortLabel: 'Ops', type: 'target', description: '从环境、变更窗口、运行风险和响应责任出发。', focus: ['环境', '变更', '运行风险'] }
];

const fixture = (id: string, name: string, kind: LocalFile['kind'], content: string): LocalFile => ({ id, name, kind, origin: 'demo_fixture', pathLabel: kind === 'agent_memory' ? 'Codex Local Agent · Demo fixture' : 'Local Knowledge · Demo fixture', content, size: new Blob([content]).size });
export const demoMemoryFiles = [fixture('memory-sales', 'codex_sales_memory_chenyu.md', 'agent_memory', salesMemory), fixture('memory-csm', 'codex_csm_memory_hanlin.md', 'agent_memory', csmMemory)];
export const demoKnowledgeFiles = [fixture('knowledge-discovery', 'customer_discovery_notes.md', 'knowledge', discoveryNotes), fixture('knowledge-scope', 'solution_scope_and_commitment.md', 'knowledge', scopeNotes), fixture('knowledge-questionnaire', 'technical_readiness_questionnaire.md', 'knowledge', questionnaire)];
export const demoPrompt = '把售前叙述转换为 FDE 可启动的交付 Brief；区分确认事实、待确认项、风险和敏感信息；不要承诺上线日期。';

export const demoItems: MemoryItem[] = [
  { id: 'M-01', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: '陈锐说，现在店长遇到售后或运营问题，要在运营手册和历史工单里翻大约 4 小时；如果试点能先把“找到信息 + 初步处置”压到 1 小时以内，业务会觉得值。', sourceLanguage: 'customer_quote', action: 'reframe', targetSection: 'scope', targetText: '验收候选：门店/售后问题的检索与初步处置 ≤ 1 小时；与业务 Owner 确认当前基线、抽样和测量口径。', reason: '把售前记录的客户感受转换成 FDE 可设计的验收对象，而不是直接视为承诺。' },
  { id: 'M-02', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: '邮件里我先写了“资料齐的话，10/06 预计可以上线”，问题应该不大；但会上又讨论的是 10/13 开始两周试点。', sourceLanguage: 'sales_promise', action: 'review', targetSection: 'risks', targetText: '10/06 为售前预估，不构成交付承诺；当前参考为 10/13 启动两周试点，正式排期须在技术发现会后确认。', reason: '日期影响客户预期和交付责任，且与会议计划冲突，必须由人决定如何传递。' },
  { id: 'M-03', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: '我感觉陈锐对试点价值还没有完全信，他回消息慢。', sourceLanguage: 'subjective_signal', action: 'review', targetSection: 'risks', targetText: '待验证信号：首次发现会确认业务 Champion 对试点价值的认同度，并约定 5 家典型门店的共创方式。', reason: '个人感受不能固化为客户事实，只能以可验证的假设交接。' },
  { id: 'M-04', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: '客户一直提内网/私有化，销售方案写的是“可评估部署路径”。我不确定这是不是硬要求，别先答死。', sourceLanguage: 'sales_promise', action: 'review', targetSection: 'risks', targetText: '内网/私有化为高优先级技术澄清项；先确认网络、算力、运维责任和变更窗口，不能作为默认交付能力承诺。', reason: '方案中的“可评估”不是产品或交付承诺。' },
  { id: 'M-05', sourceFileId: 'knowledge-discovery', sourceFileName: 'customer_discovery_notes.md', sourceText: '首阶段场景为“门店运营与售后问题处理”，知识输入为门店运营手册和 Salesforce 服务工单；第一阶段不接入库存系统和收银系统。', sourceLanguage: 'confirmed_fact', action: 'transfer', targetSection: 'scope', targetText: '已确认范围：门店运营手册、Salesforce 服务工单；第一阶段明确排除库存和收银系统。', reason: '会议纪要中的已确认范围可直接迁移。' },
  { id: 'M-06', sourceFileId: 'knowledge-questionnaire', sourceFileName: 'technical_readiness_questionnaire.md', sourceText: 'Azure AD 缺协议、租户 ID、测试身份和技术联系人；Salesforce 缺对象、字段字典、API Scope。', sourceLanguage: 'dependency_gap', action: 'reframe', targetSection: 'dependencies', targetText: '交付依赖：确认 Azure AD 协议、租户 ID、测试身份、技术联系人；收集 Salesforce 对象、字段字典、API Scope 和测试环境。', reason: '将问卷的空白项转换成 FDE 能分配和验证的前置条件。' },
  { id: 'M-07', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: 'SSO_CLIENT_SECRET=atlas-demo-secret', sourceLanguage: 'sensitive', action: 'block', targetText: '不迁移凭据；FDE 只需向客户 IT 索取测试身份与租户配置。', reason: '凭据不得跨角色传递。' },
  { id: 'M-08', sourceFileId: 'memory-sales', sourceFileName: 'codex_sales_memory_chenyu.md', sourceText: '折扣底线 18%，竞品是 ExampleAssist。', sourceLanguage: 'sensitive', action: 'block', targetText: '不迁移商业策略。', reason: '与交付职责无关，且属于商业敏感信息。' },
  { id: 'M-09', sourceFileId: 'knowledge-questionnaire', sourceFileName: 'technical_readiness_questionnaire.md', sourceText: '首批试点约 300 人，缺少区域/角色分组、培训计划和验收样本。', sourceLanguage: 'dependency_gap', action: 'review', targetSection: 'risks', targetText: '试点准备度待确认：补齐用户分组、培训计划、验收样本和业务 Owner。', reason: '规模不等于验收准备就绪，需要人与客户共同确认。' }
];

export const baseBrief: Brief = { scope: ['已确认范围：门店运营手册、Salesforce 服务工单；第一阶段明确排除库存和收银系统。', '目标候选：门店/售后问题的检索与初步处置 ≤ 1 小时；基线和测量口径待业务 Owner 确认。'], dependencies: ['确认 Azure AD 协议、租户 ID、测试身份和技术联系人。', '收集 Salesforce 对象、字段字典、API Scope 和测试环境。', '补齐知识资料的文档量、格式、更新频率与受限内容。', '确认内网网络、算力、运维责任、变更窗口与客户 IT Owner。'], risks: ['10/06 为售前预估，不构成交付承诺；当前参考为 10/13 启动两周试点。', '内网/私有化是否为硬约束待技术发现会确认。', '试点用户分组、培训计划、验收样本与 Champion 认同度待验证。'], firstWeekPlan: ['召开技术发现会：核验身份、CRM、知识资料和部署边界。', '建立客户 IT Owner、业务 Owner、售前与 FDE 的责任人表。', '收集数据/权限清单，确定试点用户分组和验收基线。', '每周三向王敏发送一页风险摘要。'], blockedSummary: ['已阻断 1 条凭据', '已阻断 1 条商业策略（折扣/竞品）'] };
export const sectionLabels: Record<keyof Brief, string> = { scope: '已确认范围与业务结果', dependencies: '交付依赖', risks: '风险与待确认', firstWeekPlan: '首周动作', blockedSummary: '不迁移内容' };
