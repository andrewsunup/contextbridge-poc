import type { Brief, ContextSource, MemoryItem } from './types';

export const sources: ContextSource[] = [
  {
    id: 'CTX-01', name: '售前 Copilot Memory', kind: 'agent_memory', selectedByDefault: true,
    content: `# 售前工作记忆（林远）\n\n- 客户最想解决的是客服和门店运营人员跨运营手册、历史售后工单查找处理方法太慢；陈锐说一次通常约 4 小时，希望缩短到 1 小时以内。\n- 王敏很关注风险，偏好每周三收到一页纸更新；她是最终预算审批人。\n- 客户“可能”只接受私有化/内网方案，安全团队意见仍待确认。\n- 陈锐上次会后回复较慢，我感觉他对试点价值没有完全信心。（个人判断）\n- 内部预测：若客户接受标准合同，预计签约概率约 80%。（商业敏感）\n- 测试环境记录：SSO_CLIENT_SECRET=atlas-demo-secret`
  },
  {
    id: 'CTX-02', name: '客户需求发现会纪要.md', kind: 'local_file', selectedByDefault: true,
    content: `# 2026-09-14 客户需求发现会纪要\n\n## 已确认\n- 试点以“门店运营与售后问题处理”场景为起点，不在第一阶段接入库存和收银系统。\n- 客户愿意先接入门店运营手册和 Salesforce 服务工单。\n- 客户期望由 Azure AD 管理员工身份。\n\n## 时间讨论\n- 客户希望 2026-10-13 启动两周试点；正式投产日期需要在技术发现会后共同确认。`
  },
  {
    id: 'CTX-03', name: '售前方案与承诺.md', kind: 'local_file', selectedByDefault: true,
    content: `# 售前方案与沟通承诺\n\n- 方案包含 AtlasFlow 检索、问答、工单摘要能力。\n- 销售邮件中曾写：“若客户资料准备完毕，我们预计可于 2026-10-06 上线。”\n- 客户提出希望在内网环境运行；售前方案中描述为“可评估私有化部署路径”，并非已签署能力承诺。\n- 售前承诺在项目启动后协助安排每周风险更新。`
  },
  {
    id: 'CTX-04', name: '技术调研问卷.md', kind: 'local_file', selectedByDefault: true,
    content: `# 技术调研问卷（未完整）\n\n| 项目 | 当前信息 | 状态 |\n| 身份认证 | Azure AD | 协议、租户 ID、测试账号缺失 |\n| 知识库 | 门店运营手册 | 文档量、格式、更新频率缺失 |\n| CRM | Salesforce 服务工单 | 字段、对象、API Scope 缺失 |\n| 部署 | 偏好内网 | 网络、算力、运维责任缺失 |\n| 试点用户 | 300 人 | 用户分组和培训计划缺失 |`
  },
  {
    id: 'CTX-05', name: 'CRM 商机摘要', kind: 'online_snapshot', syncedAt: '09:20', selectedByDefault: true,
    content: `客户：澄澈零售集团\n项目：客服与门店运营智能助手试点\n首批用户：300 人，华东/华南区域\n王敏：客服运营总监、预算审批人\n陈锐：门店运营经理、业务 Champion\n客户 IT Owner：待确认\n商业备注：折扣底线 18%，竞品为 ExampleAssist`
  },
  {
    id: 'CTX-06', name: '项目待办', kind: 'online_snapshot', syncedAt: '09:20', selectedByDefault: true,
    content: `T-101 客户确认 Azure AD 技术联系人 · blocked\nT-102 收集 Salesforce 字段字典 · 未分配\nT-103 安排项目启动与风险周报节奏 · 林远\nT-104 明确试点验收基线 · 陈锐`
  },
  {
    id: 'CTX-07', name: 'AtlasFlow 产品能力说明', kind: 'knowledge', selectedByDefault: false,
    content: `支持连接文档型知识库与 Salesforce 服务工单；需确认 API Scope。支持 Azure AD SSO；需提供租户、协议和测试身份。可评估内网部署路径；网络、算力、运维责任和上线排期不属于默认承诺。`
  },
  {
    id: 'CTX-08', name: '竞品分析笔记.md', kind: 'local_file', selectedByDefault: false,
    content: `客户同时在比较 ExampleAssist。当前折扣底线为 18%。`
  }
];

