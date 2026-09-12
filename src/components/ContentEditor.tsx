// ContentEditor.tsx
// Inline-editable form for GeneratedContent — supports both AI-post-edit and full manual mode.
import type { CSSProperties, FocusEvent } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import type { StyleType, GeneratedContent, ContentPoint } from '../types/video';

interface Props {
  content: GeneratedContent;
  style: StyleType;
  onChange: (c: GeneratedContent) => void;
  onReset: () => void;
}

const ACCENT_BY_STYLE: Record<StyleType, string> = {
  chinese:     '#e74c3c',
  city:        '#f5d87a',
  semantic:    '#f4cc63',
  warning:     '#f4dc70',
  aitech:      '#a855f7',
  nature:      '#4ade80',
  subtitle:    '#ffd700',
  translation: '#ffe44d',
  manga:       '#f59e0b',
};

const MAX_POINTS: Record<StyleType, number> = {
  chinese: 12, city: 16, semantic: 16, warning: 12, aitech: 12, nature: 1, subtitle: 20, translation: 1,
};

// ── Shared primitive inputs ────────────────────────────────────────────────────
function FieldInput({
  label, value, onChange, accent, multiline = false, placeholder = '', allowAddLine = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  accent: string; multiline?: boolean; placeholder?: string; allowAddLine?: boolean;
}) {
  const base: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontFamily: '"Noto Sans SC","PingFang SC",sans-serif',
    lineHeight: 1.6,
    padding: '6px 10px',
    outline: 'none',
    resize: 'none' as const,
    transition: 'border-color 0.15s',
  };

  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = `${accent}66`;
  };
  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
  };

  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.05em' }}>
        {label}
      </span>
      {multiline ? (
        <>
          <textarea
            rows={allowAddLine ? Math.min(7, Math.max(3, value.split('\n').length + 1)) : 2}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={base}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {allowAddLine && (
            <button type="button" onClick={() => onChange(`${value}\n`)}
              className="self-start text-[10px] font-medium" style={{ color: accent }}>＋新增一条步骤</button>
          )}
        </>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
}

// ── Point card ─────────────────────────────────────────────────────────────────
function PointCard({
  point, index, style, accent, canDelete,
  onChange, onDelete,
}: {
  point: ContentPoint; index: number; style: StyleType; accent: string;
  canDelete: boolean;
  onChange: (p: ContentPoint) => void;
  onDelete: () => void;
}) {
  const upd = (patch: Partial<ContentPoint>) => onChange({ ...point, ...patch });

  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: accent, textShadow: `0 0 8px ${accent}80` }}
        >
          {index + 1}
        </span>
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center rounded-md transition-colors hover:bg-red-500/20"
            style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.3)' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Fields per style */}
      {style === 'subtitle' ? (
        <FieldInput label="字幕内容" value={point.desc} onChange={v => upd({ desc: v })} accent={accent} multiline placeholder="这条字幕的文字…" />
      ) : style === 'translation' ? (
        <>
          <FieldInput label="英文翻译" value={point.desc} onChange={v => upd({ desc: v })} accent={accent} multiline placeholder="English translation…" />
        </>
      ) : (
        <>
          <FieldInput label={style === 'city' ? '全貌关键词' : style === 'warning' ? '陷阱名称' : '关键词'} value={point.label} onChange={v => upd({ label: v })} accent={accent} placeholder={style === 'city' ? '全貌折线上的核心词…' : style === 'warning' ? '例如：奶头乐陷阱' : '两三个字的核心词…'} />
          <FieldInput label={style === 'city' ? '金字塔解释' : style === 'warning' ? '尖锐判断' : '短句'} value={point.short} onChange={v => upd({ short: v })} accent={accent} multiline={style === 'city'} placeholder={style === 'city' ? '解释这个核心词的含义…' : style === 'warning' ? '一句话点破它的代价…' : '一句话概括…'} />
          <FieldInput label={style === 'city' ? '流程操作步骤（每行一条）' : style === 'semantic' ? '补充要点（每行一条）' : style === 'warning' ? '具体行为或后果' : '说明'} value={point.desc} onChange={v => upd({ desc: v })} accent={accent} multiline allowAddLine={style === 'city' || style === 'semantic'} placeholder={style === 'city' ? '打开设置\n选择插件\n点击安装' : style === 'semantic' ? '补充事实\n给出例子\n说明结果' : style === 'warning' ? '写清可观察的行为和最终后果…' : '详细说明（可留空）…'} />
          {style === 'city' && (
            <>
              <FieldInput label="界面截图地址（工具实操可选）" value={point.mediaUrl ?? ''} onChange={v => upd({ mediaUrl: v })} accent={accent} placeholder="https://…（请先处理隐私信息）" />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="事实来源（可选）" value={point.source ?? ''} onChange={v => upd({ source: v })} accent={accent} placeholder="例如 OpenAI" />
                <FieldInput label="核验日期（可选）" value={point.verifiedAt ?? ''} onChange={v => upd({ verifiedAt: v })} accent={accent} placeholder="YYYY-MM-DD" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ContentEditor({ content, style, onChange, onReset }: Props) {
  const accent = ACCENT_BY_STYLE[style];
  const maxPts = MAX_POINTS[style];
  const showTitle = style !== 'subtitle';
  const showAdd   = style !== 'translation' && style !== 'nature';

  const updTitle  = (title: string) => onChange({ ...content, title });
  const updPoint  = (i: number, p: ContentPoint) => {
    const points = content.points.map((pt, idx) => idx === i ? p : pt);
    onChange({ ...content, points });
  };
  const addPoint  = () => {
    if (content.points.length >= maxPts) return;
    onChange({ ...content, points: [...content.points, { label: '', short: '', desc: '', formatted: '' }] });
  };
  const delPoint  = (i: number) => {
    if (content.points.length <= 1) return;
    onChange({ ...content, points: content.points.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/8"
          style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <RotateCcw size={11} />
          重新生成
        </button>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {content.points.length} 条内容 · 实时预览
        </span>
      </div>

      {/* Title field */}
      {showTitle && (
        <FieldInput
          label={style === 'translation' ? '中文原句' : '视频标题'}
          value={content.title}
          onChange={updTitle}
          accent={accent}
          placeholder={style === 'translation' ? '要翻译的中文句子…' : '视频大标题…'}
        />
      )}
      {style === 'city' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.05em' }}>目标受众</span>
            <select value={content.audience ?? 'beginner'} onChange={e => onChange({ ...content, audience: e.target.value as GeneratedContent['audience'] })}
              style={{ background: '#1b2027', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: 'rgba(255,255,255,0.88)', fontSize: 12, padding: '7px 9px' }}>
              <option value="beginner">AI零基础</option>
              <option value="small-business">中小企业经营者</option>
            </select>
          </div>
          <FieldInput label="收尾行动提示" value={content.actionPrompt ?? ''} onChange={v => onChange({ ...content, actionPrompt: v })} accent={accent} placeholder="收藏这套方法" />
        </div>
      )}

      {/* Points */}
      <div className="space-y-2">
        {content.points.map((pt, i) => (
          <PointCard
            key={i}
            point={pt}
            index={i}
            style={style}
            accent={accent}
            canDelete={content.points.length > 1}
            onChange={p => updPoint(i, p)}
            onDelete={() => delPoint(i)}
          />
        ))}
      </div>

      {/* Add point */}
      {showAdd && content.points.length < maxPts && (
        <button
          onClick={addPoint}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs transition-all hover:bg-white/8 active:scale-98"
          style={{
            border: `1px dashed ${accent}44`,
            color: `${accent}bb`,
          }}
        >
          <Plus size={12} />
          添加条目
        </button>
      )}
    </div>
  );
}
