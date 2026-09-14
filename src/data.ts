import type { Brief, LocalFile, MemoryItem, RoleProfile } from './types';
import salesMemory from '../demo-inputs/售前工作记忆_陈宇.md?raw';
import salesFollowup from '../demo-inputs/售前客户跟进_陈宇.md?raw';
import projectKnowledge from '../demo-inputs/项目交接知识_澄澈零售.md?raw';

export const roles: RoleProfile[] = [
  { id: 'sales', label: '售前人员', shortLabel: 'Sales', type: 'source', description: '从客户需求、商机节奏、方案承诺和关系判断出发。', focus: ['客户痛点', '承诺', '关键人'] },
  { id: 'csm', label: '客户成功经理', shortLabel: 'CSM', type: 'both', description: '从采用风险、客户节奏、培训与价值实现出发。', focus: ['采用', '培训', '风险'] },
  { id: 'support', label: '一线支持负责人', shortLabel: 'Support', type: 'source', description: '从现场问题、升级路径和服务影响出发。', focus: ['问题', '影响', '升级'] },
  { id: 'fde', label: 'FDE', shortLabel: 'FDE', type: 'target', description: '从范围、技术依赖、责任人、风险和启动动作出发。', focus: ['范围', '依赖', '首周动作'] },
  { id: 'ops', label: '运维工程师', shortLabel: 'Ops', type: 'target', description: '从环境、变更窗口、运行风险和响应责任出发。', focus: ['环境', '变更', '运行风险'] }
];

const fixture = (id: string, name: string, kind: LocalFile['kind'], content: string): LocalFile => ({ id, name, kind, origin: kind === 'agent_memory' ? 'agent_memory_path' : 'demo_fixture', pathLabel: kind === 'agent_memory' ? 'Codex · ~/.codex/agents/sales/memory/' : '本地知识文件 · Demo fixture', content, size: new Blob([content]).size });
export const demoMemoryFiles = [fixture('memory-sales', '售前工作记忆_陈宇.md', 'agent_memory', salesMemory), fixture('memory-sales-followup', '售前客户跟进_陈宇.md', 'agent_memory', salesFollowup)];
export const demoKnowledgeFiles = [fixture('knowledge-project', '项目交接知识_澄澈零售.md', 'knowledge', projectKnowledge)];
export const demoPrompt = '把售前叙述转换为 FDE 可启动的交付 Brief；区分确认事实、待确认项、风险和敏感信息；不要承诺上线日期。';

