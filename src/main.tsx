import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sectionLabels, sources } from './data';
import { buildBrief, createAudit, defaultSourceIds, readinessScore, selectedItems } from './engine';
import type { Action, Brief, ContextKind, ReviewChoice, SessionStatus, TargetEdit } from './types';
import './styles.css';

const actionMeta: Record<Action, { label: string; icon: string }> = {
  transfer: { label: '直接迁移', icon: '↗' },
  reframe: { label: '角色化重构', icon: '◇' },
  review: { label: '需要确认', icon: '!' },
  block: { label: '已拦截', icon: '×' },
  discard: { label: '已忽略', icon: '–' }
};

const kindMeta: Record<ContextKind, { label: string; icon: string }> = {
  agent_memory: { label: 'Agent 记忆', icon: '✦' },
  knowledge: { label: '知识', icon: '◇' },
  local_file: { label: '离线文件', icon: '▣' },
  online_snapshot: { label: '线上快照', icon: '☁' }
};

const requiredChecks: (keyof Brief)[] = ['scope', 'risks', 'firstWeekPlan'];

function App() {
  const [page, setPage] = useState<'home' | 'workspace' | 'final'>('home');
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSourceIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('not_started');
  const [activeSourceId, setActiveSourceId] = useState('CTX-01');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Action | 'all'>('all');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<Record<string, ReviewChoice>>({});
  const [targetChecks, setTargetChecks] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<TargetEdit[]>([]);
  const [editing, setEditing] = useState<{ field: keyof Brief; index: number; text: string; reason: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const visibleItems = useMemo(() => selectedItems(selectedIds), [selectedIds]);
  const filteredItems = useMemo(() => filter === 'all' ? visibleItems : visibleItems.filter((item) => item.action === filter), [visibleItems, filter]);
  const brief = useMemo(() => buildBrief(selectedIds, reviews, edits), [selectedIds, reviews, edits]);
  const score = readinessScore(reviews);
  const reviewItems = visibleItems.filter((item) => item.action === 'review');
  const allReviewsDone = reviewItems.every((item) => reviews[item.id]);
  const allChecksDone = requiredChecks.every((field) => targetChecks[field]);
  const canValidate = allReviewsDone && allChecksDone;
  const activeItem = visibleItems.find((item) => item.id === activeItemId) ?? null;
  const audit = createAudit(reviews, edits, published);

  useEffect(() => {
    if (status !== 'running') return;
    const timer = window.setTimeout(() => setStatus('draft'), 2300);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const start = () => {
    setPage('workspace');
    setStatus('not_started');
  };

  const runTransfer = () => {
    if (!selectedIds.length) return;
    setStatus('running');
    setActiveItemId(null);
    setPublished(false);
  };

  const applySources = () => {
    setPickerOpen(false);
    if (status !== 'not_started') {
      setStatus('not_started');
      setReviews({});
      setTargetChecks({});
      setEdits([]);
      setPublished(false);
      setToast('Context 已变化，请重新生成草案');
    }
  };

  const chooseReview = (id: string, choice: ReviewChoice) => {
    setReviews((current) => ({ ...current, [id]: choice }));
  };

  const beginTargetCheck = () => {
    if (!allReviewsDone) {
      setReviewOpen(true);
      return;
    }
    setStatus('target_check');
    setToast('已交给 FDE 检查交接简报');
  };

  const saveEdit = () => {
    if (!editing || !editing.reason.trim() || !editing.text.trim()) return;
    const before = brief[editing.field][editing.index];
    const edit: TargetEdit = { field: editing.field, index: editing.index, before, after: editing.text.trim(), reason: editing.reason.trim() };
    setEdits((current) => [...current.filter((item) => !(item.field === edit.field && item.index === edit.index)), edit]);
    setEditing(null);
    setToast('FDE 修改已保存，并写入审计记录');
  };

  const markMissing = (field: keyof Brief) => {
    const question = field === 'dependencies' ? '客户需确认门店运营手册中是否含有受限员工信息' : `请补齐：${sectionLabels[field]}`;
    setEdits((current) => [...current, { field: 'questions', index: -1, before: '', after: question, reason: 'FDE 检查时发现信息缺口' }]);
    setTargetChecks((current) => ({ ...current, [field]: true }));
    setToast('已标记为待补齐问题');
  };

  const publish = () => {
    if (!canValidate) return;
    setPublished(true);
    setStatus('published');
    setPage('final');
    setToast('FDE Deployment Brief v1.0 已发布');
  };

  const reset = () => {
    setSelectedIds(defaultSourceIds);
    setStatus('not_started');
    setReviews({});
    setTargetChecks({});
    setEdits([]);
    setActiveItemId(null);
    setPublished(false);
    setPage('home');
    setToast('已恢复推荐 Demo 场景');
  };

  return <>
    <header className="topbar">
      <button className="brand" onClick={() => setPage('home')} aria-label="返回首页"><span className="brand-mark">C</span><span>ContextBridge</span></button>
      <div className="topbar-right"><span className="mode-pill"><span className="mode-dot" /> Demo Replay · Mock data</span><button className="quiet-button" onClick={() => setAuditOpen(true)}>审计 {audit.length}</button></div>
    </header>

    {page === 'home' && <Home selectedCount={selectedIds.length} onStart={start} onConfigure={() => setPickerOpen(true)} />}
    {page === 'workspace' && <main className="workspace">
      <section className="workspace-header"><div><button className="back-link" onClick={() => setPage('home')}>← 场景</button><span className="crumb">澄澈零售 / AtlasFlow</span></div><div className={`status-pill status-${status}`}>{status === 'running' ? 'Agent 正在运行' : status === 'target_check' ? '等待 FDE 检查' : status === 'published' ? '已发布 v1.0' : allReviewsDone ? '草案：待 FDE 检查' : `草案：待确认 ${Math.max(0, reviewItems.length - Object.keys(reviews).length)} 项`}</div></section>
      <div className="workspace-grid">
        <SourcePanel selectedIds={selectedIds} activeId={activeSourceId} activeItem={activeItem} onSource={setActiveSourceId} onManage={() => setPickerOpen(true)} />
        <BridgePanel status={status} items={filteredItems} activeItemId={activeItemId} filter={filter} onRun={runTransfer} onFilter={setFilter} onItem={setActiveItemId} onReview={() => setReviewOpen(true)} reviewCount={reviewItems.length - Object.keys(reviews).length} />
        <BriefPanel brief={brief} score={score} status={status} targetChecks={targetChecks} edits={edits} onTargetCheck={beginTargetCheck} onCheck={(field) => setTargetChecks((current) => ({ ...current, [field]: true }))} onEdit={(field, index) => setEditing({ field, index, text: brief[field][index], reason: '' })} onMissing={markMissing} onPublish={publish} canValidate={canValidate} />
      </div>
    </main>}
    {page === 'final' && <FinalPage brief={brief} score={score} onReset={reset} />}

    {pickerOpen && <ContextPicker selectedIds={selectedIds} onToggle={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onClose={() => setPickerOpen(false)} onApply={applySources} onReset={() => setSelectedIds(defaultSourceIds)} />}
    {reviewOpen && <ReviewModal items={reviewItems} reviews={reviews} onChoose={chooseReview} onClose={() => setReviewOpen(false)} onDone={() => { setReviewOpen(false); setToast('人工确认已写入交接草案'); }} />}
    {editing && <EditModal editing={editing} setEditing={setEditing} onClose={() => setEditing(null)} onSave={saveEdit} />}
    {auditOpen && <AuditDrawer events={audit} onClose={() => setAuditOpen(false)} />}
    {toast && <div className="toast">✓ {toast}</div>}
  </>;
}

function Home({ selectedCount, onStart, onConfigure }: { selectedCount: number; onStart: () => void; onConfigure: () => void }) {
  return <main className="home"><div className="home-grid"><section className="home-copy"><span className="eyebrow">跨角色 Context 转换台</span><h1>让上下文，<br />成为下一位接手者的起点。</h1><p>ContextBridge 将 Agent 记忆、知识与工作资料转换为目标角色可检查、可修改、可执行的工作记忆。</p><div className="home-actions"><button className="primary-button" onClick={onStart}>开始交接 <span>→</span></button><button className="secondary-button" onClick={onConfigure}>配置本次 Context</button></div><p className="fine-print">本地 Demo · 不连接真实 CRM 或文件库</p></section><section className="scenario-card"><div className="scenario-top"><span className="small-label">预置演示场景</span><span className="risk-dot">中等风险</span></div><h2>澄澈零售集团</h2><p>AtlasFlow 试点交接</p><div className="role-bridge"><div><span className="role-icon">S</span><strong>售前人员</strong><small>需求、承诺、关系</small></div><span className="bridge-line">→</span><div><span className="role-icon target">F</span><strong>FDE</strong><small>依赖、风险、启动计划</small></div></div><div className="scenario-stats"><span>{selectedCount} 个已选 Context</span><span>13 条受治理记忆</span><span>3 分钟流程</span></div></section></div></main>;
}

function ContextPicker({ selectedIds, onToggle, onClose, onApply, onReset }: { selectedIds: string[]; onToggle: (id: string) => void; onClose: () => void; onApply: () => void; onReset: () => void }) {
  const [kind, setKind] = useState<ContextKind | 'all'>('all');
  const shown = kind === 'all' ? sources : sources.filter((source) => source.kind === kind);
  return <div className="overlay"><section className="drawer context-drawer"><div className="modal-header"><div><span className="eyebrow">CONTEXT PICKER</span><h2>本次转换的 Context</h2></div><button className="icon-button" onClick={onClose}>×</button></div><p className="modal-intro">选择本次交接需要的上下文。线上资料仅为本地同步快照，Demo 不会访问外部系统。</p><div className="filter-row"><button className={kind === 'all' ? 'filter active' : 'filter'} onClick={() => setKind('all')}>全部</button>{(Object.keys(kindMeta) as ContextKind[]).map((key) => <button key={key} className={kind === key ? 'filter active' : 'filter'} onClick={() => setKind(key)}>{kindMeta[key].label}</button>)}</div><div className="source-list">{shown.map((source) => <label className={`source-option ${selectedIds.includes(source.id) ? 'selected' : ''}`} key={source.id}><input type="checkbox" checked={selectedIds.includes(source.id)} onChange={() => onToggle(source.id)} /><span className="source-icon">{kindMeta[source.kind].icon}</span><span className="source-option-copy"><strong>{source.name}</strong><small>{kindMeta[source.kind].label}{source.syncedAt ? ` · 本地快照 ${source.syncedAt}` : ''}</small></span>{source.id === 'CTX-08' && <span className="sensitive-tag">商业敏感</span>}</label>)}</div><div className="drawer-footer"><button className="text-button" onClick={onReset}>恢复推荐组合</button><button className="primary-button" disabled={!selectedIds.length} onClick={onApply}>应用 {selectedIds.length} 个来源</button></div></section></div>;
}

function SourcePanel({ selectedIds, activeId, activeItem, onSource, onManage }: { selectedIds: string[]; activeId: string; activeItem: ReturnType<typeof selectedItems>[number] | null; onSource: (id: string) => void; onManage: () => void }) {
  const selected = sources.filter((source) => selectedIds.includes(source.id));
  const active = selected.find((source) => source.id === activeId) ?? selected[0];
  if (!active) return <section className="panel source-panel"><p>请至少选择一个 Context。</p></section>;
  return <section className="panel source-panel"><div className="panel-head"><div><span className="step">01 · 源上下文</span><h2>售前人员</h2><p>需求、承诺、关系与工作记忆</p></div><button className="mini-button" onClick={onManage}>{selected.length} 个 Context</button></div><div className="source-tabs">{selected.map((source) => <button key={source.id} className={active.id === source.id ? 'tab active' : 'tab'} onClick={() => onSource(source.id)}>{kindMeta[source.kind].icon} {source.name.replace('.md', '')}</button>)}</div><div className="source-document"><div className="document-meta"><span>{kindMeta[active.kind].label}</span>{active.syncedAt && <span>同步于 {active.syncedAt}</span>}</div><pre>{active.content}</pre></div>{activeItem && <div className="evidence-callout"><span>证据定位</span><strong>“{activeItem.quote}”</strong><p>{activeItem.source}</p></div>}</section>;
}

function BridgePanel({ status, items, activeItemId, filter, onRun, onFilter, onItem, onReview, reviewCount }: { status: SessionStatus; items: ReturnType<typeof selectedItems>; activeItemId: string | null; filter: Action | 'all'; onRun: () => void; onFilter: (value: Action | 'all') => void; onItem: (id: string) => void; onReview: () => void; reviewCount: number }) {
  const running = status === 'running';
  const hasResult = status !== 'not_started' && status !== 'running';
  return <section className="panel bridge-panel"><div className="panel-head bridge-head"><div><span className="step">02 · CONTEXTBRIDGE</span><h2>受控转换工作流</h2><p>提取、治理、映射、组装</p></div>{hasResult && <button className="mini-button warning" onClick={onReview}>待确认 {reviewCount} 项</button>}</div><button className="run-button" disabled={running} onClick={onRun}>{running ? '正在生成交接草案…' : hasResult ? '重新生成草案' : '生成 FDE 交接草案'} <span>→</span></button><Pipeline running={running} complete={hasResult} />{hasResult ? <><div className="stat-strip">{(['all', 'transfer', 'reframe', 'review', 'block'] as const).map((key) => { const count = key === 'all' ? items.length : items.filter((item) => item.action === key).length; return <button key={key} onClick={() => onFilter(key)} className={filter === key ? 'stat active' : 'stat'}><strong>{count}</strong><span>{key === 'all' ? '受治理记忆' : actionMeta[key].label}</span></button>; })}</div><div className="memory-list">{items.filter((item) => filter === 'all' || item.action === filter).map((item) => <button className={`memory-card ${activeItemId === item.id ? 'active' : ''} ${item.action}`} key={item.id} onClick={() => onItem(item.id)}><span className="memory-action">{actionMeta[item.action].icon}</span><span className="memory-copy"><span className="memory-title">{item.type}</span><strong>{item.quote}</strong><small>{actionMeta[item.action].label} · {item.confidence}%</small></span></button>)}</div></> : <div className="bridge-empty"><span>◇</span><p>从所选 Context 中提取记忆，并按目标角色规则进行转换。</p></div>}</section>;
}

function Pipeline({ running, complete }: { running: boolean; complete: boolean }) {
  const steps = ['读取 Context', '提取记忆', '风险检查', '角色映射', '生成简报'];
  return <div className="pipeline">{steps.map((step, index) => <div className={`pipeline-step ${running ? 'running' : complete ? 'done' : ''}`} style={{ transitionDelay: `${index * 100}ms` }} key={step}><span>{complete ? '✓' : index + 1}</span><small>{step}</small></div>)}</div>;
}

function BriefPanel({ brief, score, status, targetChecks, edits, onTargetCheck, onCheck, onEdit, onMissing, onPublish, canValidate }: { brief: Brief; score: number; status: SessionStatus; targetChecks: Record<string, boolean>; edits: TargetEdit[]; onTargetCheck: () => void; onCheck: (field: keyof Brief) => void; onEdit: (field: keyof Brief, index: number) => void; onMissing: (field: keyof Brief) => void; onPublish: () => void; canValidate: boolean }) {
  const hasResult = status !== 'not_started' && status !== 'running';
  const checking = status === 'target_check' || status === 'published';
  return <section className="panel brief-panel"><div className="panel-head"><div><span className="step">03 · 目标工作记忆</span><h2>FDE Deployment Brief</h2><p>{checking ? 'FDE 正在检查与修订' : hasResult ? '草案等待人工确认' : '等待 Agent 生成草案'}</p></div><div className="score"><strong>{hasResult ? score : 0}</strong><small>就绪度</small></div></div>{hasResult ? <><div className="brief-tabs"><span className="active">交接简报</span><span>来源可追溯</span></div><div className="brief-content">{(Object.keys(brief) as (keyof Brief)[]).filter((field) => ['overview', 'outcome', 'scope', 'stakeholders', 'dependencies', 'risks', 'firstWeekPlan', 'questions'].includes(field)).map((field) => <div className="brief-section" key={field}><div className="brief-section-head"><h3>{sectionLabels[field]}</h3>{checking && requiredChecks.includes(field) && <span className={targetChecks[field] ? 'check-badge done' : 'check-badge'}>{targetChecks[field] ? '已检查' : '待检查'}</span>}</div><ul>{brief[field].map((line, index) => { const edited = edits.some((edit) => edit.field === field && edit.index === index); return <li key={`${field}-${index}`} className={edited ? 'edited' : ''}><span>{line}</span>{checking && <button className="edit-link" onClick={() => onEdit(field, index)}>编辑</button>}{edited && <small>FDE 已编辑</small>}</li>; })}</ul>{checking && requiredChecks.includes(field) && <div className="check-actions"><button className="confirm-link" onClick={() => onCheck(field)}>✓ 确认本区块</button><button className="confirm-link" onClick={() => onMissing(field)}>+ 标记缺失</button></div>}</div>)}</div>{!checking ? <button className="primary-button full" onClick={onTargetCheck}>交给 FDE 检查 <span>→</span></button> : <div className="validation-box"><div><span className="small-label">FDE 接手检查</span><strong>{canValidate ? '4 项验证已准备就绪' : '请完成范围、风险与首周计划检查'}</strong></div><button className="primary-button" disabled={!canValidate} onClick={onPublish}>运行检查并发布</button></div>}</> : <div className="brief-empty"><span>↳</span><p>转换后的交付上下文将在这里生成，并由 FDE 进行最终检查。</p></div>}</section>;
}

function ReviewModal({ items, reviews, onChoose, onClose, onDone }: { items: ReturnType<typeof selectedItems>; reviews: Record<string, ReviewChoice>; onChoose: (id: string, choice: ReviewChoice) => void; onClose: () => void; onDone: () => void }) {
  const current = items.find((item) => !reviews[item.id]) ?? items[0];
  const done = items.every((item) => reviews[item.id]);
  if (!current) return null;
  const options: { value: ReviewChoice; label: string }[] = current.id === 'M-03' ? [{ value: 'confirmed', label: '以 10/13 试点为当前参考' }, { value: 'open', label: '继续保留为待确认' }] : current.id === 'M-04' ? [{ value: 'signal', label: '转为待验证信号' }, { value: 'open', label: '不迁移该判断' }] : current.id === 'M-13' ? [{ value: 'confirmed', label: '写入首周验收准备项' }, { value: 'open', label: '继续保留为待确认' }] : [{ value: 'open', label: '保留为发现会澄清项' }, { value: 'confirmed', label: '作为硬性约束候选' }];
  return <div className="overlay"><section className="modal review-modal"><div className="modal-header"><div><span className="eyebrow">HUMAN REVIEW</span><h2>需要人工确认</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="review-progress"><span>已处理 {Object.keys(reviews).length}/{items.length}</span><div><i style={{ width: `${(Object.keys(reviews).length / items.length) * 100}%` }} /></div></div><div className="review-card"><span className="action-label review">需要确认</span><h3>{current.type}</h3><blockquote>“{current.quote}”</blockquote><p className="reason">{current.reason}</p><div className="review-output"><small>转换草案</small><p>{current.targetText}</p></div><div className="choice-list">{options.map((option) => <button key={option.value} className={reviews[current.id] === option.value ? 'choice selected' : 'choice'} onClick={() => onChoose(current.id, option.value)}>{option.label}<span>→</span></button>)}</div></div><div className="modal-footer"><button className="secondary-button" onClick={onClose}>稍后处理</button><button className="primary-button" disabled={!done} onClick={onDone}>写入交接草案</button></div></section></div>;
}

function EditModal({ editing, setEditing, onClose, onSave }: { editing: { field: keyof Brief; index: number; text: string; reason: string }; setEditing: (value: { field: keyof Brief; index: number; text: string; reason: string } | null) => void; onClose: () => void; onSave: () => void }) {
  return <div className="overlay"><section className="modal edit-modal"><div className="modal-header"><div><span className="eyebrow">FDE TARGET CHECK</span><h2>修改目标记忆</h2></div><button className="icon-button" onClick={onClose}>×</button></div><label>目标字段<textarea value={editing.text} onChange={(event) => setEditing({ ...editing, text: event.target.value })} /></label><label>修改理由（必填）<input maxLength={80} value={editing.reason} onChange={(event) => setEditing({ ...editing, reason: event.target.value })} placeholder="例如：需要先确认客户技术接口人与三方职责" /></label><p className="fine-print">保存后将保留 Agent 草案与 FDE 修改 Diff。</p><div className="modal-footer"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" disabled={!editing.text.trim() || !editing.reason.trim()} onClick={onSave}>保存修改</button></div></section></div>;
}

function AuditDrawer({ events, onClose }: { events: ReturnType<typeof createAudit>; onClose: () => void }) {
  return <div className="overlay overlay-right"><section className="drawer audit-drawer"><div className="modal-header"><div><span className="eyebrow">AUDIT TRAIL</span><h2>交接审计记录</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="audit-list">{events.map((event, index) => <div className={`audit-event ${event.tone ?? ''}`} key={`${event.title}-${index}`}><span className="audit-dot" /><div><small>{event.actor} · 刚刚</small><strong>{event.title}</strong><p>{event.detail}</p></div></div>)}</div></section></div>;
}

function FinalPage({ brief, score, onReset }: { brief: Brief; score: number; onReset: () => void }) {
  const questions = [
    ['客户要达成的业务结果是什么？', brief.outcome[0]],
    ['第一个必须确认的技术依赖是什么？', brief.dependencies[0]],
    ['FDE 不应向客户承诺什么？', '具体上线日期与私有化部署方案。'],
    ['首周应做什么？', brief.firstWeekPlan[0]]
  ];
  return <main className="final-page"><section className="publish-card"><div className="success-mark">✓</div><span className="eyebrow">FDE HANDOFF READY</span><h1>交接包已发布</h1><p>FDE Deployment Brief v1.0 已完成审核、修订与接手验证。</p><div className="final-score"><strong>{score}</strong><span>接手就绪度<br /><small>可启动技术发现会，不等于可承诺上线</small></span></div><div className="validation-list">{questions.map(([question, answer]) => <div key={question}><span>✓</span><p><strong>{question}</strong>{answer}</p></div>)}</div><div className="publish-actions"><button className="primary-button" onClick={onReset}>重新演示</button><button className="secondary-button" onClick={() => window.print()}>打印交接简报</button></div></section></main>;
}

createRoot(document.getElementById('root')!).render(<App />);