export const memoryItems: MemoryItem[] = [
  { id: 'M-01', sourceId: 'CTX-01', source: '售前 Copilot Memory', quote: '一次通常约 4 小时，希望缩短到 1 小时以内。', type: '业务目标', action: 'reframe', targetField: 'outcome', targetText: '验收指标候选：门店/售后问题处理时的信息检索与初步处置 ≤ 1 小时；基线待确认。', confidence: 92, reason: '业务愿望被转换为可讨论的验收候选。' },
  { id: 'M-02', sourceId: 'CTX-01', source: '售前 Copilot Memory', quote: '王敏很关注风险，偏好每周三收到一页纸更新。', type: '关键人偏好', action: 'reframe', targetField: 'stakeholders', targetText: '王敏（客服运营总监 / 预算审批人）：关注风险；沿用每周三一页纸风险更新。', confidence: 89, reason: '把关系信息转换为交付协作节奏。' },
  { id: 'M-03', sourceId: 'CTX-03', source: '售前方案与承诺', quote: '我们预计可于 2026-10-06 上线。', type: '对外承诺', action: 'review', targetField: 'risks', targetText: '售前曾提出 10/06 上线预估；需与 10/13 试点启动信息一并确认。', confidence: 61, reason: '高影响时间承诺尚未完成技术可行性评估。' },
  { id: 'M-04', sourceId: 'CTX-01', source: '售前 Copilot Memory', quote: '我感觉他对试点价值没有完全信心。', type: '主观判断', action: 'review', targetField: 'risks', targetText: '待验证信号：业务 Champion 的试点价值认同度需要在首次发现会确认。', confidence: 47, reason: '个人判断不能自动固化为客户事实。' },
  { id: 'M-05', sourceId: 'CTX-01', source: '售前 Copilot Memory', quote: 'SSO_CLIENT_SECRET=atlas-demo-secret', type: '敏感凭据', action: 'block', targetText: '已拦截：FDE 只会看到“需向客户 IT 索取测试身份与租户配置”。', confidence: 100, reason: '凭据不得流入目标记忆。' },
  { id: 'M-06', sourceId: 'CTX-05', source: 'CRM 商机摘要', quote: '折扣底线 18%，竞品为 ExampleAssist', type: '商业策略', action: 'block', targetText: '已拦截：折扣与竞品策略不进入 FDE Brief。', confidence: 100, reason: '商业敏感信息与交付无关。' },
  { id: 'M-07', sourceId: 'CTX-02', source: '客户需求发现会纪要', quote: '不在第一阶段接入库存和收银系统。', type: '范围边界', action: 'transfer', targetField: 'scope', targetText: '第一阶段明确排除库存和收银系统。', confidence: 96, reason: '已确认的范围边界直接迁移。' },
  { id: 'M-08', sourceId: 'CTX-02', source: '客户需求发现会纪要', quote: '接入门店运营手册和 Salesforce 服务工单。', type: '已确认范围', action: 'transfer', targetField: 'scope', targetText: '首阶段接入门店运营手册与 Salesforce 服务工单。', confidence: 95, reason: '已确认的首阶段范围直接迁移。' },
  { id: 'M-09', sourceId: 'CTX-04', source: '技术调研问卷', quote: '协议、租户 ID、测试账号缺失', type: '技术依赖', action: 'reframe', targetField: 'dependencies', targetText: 'Azure AD 依赖：确认协议、租户 ID 与测试身份。', confidence: 94, reason: '把问卷缺口转换为 FDE 可行动依赖。' },
  { id: 'M-10', sourceId: 'CTX-03', source: '售前方案与承诺', quote: '可评估私有化部署路径', type: '部署约束', action: 'review', targetField: 'risks', targetText: '内网/私有化是否为硬性约束待技术发现会确认。', confidence: 74, reason: '方案表述不是已签署的技术承诺。' },
  { id: 'M-11', sourceId: 'CTX-06', source: '项目待办', quote: '收集 Salesforce 字段字典 · 未分配', type: '未完成依赖', action: 'reframe', targetField: 'dependencies', targetText: 'CRM 字段字典、对象和 API Scope 尚未确认，且当前未分配负责人。', confidence: 93, reason: '把待办转换为依赖与责任风险。' },
  { id: 'M-12', sourceId: 'CTX-05', source: 'CRM 商机摘要', quote: '客户 IT Owner：待确认', type: '关键人缺口', action: 'transfer', targetField: 'questions', targetText: '客户 IT Owner 待确认。', confidence: 98, reason: '关键交付角色缺失需要直接进入待办。' },
  { id: 'M-13', sourceId: 'CTX-04', source: '技术调研问卷', quote: '试点用户 300 人，但用户分组和培训计划缺失。', type: '验收准备度', action: 'review', targetField: 'risks', targetText: '首周需与业务方确认试点用户分组、培训计划与验收抽样方式。', confidence: 79, reason: '试点规模已知，但缺少影响交付成败的验收准备信息。' },
  { id: 'M-14', sourceId: 'CTX-07', source: 'AtlasFlow 产品能力说明', quote: '支持 Azure AD SSO；需提供租户、协议和测试身份。', type: '能力边界', action: 'reframe', targetField: 'dependencies', targetText: '产品支持 Azure AD SSO；客户仍需提供租户、协议和测试身份后方可验证。', confidence: 97, reason: '将产品知识转换为带前置条件的交付依赖。' },
  { id: 'M-15', sourceId: 'CTX-08', source: '竞品分析笔记', quote: '当前折扣底线为 18%。', type: '商业策略', action: 'block', targetText: '已拦截：商业折扣和竞品比较不进入 FDE Brief。', confidence: 100, reason: '与目标角色交付职责无关的商业敏感信息不得迁移。' }
];