export const demoItems: MemoryItem[] = [
  { id: 'M-01', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: '陈锐说，门店人员遇到售后问题，翻手册和历史工单要约 4 小时；先做到 1 小时内，业务才觉得试点有价值。', sourceLanguage: 'customer_quote', action: 'reframe', targetSection: 'scope', targetText: '验收候选：门店/售后问题的检索与初步处置 ≤ 1 小时；与业务 Owner 确认当前基线和测量口径。', reason: '把售前的价值表达转换成 FDE 可设计的验收对象。' },
  { id: 'M-02', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: '我在邮件里写过“资料齐的话 10 月 6 日预计上线”，但客户会上讨论的是 10 月 13 日先启动两周试点。', sourceLanguage: 'sales_promise', action: 'review', targetSection: 'risks', targetText: '10 月 6 日为售前预估，不构成交付承诺；当前参考为 10 月 13 日启动两周试点。', reason: '日期影响客户预期和交付责任，必须由人决定如何传递。' },
  { id: 'M-03', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: '客户一直问内网部署，我只答复“可以评估”，是不是硬要求还不清楚。', sourceLanguage: 'sales_promise', action: 'review', targetSection: 'risks', targetText: '内网部署为高优先级技术澄清项；确认网络、算力和运维责任前不能作为交付承诺。', reason: '“可以评估”不是产品或交付承诺。' },
  { id: 'M-04', sourceFileId: 'knowledge-project', sourceFileName: '项目交接知识_澄澈零售.md', sourceText: '已确认：首阶段接入门店运营手册和 Salesforce 服务工单；不接库存和收银；员工使用 Azure AD。', sourceLanguage: 'confirmed_fact', action: 'transfer', targetSection: 'scope', targetText: '已确认范围：门店运营手册、Salesforce 服务工单和 Azure AD；第一阶段排除库存和收银。', reason: '知识文件中的已确认范围可直接迁移。' },
  { id: 'M-05', sourceFileId: 'knowledge-project', sourceFileName: '项目交接知识_澄澈零售.md', sourceText: 'FDE 需补齐：Azure AD 协议、租户和测试身份；Salesforce 字段/API Scope；客户 IT Owner；内网网络、算力和运维责任。', sourceLanguage: 'dependency_gap', action: 'reframe', targetSection: 'dependencies', targetText: '交付依赖：确认 Azure AD 协议、租户、测试身份；收集 Salesforce 字段/API Scope；确认 IT Owner、网络、算力与运维责任。', reason: '把知识文件的空白项转换成 FDE 能分配和验证的前置条件。' },
  { id: 'M-06', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: '我感觉陈锐回消息慢，可能还没完全相信试点价值。', sourceLanguage: 'subjective_signal', action: 'review', targetSection: 'risks', targetText: '待验证信号：首次发现会确认 Champion 对试点价值的认同度。', reason: '个人感受不能固化为客户事实。' },
  { id: 'M-07', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: 'SSO_CLIENT_SECRET=atlas-demo-secret', sourceLanguage: 'sensitive', action: 'block', targetText: '不迁移凭据；FDE 只需索取测试身份与租户配置。', reason: '凭据不得跨角色传递。' },
  { id: 'M-08', sourceFileId: 'memory-sales', sourceFileName: '售前工作记忆_陈宇.md', sourceText: '折扣底线 18%，竞品是 ExampleAssist。', sourceLanguage: 'sensitive', action: 'block', targetText: '不迁移商业策略。', reason: '与交付职责无关，且属于商业敏感信息。' }
  ,{ id: 'M-09', sourceFileId: 'memory-sales-followup', sourceFileName: '售前客户跟进_陈宇.md', sourceText: '陈锐愿意组织 5 家典型门店参与试点；具体名单和验收样本还没定。', sourceLanguage: 'dependency_gap', action: 'reframe', targetSection: 'firstWeekPlan', targetText: '首周动作：与业务 Owner 确认 5 家试点门店名单、验收样本和负责人。', reason: '把售前的客户推进线索转换成 FDE 可安排的启动待办。' }
];

export const baseBrief: Brief = { scope: ['已确认范围：门店运营手册、Salesforce 服务工单；第一阶段明确排除库存和收银系统。', '目标候选：门店/售后问题的检索与初步处置 ≤ 1 小时；基线和测量口径待业务 Owner 确认。'], dependencies: ['确认 Azure AD 协议、租户 ID、测试身份和技术联系人。', '收集 Salesforce 对象、字段字典、API Scope 和测试环境。', '补齐知识资料的文档量、格式、更新频率与受限内容。', '确认内网网络、算力、运维责任、变更窗口与客户 IT Owner。'], risks: ['10/06 为售前预估，不构成交付承诺；当前参考为 10/13 启动两周试点。', '内网/私有化是否为硬约束待技术发现会确认。', '试点用户分组、培训计划、验收样本与 Champion 认同度待验证。'], firstWeekPlan: ['召开技术发现会：核验身份、CRM、知识资料和部署边界。', '建立客户 IT Owner、业务 Owner、售前与 FDE 的责任人表。', '收集数据/权限清单，确定试点用户分组和验收基线。', '每周三向王敏发送一页风险摘要。'], blockedSummary: ['已阻断 1 条凭据', '已阻断 1 条商业策略（折扣/竞品）'] };
export const sectionLabels: Record<keyof Brief, string> = { scope: '已确认范围与业务结果', dependencies: '交付依赖', risks: '风险与待确认', firstWeekPlan: '首周动作', blockedSummary: '不迁移内容' };