export const baseBrief: Brief = {
  overview: ['澄澈零售集团将启动 AtlasFlow 试点，覆盖华东、华南区域约 300 名客服与门店运营用户。'],
  outcome: ['将门店/售后问题处理时的信息检索与初步处置由约 4 小时缩短至 1 小时以内；基线测量方式待确认。'],
  scope: ['首阶段接入门店运营手册与 Salesforce 服务工单。', '使用 Azure AD 管理员工身份。', '第一阶段明确排除库存和收银系统。'],
  stakeholders: ['王敏：客服运营总监、预算审批人；偏好每周三风险更新。', '陈锐：门店运营经理、业务 Champion。', '客户 IT Owner：待确认。'],
  dependencies: ['确认 Azure AD 协议、租户 ID 与测试身份。', '收集 Salesforce 字段字典、对象与 API Scope。', '补齐门店运营手册的文档量、格式和更新频率。', '确认内网部署的网络、算力与运维边界。'],
  risks: ['10/06 上线预估与 10/13 试点启动存在冲突，尚未形成技术承诺。', '私有化/内网是否为硬性约束待技术发现会确认。', '试点验收基线和用户分组待补齐。'],
  firstWeekPlan: ['召开技术发现会，确认 Azure AD、CRM 和部署约束。', '建立客户 IT Owner、业务 Owner 与 FDE 的责任人表。', '收集数据/权限清单并评估连接器可行性。', '与客户共同定义试点验收基线及用户分组。', '确认每周三风险更新节奏。'],
  questions: ['客户 IT Owner', 'Salesforce 字段说明与 API Scope']
};

export const sectionLabels: Record<keyof Brief, string> = {
  overview: '账户概览', outcome: '业务目标', scope: '已确认范围', stakeholders: '关键人', dependencies: '交付依赖', risks: '风险与约束', firstWeekPlan: '首周计划', questions: '待补齐问题'
};
