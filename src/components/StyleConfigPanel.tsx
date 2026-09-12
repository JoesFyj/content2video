// StyleConfigPanel.tsx
// Per-style live configuration panel with colour pickers, selectors, and sliders.
import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { Plus, X, Mic, MicOff, Play, Square, Loader2, RefreshCw, PawPrint, KeyRound } from 'lucide-react';
import { TTS_VOICES, getVoiceConfig, getStoredBailianKey, setStoredBailianKey, synthesizeFull } from '../services/tts';
import { generateArkImage, buildPetCoverPrompt } from '../services/ark';
import type {
  StyleType, ChineseOptions, AIOptions,
  SubtitleOptions, SubtitleEnterAnim,
  ColorScheme, AnimMode, PolyShape, CityOptions, MangaOptions, AItechOptions,
  PetCoverConfig, NatureOptions,
  ChineseCardLineConfig, ChineseLineEnterAnim, ChineseLineExitAnim,
  TitleOptions, TitleLineConfig, TitleLineEnterAnim,
  KeywordOptions, KeywordLayout, KeywordCenterAnim,
  AIGoblinOptions,
} from '../types/video';
import { DEFAULT_CARD_LINES, DEFAULT_TITLE_OPTIONS, DEFAULT_TITLE_LINE_1, DEFAULT_TITLE_LINE_2, DEFAULT_KEYWORD_OPTIONS } from '../types/video';
import CoverPicker from './CoverPicker';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  style: StyleType;
  accent: string;
  coverIndex: number;
  onCoverIndexChange: (v: number) => void;
  chineseOptions: ChineseOptions;
  onChineseOptionsChange: (v: ChineseOptions) => void;
  aiOptions: AIOptions;
  onAiOptionsChange: (v: AIOptions) => void;
  aitechOptions: AItechOptions;
  onAitechOptionsChange: (v: AItechOptions) => void;
  subtitleOptions: SubtitleOptions;
  onSubtitleOptionsChange: (v: SubtitleOptions) => void;
  cityOptions: CityOptions;
  onCityOptionsChange: (v: CityOptions) => void;
  mangaOptions: MangaOptions;
  onMangaOptionsChange: (v: MangaOptions) => void;
  accentOverrides: Partial<Record<StyleType, string>>;
  onAccentOverrideChange: (sty: StyleType, color: string) => void;
  // ── Pet cover ──────────────────────────────────────────────────────────────
  petCoverConfig: PetCoverConfig;
  onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
  // ── Nature ─────────────────────────────────────────────────────────────────
  natureOptions: NatureOptions;
  onNatureOptionsChange: (v: NatureOptions) => void;
  // ── Title (all canvas styles) ───────────────────────────────────────────────
  titleOptions: TitleOptions;
  onTitleOptionsChange: (v: TitleOptions) => void;
  // ── Keyword style ──────────────────────────────────────────────────────────
  keywordOptions: KeywordOptions;
  onKeywordOptionsChange: (v: KeywordOptions) => void;
  // ── AI Goblin style ────────────────────────────────────────────────────────
  aigoblinOptions: AIGoblinOptions;
  onAigoblinOptionsChange: (v: AIGoblinOptions) => void;
}

// ─── Shared colour presets ─────────────────────────────────────────────────────
const COLOR_PRESETS: { name: string; value: string }[] = [
  { name: '黄金', value: '#ffd700' },
  { name: '绿光', value: '#00ff88' },
  { name: '青蓝', value: '#00d4ff' },
  { name: '玫红', value: '#ff44aa' },
  { name: '橙色', value: '#ff8c00' },
  { name: '白色', value: '#ffffff' },
  { name: '紫晶', value: '#a855f7' },
  { name: '朱红', value: '#ff3b30' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {children}
    </p>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

/** A set of colour swatches + custom colour input */
function ColorPicker({
  label, value, onChange, accent,
}: { label: string; value: string; onChange: (c: string) => void; accent: string }) {
  return (
    <Row>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {COLOR_PRESETS.map(p => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              title={p.name}
              onClick={() => onChange(p.value)}
              className="relative w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: p.value,
                boxShadow: active ? `0 0 0 2px ${accent}, 0 0 0 4px ${p.value}55` : '0 0 0 1px rgba(255,255,255,0.15)',
                outline: 'none',
              }}
            >
              {active && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                  style={{ color: '#000', textShadow: 'none' }}
                >✓</span>
              )}
            </button>
          );
        })}
        {/* Custom colour */}
        <label
          className="relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 overflow-hidden"
          title="自定义颜色"
          style={{
            background: 'conic-gradient(#ff4444, #ffcc00, #44ff88, #44ccff, #8844ff, #ff44cc, #ff4444)',
            boxShadow: !COLOR_PRESETS.some(p => p.value === value)
              ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,0.15)',
          }}
        >
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          {!COLOR_PRESETS.some(p => p.value === value) && (
            <div className="absolute inset-0.5 rounded-full" style={{ background: value }} />
          )}
        </label>
      </div>
    </Row>
  );
}

/** Pills selector */
function PillSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Row>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </Row>
  );
}

/** 1-4 step slider */
function StepSlider({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <Row>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] mb-1.5 tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 h-6 rounded text-[10px] font-semibold transition-all"
            style={{
              background: value === v ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${value === v ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color: value === v ? '#fff' : 'rgba(255,255,255,0.35)',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </Row>
  );
}

/** Text input */
function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <Row>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </Row>
  );
}

/** Numeric range slider with label + value display */
function NumericSlider({
  label, value, min, max, step = 1, unit = 'px', onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  unit?: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <Row>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] mb-1.5 tabular-nums font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.7) ${pct}%,rgba(255,255,255,0.12) ${pct}%,rgba(255,255,255,0.12) 100%)`,
        }}
      />
      <div className="flex justify-between text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </Row>
  );
}

/** Optional colour picker — allows clearing to "auto/theme default" */
function OptionalColorPicker({
  label, value, placeholder, onChange, accent,
}: {
  label: string; value: string; placeholder: string;
  onChange: (c: string) => void; accent: string;
}) {
  return (
    <Row>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-[10px] mb-1 transition-opacity hover:opacity-100 opacity-40"
            style={{ color: '#fff' }}
          >
            ← 恢复默认
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {/* "Auto" swatch */}
        <button
          onClick={() => onChange('')}
          title={placeholder}
          className="px-2 h-6 rounded-full text-[10px] font-medium transition-all flex-shrink-0"
          style={{
            background: value === '' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${value === '' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: value === '' ? '#fff' : 'rgba(255,255,255,0.35)',
          }}
        >
          默认
        </button>
        {COLOR_PRESETS.map(p => {
          const active = value === p.value;
          return (
            <button
              key={p.value}
              title={p.name}
              onClick={() => onChange(p.value)}
              className="relative w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: p.value,
                boxShadow: active ? `0 0 0 2px ${accent}, 0 0 0 4px ${p.value}55` : '0 0 0 1px rgba(255,255,255,0.15)',
              }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: '#000' }}>✓</span>
              )}
            </button>
          );
        })}
        <label
          className="relative w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 overflow-hidden"
          title="自定义颜色"
          style={{
            background: 'conic-gradient(#ff4444,#ffcc00,#44ff88,#44ccff,#8844ff,#ff44cc,#ff4444)',
            boxShadow: value && !COLOR_PRESETS.some(p => p.value === value) ? `0 0 0 2px ${accent}` : '0 0 0 1px rgba(255,255,255,0.15)',
          }}
        >
          <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          {value && !COLOR_PRESETS.some(p => p.value === value) && (
            <div className="absolute inset-0.5 rounded-full" style={{ background: value }} />
          )}
        </label>
      </div>
    </Row>
  );
}

/** Thin divider with label */
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ─── PetCoverSection ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://spb-t4ngxi6xsx650369.supabase.opentrust.net';
function petProxy(url: string) {
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}

function PetCoverSection({ config, onChange, titleForGen }: {
  config: PetCoverConfig;
  onChange: (c: PetCoverConfig) => void;
  titleForGen: string;
}) {
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    if (!titleForGen) { setGenError('请先填写视频标题'); return; }
    setLoading(true);
    setGenError('');
    try {
      const prompt = buildPetCoverPrompt(titleForGen);
      const url = await generateArkImage(prompt, '1440x1920');
      onChange({ ...config, enabled: true, imageUrl: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'NO_ARK_KEY') setGenError('请先配置即梦 API Key');
      else setGenError(`生成失败: ${msg.slice(0, 60)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <SectionDivider title="宠物封面" />

      {/* Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
      >
        <div className="flex items-center gap-2">
          <PawPrint size={13} style={{ color: config.enabled ? '#f97316' : 'rgba(255,255,255,0.3)' }} />
          <Label>宠物封面</Label>
        </div>
        <div
          className="relative w-9 h-5 rounded-full transition-colors"
          style={{ background: config.enabled ? '#f97316' : 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: config.enabled ? '1.25rem' : '0.125rem' }}
          />
        </div>
      </div>

      {config.enabled && (
        <div className="space-y-2.5">
          {/* Position selector */}
          <PillSelect
            label="宠物位置"
            value={config.position}
            onChange={v => onChange({ ...config, position: v as PetCoverConfig['position'] })}
            options={[
              { value: 'bottom', label: '下半部分' },
              { value: 'center', label: '居中偏下' },
              { value: 'full', label: '全屏展示' },
            ]}
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              border: 'none',
            }}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" />AI 生成中…</>
              : <><RefreshCw size={13} />{config.imageUrl ? '重新生成宠物' : '生成宠物形象'}</>
            }
          </button>

          {/* Preview thumbnail */}
          {config.imageUrl && !loading && (
            <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '3/4', background: '#111' }}>
              <img
                src={petProxy(config.imageUrl)}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                alt="宠物封面预览"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#f97316' }}>
                已生成
              </div>
            </div>
          )}

          {genError && (
            <p className="text-[10px] text-red-400">{genError}</p>
          )}

          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            使用即梦 AI 根据标题自动生成匹配气质的柴犬宠物形象封面
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Card line animation labels ────────────────────────────────────────────────
const ENTER_ANIM_OPTS: { value: ChineseLineEnterAnim; label: string }[] = [
  { value: 'slideLeft',  label: '← 左飞入' },
  { value: 'slideRight', label: '→ 右飞入' },
  { value: 'slideUp',    label: '↑ 上滑入' },
  { value: 'slideDown',  label: '↓ 下落入' },
  { value: 'fadeIn',     label: '淡入' },
  { value: 'zoomIn',     label: '缩放入' },
  { value: 'bounceIn',   label: '弹跳入' },
  { value: 'rotateIn',   label: '旋转入' },
  { value: 'flipH',      label: '翻转入' },
  { value: 'typewriter', label: '打字机' },
  { value: 'glitch',     label: '故障' },
  { value: 'wave',       label: '波浪' },
];
const EXIT_ANIM_OPTS: { value: ChineseLineExitAnim; label: string }[] = [
  { value: 'fadeOut',    label: '淡出' },
  { value: 'slideUp',    label: '↑ 上飞出' },
  { value: 'slideDown',  label: '↓ 下落出' },
  { value: 'slideLeft',  label: '← 左飞出' },
  { value: 'slideRight', label: '→ 右飞出' },
  { value: 'zoomOut',    label: '缩小出' },
  { value: 'dissolve',   label: '溶解出' },
];
const FONT_FAMILY_OPTS = [
  { value: '',              label: 'Noto Sans SC（默认）' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'STKaiti',       label: '楷体' },
  { value: 'STSong',        label: '宋体' },
  { value: 'PingFang SC',   label: '苹方' },
  { value: 'serif',         label: '衬线' },
];

function CardLineEditor({
  line, index, accent, onChange,
}: {
  line: ChineseCardLineConfig;
  index: number;
  accent: string;
  onChange: (v: ChineseCardLineConfig) => void;
}) {
  const upd = (patch: Partial<ChineseCardLineConfig>) => onChange({ ...line, ...patch });
  const lineLabel = ['第一行', '第二行', '第三行'][index] ?? `行 ${index + 1}`;

  return (
    <div className="space-y-2.5 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-[10px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{lineLabel}</div>

      {/* Content source */}
      <Row>
        <Label>内容来源</Label>
        <div className="grid grid-cols-4 gap-1">
          {([
            { value: 'label',  label: '标题词' },
            { value: 'short',  label: '副标题' },
            { value: 'desc',   label: '描述' },
            { value: 'static', label: '自定义' },
          ] as const).map(o => (
            <button
              key={o.value}
              onClick={() => upd({ field: o.value })}
              className="py-1 rounded text-[10px] font-medium transition-all"
              style={{
                background: line.field === o.value ? accent : 'rgba(255,255,255,0.06)',
                color: line.field === o.value ? '#000' : 'rgba(255,255,255,0.55)',
              }}
            >{o.label}</button>
          ))}
        </div>
      </Row>

      {line.field === 'static' && (
        <TextInput label="自定义文字" value={line.staticText} onChange={v => upd({ staticText: v })} placeholder="输入固定显示的文字" />
      )}

      {/* Font size + weight */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <NumericSlider label="字号" value={line.fontSize} min={16} max={120} onChange={v => upd({ fontSize: v })} />
        </div>
        <div className="pb-1">
          <div className="flex gap-0.5">
            {([400, 600, 800] as const).map(w => (
              <button
                key={w}
                onClick={() => upd({ fontWeight: w })}
                className="w-7 h-6 rounded text-[10px] font-medium transition-all"
                style={{
                  fontWeight: w,
                  background: line.fontWeight === w ? accent : 'rgba(255,255,255,0.06)',
                  color: line.fontWeight === w ? '#000' : 'rgba(255,255,255,0.5)',
                }}
              >
                {w === 400 ? '细' : w === 600 ? '中' : '粗'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font family */}
      <Row>
        <Label>字体</Label>
        <select
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          value={line.fontFamily}
          onChange={e => upd({ fontFamily: e.target.value })}
        >
          {FONT_FAMILY_OPTS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Row>

      {/* Color */}
      <OptionalColorPicker label="颜色（空=自动）" value={line.color} placeholder="自动" onChange={c => upd({ color: c })} accent={accent} />

      {/* Enter animation */}
      <Row>
        <Label>入场动画</Label>
        <div className="grid grid-cols-4 gap-1">
          {ENTER_ANIM_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => upd({ enterAnim: o.value })}
              className="py-1 px-0.5 rounded text-[9px] font-medium transition-all leading-tight"
              style={{
                background: line.enterAnim === o.value ? accent : 'rgba(255,255,255,0.06)',
                color: line.enterAnim === o.value ? '#000' : 'rgba(255,255,255,0.5)',
              }}
            >{o.label}</button>
          ))}
        </div>
      </Row>

      {/* Exit animation */}
      <Row>
        <Label>退场动画</Label>
        <div className="grid grid-cols-4 gap-1">
          {EXIT_ANIM_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => upd({ exitAnim: o.value })}
              className="py-1 px-0.5 rounded text-[9px] font-medium transition-all leading-tight"
              style={{
                background: line.exitAnim === o.value ? accent : 'rgba(255,255,255,0.06)',
                color: line.exitAnim === o.value ? '#000' : 'rgba(255,255,255,0.5)',
              }}
            >{o.label}</button>
          ))}
        </div>
      </Row>
    </div>
  );
}

// ─── TitleLineEditor ───────────────────────────────────────────────────────────
const TITLE_ENTER_ANIM_OPTS: { value: TitleLineEnterAnim; label: string }[] = [
  { value: 'withScene',    label: '随场景淡入' },
  { value: 'dropsFromSky', label: '从天坠落' },
  { value: 'slideUp',      label: '↑ 上滑入' },
  { value: 'fadeIn',       label: '淡入' },
  { value: 'typewriter',   label: '打字机' },
];
const TITLE_FONT_FAMILY_OPTS = [
  { value: '',              label: 'Noto Sans SC（默认）' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'STKaiti',       label: '楷体' },
  { value: 'STSong',        label: '宋体' },
  { value: 'PingFang SC',   label: '苹方' },
  { value: 'Impact',        label: 'Impact' },
];

function TitleLineEditor({
  line, index, accent, totalLines, onChange, onDelete,
}: {
  line: TitleLineConfig;
  index: number;
  accent: string;
  totalLines: number;
  onChange: (v: TitleLineConfig) => void;
  onDelete: () => void;
}) {
  const upd = (p: Partial<TitleLineConfig>) => onChange({ ...line, ...p });
  const lineLabel = ['第一行', '第二行', '第三行'][index] ?? `行 ${index + 1}`;

  return (
    <div className="relative space-y-2.5 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-[10px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{lineLabel}</div>
      {totalLines > 1 && (
        <button onClick={onDelete} className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-40" style={{ background: 'rgba(255,80,80,0.2)', color: '#ff5555' }} title="删除">
          <X size={10} />
        </button>
      )}

      {/* Custom text ('' = auto-split) */}
      <TextInput label="自定义文字（空=自动拆分）" value={line.text} onChange={v => upd({ text: v })} placeholder="空 = 自动从标题拆分" />

      {/* Font size + weight */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <NumericSlider label="字号" value={line.fontSize} min={28} max={240} onChange={v => upd({ fontSize: v })} />
        </div>
        <div className="pb-1 flex gap-0.5">
          {([400, 700, 900] as const).map(w => (
            <button key={w} onClick={() => upd({ fontWeight: w })} className="w-7 h-6 rounded text-[10px] font-medium transition-all" style={{ fontWeight: w, background: line.fontWeight === w ? accent : 'rgba(255,255,255,0.06)', color: line.fontWeight === w ? '#000' : 'rgba(255,255,255,0.5)' }}>
              {w === 400 ? '细' : w === 700 ? '中' : '粗'}
            </button>
          ))}
        </div>
      </div>

      {/* Font family */}
      <Row>
        <Label>字体</Label>
        <select className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground" value={line.fontFamily} onChange={e => upd({ fontFamily: e.target.value })}>
          {TITLE_FONT_FAMILY_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Row>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <OptionalColorPicker label="文字颜色" value={line.color} placeholder="#ffffff" onChange={c => upd({ color: c })} accent={accent} />
        <OptionalColorPicker label="渐变色 →" value={line.colorEnd} placeholder="（无渐变）" onChange={c => upd({ colorEnd: c })} accent={accent} />
      </div>

      {/* Enter animation */}
      <Row>
        <Label>入场动画</Label>
        <div className="grid grid-cols-3 gap-1">
          {TITLE_ENTER_ANIM_OPTS.map(o => (
            <button key={o.value} onClick={() => upd({ enterAnim: o.value })}
              className="py-1 px-0.5 rounded text-[9px] font-medium transition-all leading-tight"
              style={{ background: line.enterAnim === o.value ? accent : 'rgba(255,255,255,0.06)', color: line.enterAnim === o.value ? '#000' : 'rgba(255,255,255,0.5)' }}>
              {o.label}
            </button>
          ))}
        </div>
      </Row>

      {/* Border box */}
      <div className="rounded-lg p-2 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => upd({ borderEnabled: !line.borderEnabled })}
            className="flex items-center gap-1.5 text-[10px] font-semibold"
            style={{ color: line.borderEnabled ? accent : 'rgba(255,255,255,0.35)' }}
          >
            <span className="w-3 h-3 rounded border flex items-center justify-center text-[8px]"
              style={{ borderColor: line.borderEnabled ? accent : 'rgba(255,255,255,0.25)', background: line.borderEnabled ? accent : 'transparent', color: '#000' }}>
              {line.borderEnabled ? '✓' : ''}
            </span>
            边框高亮框
          </button>
        </div>
        {line.borderEnabled && (
          <div className="space-y-2">
            <OptionalColorPicker label="边框颜色（空=主色）" value={line.borderColor ?? ''} placeholder="同主色" onChange={c => upd({ borderColor: c })} accent={accent} />
            <NumericSlider label="背景不透明度 %" value={Math.round((line.borderBgAlpha ?? 0.75) * 100)} min={0} max={100} onChange={v => upd({ borderBgAlpha: v / 100 })} />
            <div className="grid grid-cols-2 gap-2">
              <NumericSlider label="水平边距" value={line.borderPadX ?? 48} min={8} max={120} onChange={v => upd({ borderPadX: v })} />
              <NumericSlider label="垂直边距" value={line.borderPadY ?? 22} min={4} max={60} onChange={v => upd({ borderPadY: v })} />
            </div>
            <NumericSlider label="圆角" value={line.borderRadius ?? 20} min={0} max={60} onChange={v => upd({ borderRadius: v })} />
          </div>
        )}
      </div>
    </div>
  );
}

function TitlePanel({ opts, onChange, accent }: {
  opts: TitleOptions;
  onChange: (v: TitleOptions) => void;
  accent: string;
}) {
  const upd = (p: Partial<TitleOptions>) => onChange({ ...opts, ...p });
  const lines = opts.lines;

  const updateLine = (i: number, v: TitleLineConfig) => {
    const next = [...lines]; next[i] = v; upd({ lines: next });
  };
  const addLine = () => {
    if (lines.length >= 3) return;
    const def = lines.length === 0 ? DEFAULT_TITLE_LINE_1
      : lines.length === 1 ? DEFAULT_TITLE_LINE_2
      : { ...DEFAULT_TITLE_LINE_1, fontSize: 60, enterAnim: 'fadeIn' as TitleLineEnterAnim };
    upd({ lines: [...lines, def] });
  };
  const removeLine = (i: number) => {
    if (lines.length <= 1) return;
    upd({ lines: lines.filter((_, idx) => idx !== i) });
  };
  const reset = () => onChange(DEFAULT_TITLE_OPTIONS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionDivider title={`标题行（${lines.length}行）`} />
        <button onClick={reset} className="text-[9px] ml-2 transition-opacity hover:opacity-100 opacity-35 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>重置默认</button>
      </div>

      <div className="space-y-2">
        {lines.map((ln, i) => (
          <TitleLineEditor key={i} line={ln} index={i} accent={accent} totalLines={lines.length} onChange={v => updateLine(i, v)} onDelete={() => removeLine(i)} />
        ))}
        {lines.length < 3 && (
          <button onClick={addLine} className="w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all hover:opacity-80" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Plus size={11} />添加行（{lines.length}/3）
          </button>
        )}
      </div>

      <SectionDivider title="落版 · 副标题" />

      <NumericSlider label="落版字号（移至顶部后）" value={opts.headerFontSize} min={36} max={100} onChange={v => upd({ headerFontSize: v })} />

      <TextInput label="副标题文字（空=不显示）" value={opts.subtitleText} onChange={v => upd({ subtitleText: v })} placeholder="例：20多岁最大的错觉…" />
      {opts.subtitleText && (
        <>
          <NumericSlider label="副标题字号" value={opts.subtitleFontSize} min={20} max={72} onChange={v => upd({ subtitleFontSize: v })} />
          <OptionalColorPicker label="副标题颜色" value={opts.subtitleColor} placeholder="rgba(180,200,255,0.75)" onChange={c => upd({ subtitleColor: c })} accent={accent} />
        </>
      )}
    </div>
  );
}
function ChinesePanel({ options, onChange, accent, coverIndex, onCoverIndexChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover }: {
  options: ChineseOptions; onChange: (v: ChineseOptions) => void;
  accent: string; coverIndex: number; onCoverIndexChange: (v: number) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<ChineseOptions>) => onChange({ ...options, ...patch });
  const lines = options.cardLines ?? DEFAULT_CARD_LINES;

  const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
    { value: 'cinnabar', label: '朱砂' },
    { value: 'gold',     label: '金墨' },
    { value: 'jade',     label: '青玉' },
    { value: 'ink',      label: '水墨' },
    { value: 'porcelain',label: '青花' },
  ];
  const ANIM_MODES: { value: AnimMode; label: string }[] = [
    { value: 'single', label: '单句呈现' },
    { value: 'grid',   label: '九宫格' },
  ];

  const updateLine = (i: number, v: ChineseCardLineConfig) => {
    const next = [...lines];
    next[i] = v;
    upd({ cardLines: next });
  };
  const addLine = () => {
    if (lines.length >= 3) return;
    upd({ cardLines: [...lines, { ...DEFAULT_CARD_LINES[lines.length] ?? DEFAULT_CARD_LINES[2] }] });
  };
  const removeLine = (i: number) => {
    if (lines.length <= 1) return;
    upd({ cardLines: lines.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <p className="rounded-lg px-3 py-2 text-[11px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
            根据标题与正文内容自动匹配知识主题图形
          </p>
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />

      {/* ── Theme & Layout ────────────────────────────────────────────────── */}
      <SectionDivider title="主题 · 布局" />
      <PillSelect
        label="标题入场动画"
        value={options.titleEntranceAnim ?? 'dropsFromSky'}
        onChange={v => upd({ titleEntranceAnim: v as 'dropsFromSky' | 'typewriter' })}
        options={[
          { value: 'dropsFromSky', label: '从天而降' },
          { value: 'typewriter',   label: '打字机' },
        ]}
      />
      <PillSelect label="配色方案" value={options.colorScheme} onChange={cs => upd({ colorScheme: cs as ColorScheme })} options={COLOR_SCHEMES} />
      <StepSlider label="边框宽度" value={options.borderWidth} min={1} max={4} onChange={v => upd({ borderWidth: v as 1|2|3|4 })} />
      <StepSlider label="线条宽度" value={options.lineWidth}   min={1} max={4} onChange={v => upd({ lineWidth:   v as 1|2|3|4 })} />
      <PillSelect label="动画模式" value={options.animMode}    onChange={am => upd({ animMode: am as AnimMode })} options={ANIM_MODES} />

      {/* ── Card grid layout ─────────────────────────────────────────────── */}
      <SectionDivider title="卡片版式" />
      <PillSelect
        label="每页行数"
        value={String(options.cardRows ?? 3)}
        onChange={v => upd({ cardRows: Number(v) as 1 | 2 | 3 })}
        options={[
          { value: '1', label: '1 行' },
          { value: '2', label: '2 行' },
          { value: '3', label: '3 行' },
        ]}
      />
      <PillSelect
        label="每行列数"
        value={String(options.cardCols ?? 2)}
        onChange={v => upd({ cardCols: Number(v) as 1 | 2 })}
        options={[
          { value: '1', label: '1 列' },
          { value: '2', label: '2 列' },
        ]}
      />
      <div className="px-2 py-1.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
        每页 <b style={{ color: 'rgba(255,255,255,0.6)' }}>{(options.cardRows ?? 3) * (options.cardCols ?? 2)}</b> 张卡片
      </div>

      {/* ── Per-line text config ──────────────────────────────────────────── */}
      <SectionDivider title={`卡片文字（${lines.length} 行）`} />

      <div className="space-y-2">
        {lines.map((ln, i) => (
          <div key={i} className="relative">
            <CardLineEditor line={ln} index={i} accent={accent} onChange={v => updateLine(i, v)} />
            {lines.length > 1 && (
              <button
                onClick={() => removeLine(i)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-opacity hover:opacity-100 opacity-40"
                style={{ background: 'rgba(255,80,80,0.2)', color: '#ff5555' }}
                title="删除此行"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {lines.length < 3 && (
          <button
            onClick={addLine}
            className="w-full py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <Plus size={11} />
            添加行（{lines.length}/3）
          </button>
        )}
      </div>
    </div>
  );
}

function CityPanel({
  coverIndex, onCoverIndexChange,
  accentColor, onAccentColorChange,
  style,
  cityOptions, onCityOptionsChange,
  petCoverConfig, onPetCoverConfigChange, titleForPetCover,
}: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  cityOptions: CityOptions; onCityOptionsChange: (v: CityOptions) => void;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<CityOptions>) => onCityOptionsChange({ ...cityOptions, ...patch });
  return (
    <div className="space-y-4">
      <button
        onClick={() => upd({ animationSeed: (cityOptions.animationSeed ?? 1) + 1 })}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-all hover:bg-white/10"
        style={{ background: 'rgba(255,255,255,0.05)', color: accentColor, border: `1px solid ${accentColor}44` }}
      >
        <RefreshCw size={12} />换一组动画布局
      </button>
      <SectionDivider title="AI知识导演" />
      <div>
        <Label>账号名称</Label>
        <input
          value={cityOptions.accountName ?? '思享稼'}
          maxLength={12}
          onChange={event => upd({ accountName: event.target.value })}
          className="mt-1.5 w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
      <div>
        <Label>片尾 Slogan</Label>
        <input
          value={cityOptions.outroSlogan ?? '生活新方案，就找AIfman.'}
          maxLength={36}
          onChange={event => upd({ outroSlogan: event.target.value })}
          className="mt-1.5 w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([
          ['deep-tech', '深色科技'],
          ['bright-knowledge', '明亮知识'],
          ['business', '商务沉稳'],
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => upd({ visualTheme: value })}
            className="rounded-lg px-2 py-2 text-[10px] transition-all"
            style={{
              color: cityOptions.visualTheme === value ? '#fff' : 'rgba(255,255,255,0.45)',
              background: cityOptions.visualTheme === value ? `${accentColor}28` : 'rgba(255,255,255,0.035)',
              border: `1px solid ${cityOptions.visualTheme === value ? `${accentColor}88` : 'rgba(255,255,255,0.08)'}`,
            }}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([
          ['calm', '克制'], ['balanced', '平衡'], ['dynamic', '动感'],
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => upd({ animationIntensity: value })}
            className="rounded-lg px-2 py-2 text-[10px] transition-all"
            style={{
              color: cityOptions.animationIntensity === value ? '#fff' : 'rgba(255,255,255,0.45)',
              background: cityOptions.animationIntensity === value ? `${accentColor}28` : 'rgba(255,255,255,0.035)',
              border: `1px solid ${cityOptions.animationIntensity === value ? `${accentColor}88` : 'rgba(255,255,255,0.08)'}`,
            }}>{label}动画</button>
        ))}
      </div>
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />
      <ColorPicker label="强调色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />

      <SectionDivider title="全貌关键词" />
      <NumericSlider label="字号" value={cityOptions.labelFontSize ?? 50} min={30} max={72} onChange={v => upd({ labelFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.labelColor ?? ''} placeholder="#ffffff" onChange={c => upd({ labelColor: c })} accent={accentColor} />

      <SectionDivider title="金字塔层级词" />
      <NumericSlider label="字号" value={cityOptions.pyramidLabelFontSize ?? 38} min={24} max={58} onChange={v => upd({ pyramidLabelFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.pyramidLabelColor ?? ''} placeholder="#ffffff" onChange={c => upd({ pyramidLabelColor: c })} accent={accentColor} />

      <SectionDivider title="金字塔解释" />
      <NumericSlider label="字号" value={cityOptions.shortFontSize ?? 36} min={24} max={52} onChange={v => upd({ shortFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.shortColor ?? ''} placeholder="#ffffff" onChange={c => upd({ shortColor: c })} accent={accentColor} />

      <SectionDivider title="流程节点名称" />
      <NumericSlider label="字号" value={cityOptions.workflowLabelFontSize ?? 40} min={26} max={60} onChange={v => upd({ workflowLabelFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.workflowLabelColor ?? ''} placeholder="#ffffff" onChange={c => upd({ workflowLabelColor: c })} accent={accentColor} />

      <SectionDivider title="流程操作步骤正文（不含序号）" />
      <Row>
        <Label>字体</Label>
        <select
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          value={cityOptions.descFontFamily ?? ''}
          onChange={event => upd({ descFontFamily: event.target.value })}
        >
          {FONT_FAMILY_OPTS.map(font => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </Row>
      <NumericSlider label="字号" value={cityOptions.descFontSize ?? 36} min={24} max={48} onChange={v => upd({ descFontSize: v })} />
      <OptionalColorPicker label="颜色（空=白色）" value={cityOptions.descColor ?? ''} placeholder="#ffffff" onChange={c => upd({ descColor: c })} accent={accentColor} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD PANEL
// ─────────────────────────────────────────────────────────────────────────────
function KeywordPanel({
  keywordOptions, onKeywordOptionsChange, accentColor, onAccentColorChange,
}: {
  keywordOptions: KeywordOptions;
  onKeywordOptionsChange: (v: KeywordOptions) => void;
  accentColor: string;
  onAccentColorChange: (c: string) => void;
}) {
  const upd = (patch: Partial<KeywordOptions>) => onKeywordOptionsChange({ ...keywordOptions, ...patch });

  const LAYOUTS: { value: KeywordLayout; label: string }[] = [
    { value: 'grid',      label: '表格网格' },
    { value: 'radial',    label: '同心圆环' },
    { value: 'card',      label: '编号卡片' },
    { value: 'flow',      label: '瀑布流列' },
    { value: 'hexgrid',   label: '边框卡片' },
    { value: 'colorgrid', label: '彩色卡片' },
  ];

  return (
    <div className="space-y-5">
      {/* Layout picker */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>排列样式</p>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              onClick={() => upd({ layout: l.value })}
              className="rounded-xl py-2.5 text-xs font-semibold transition-all"
              style={{
                background: keywordOptions.layout === l.value ? `${accentColor}30` : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: keywordOptions.layout === l.value ? accentColor : 'rgba(255,255,255,0.1)',
                color: keywordOptions.layout === l.value ? accentColor : 'rgba(255,255,255,0.5)',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color (matches main accent) */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>主色 / 中心词颜色</p>
        <div className="flex items-center gap-3">
          <input type="color" value={accentColor} onChange={e => { onAccentColorChange(e.target.value); upd({ accentColor: e.target.value }); }}
            className="w-9 h-9 rounded-lg cursor-pointer border-0" style={{ background: 'transparent' }} />
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{accentColor}</span>
        </div>
      </div>

      <NumericSlider label="中心词字号" value={keywordOptions.centerFontSize ?? 120} min={60} max={200} step={4} onChange={v => upd({ centerFontSize: v })} />
      <NumericSlider label="关键词字号" value={keywordOptions.keywordFontSize ?? 48}  min={24} max={96}  step={2} onChange={v => upd({ keywordFontSize: v })} />
      <NumericSlider label="出现间隔" value={keywordOptions.staggerMs ?? 180} min={60} max={600} step={20} unit="ms" onChange={v => upd({ staggerMs: v })} />

      {/* Center word entrance animation selector */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>中心词出场动效</p>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { key: 'scale',      label: '缩放',   sub: '弹入' },
            { key: 'typewriter', label: '打字机', sub: '逐字' },
            { key: 'flydown',    label: '飞入',   sub: '天降' },
            { key: 'glitch',     label: '故障',   sub: '乱码' },
            { key: 'explode',    label: '聚合',   sub: '爆炸' },
            { key: 'blur',       label: '对焦',   sub: '虚化' },
            { key: 'wave',       label: '波浪',   sub: '逐字' },
          ] as { key: KeywordCenterAnim; label: string; sub: string }[]).map(({ key, label, sub }) => {
            const active = (keywordOptions.centerEnterAnim ?? 'scale') === key;
            return (
              <button key={key} onClick={() => upd({ centerEnterAnim: key })}
                className="flex flex-col items-center rounded-xl py-2 text-xs transition-all"
                style={{
                  background: active ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: active ? accentColor : 'rgba(255,255,255,0.08)',
                  color: active ? accentColor : 'rgba(255,255,255,0.45)',
                }}>
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-60 mt-0.5">{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>字体粗细</p>
        <div className="flex gap-2">
          {([400, 600, 700, 800] as const).map(w => (
            <button key={w} onClick={() => upd({ fontWeight: w })}
              className="flex-1 rounded-xl py-2 text-xs font-medium transition-all"
              style={{
                background: (keywordOptions.fontWeight ?? 700) === w ? `${accentColor}28` : 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: (keywordOptions.fontWeight ?? 700) === w ? accentColor : 'rgba(255,255,255,0.1)',
                color: (keywordOptions.fontWeight ?? 700) === w ? accentColor : 'rgba(255,255,255,0.4)',
              }}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <OptionalColorPicker label="关键词文字颜色（空=白色）" value={keywordOptions.keywordColor ?? ''} placeholder="#ffffff" onChange={c => upd({ keywordColor: c })} accent={accentColor} />
      <OptionalColorPicker label="卡片边框颜色（空=主色）"   value={keywordOptions.cardBorderColor ?? ''} placeholder="同主色" onChange={c => upd({ cardBorderColor: c })} accent={accentColor} />
      <OptionalColorPicker label="网格线颜色（空=主色）"     value={keywordOptions.gridLineColor ?? ''} placeholder="同主色" onChange={c => upd({ gridLineColor: c })} accent={accentColor} />
    </div>
  );
}

function AItechPanel({ coverIndex, onCoverIndexChange, aitechOptions, onAitechOptionsChange, accentColor, onAccentColorChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  aitechOptions: AItechOptions; onAitechOptionsChange: (v: AItechOptions) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
}) {
  const upd = (patch: Partial<AItechOptions>) => onAitechOptionsChange({ ...aitechOptions, ...patch });

  return (
    <div className="space-y-4">
      {!petCoverConfig.enabled && (
        <Row>
          <Label>封面图案</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />
      <ColorPicker label="科技主色" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />

      {/* ── 阶段一：中心图案 ─────────────────────────────────────────────────── */}
      <SectionDivider title="阶段一 — 中心图案" />
      <PillSelect label="图案类型" value={aitechOptions.centerPattern ?? 'random'} onChange={v => upd({ centerPattern: v as AItechOptions['centerPattern'] })} options={[
        { value: 'random',   label: '随机' },
        { value: 'arc',      label: '弧形' },
        { value: 'rings',    label: '同心环' },
        { value: 'spiral',   label: '螺旋' },
        { value: 'neuron',   label: '神经元' },
        { value: 'dna',      label: 'DNA双螺旋' },
        { value: 'atom',     label: '原子轨道' },
        { value: 'compass',  label: '罗盘' },
        { value: 'radar',    label: '雷达扫描' },
        { value: 'hexgrid',  label: '蜂巢六边' },
        { value: 'sunburst', label: '日光放射' },
        { value: 'vortex',   label: '漩涡' },
        { value: 'crystal',  label: '水晶' },
        { value: 'eye',      label: '天眼' },
        { value: 'infinity', label: '无限符号' },
      ]} />

      {/* ── 阶段一：关键词标签 ─────────────────────────────────────────────── */}
      <SectionDivider title="阶段一 — 放射关键词标签" />
      <NumericSlider label="标签字号" value={aitechOptions.radialFontSize ?? 52} min={28} max={80} onChange={v => upd({ radialFontSize: v })} />
      <OptionalColorPicker label="标签文字颜色（空=白色）" value={aitechOptions.radialColor ?? ''} placeholder="#ffffff" onChange={c => upd({ radialColor: c })} accent={accentColor} />
      <OptionalColorPicker label="序号颜色（空=主色）" value={aitechOptions.radialNumberColor ?? ''} placeholder="同主色" onChange={c => upd({ radialNumberColor: c })} accent={accentColor} />
      <NumericSlider label="短句字号" value={aitechOptions.radialShortFontSize ?? 34} min={20} max={60} onChange={v => upd({ radialShortFontSize: v })} />
      <OptionalColorPicker label="短句颜色（空=淡蓝白）" value={aitechOptions.radialShortColor ?? ''} placeholder="rgba(200,220,255,0.85)" onChange={c => upd({ radialShortColor: c })} accent={accentColor} />

      {/* ── 过渡效果 ────────────────────────────────────────────────────────── */}
      <SectionDivider title="画面翻转过渡" />
      <PillSelect label="爆裂效果" value={aitechOptions.burstTransition ?? 'shatter'} onChange={v => upd({ burstTransition: v as AItechOptions['burstTransition'] })} options={[
        { value: 'shatter', label: '碎片爆裂' },
        { value: 'flash',   label: '白闪' },
        { value: 'wipe',    label: '放射擦除' },
      ]} />

      {/* ── 阶段三：关键词框 ─────────────────────────────────────────────────── */}
      <SectionDivider title="阶段三 — 关键词边框" />
      <NumericSlider label="关键词字号" value={aitechOptions.kwBoxFontSize ?? 62} min={28} max={100} onChange={v => upd({ kwBoxFontSize: v })} />
      <OptionalColorPicker label="关键词文字颜色（空=白色）" value={aitechOptions.kwBoxColor ?? ''} placeholder="#ffffff" onChange={c => upd({ kwBoxColor: c })} accent={accentColor} />
      <OptionalColorPicker label="边框颜色（空=主色）" value={aitechOptions.kwBoxBorderColor ?? ''} placeholder="同主色" onChange={c => upd({ kwBoxBorderColor: c })} accent={accentColor} />
      <NumericSlider label="边框粗细" value={aitechOptions.kwBoxBorderWidth ?? 3} min={1} max={8} onChange={v => upd({ kwBoxBorderWidth: v })} />
      <NumericSlider label="背景不透明度 %" value={Math.round((aitechOptions.kwBoxBgAlpha ?? 0) * 100)} min={0} max={100} onChange={v => upd({ kwBoxBgAlpha: v / 100 })} />

      {/* ── 阶段三：说明文字 ─────────────────────────────────────────────────── */}
      <SectionDivider title="阶段三 — 说明文字" />
      <NumericSlider label="说明字号" value={aitechOptions.descFontSize ?? 42} min={24} max={68} onChange={v => upd({ descFontSize: v })} />
      <OptionalColorPicker label="说明颜色（空=浅灰）" value={aitechOptions.descColor ?? ''} placeholder="rgba(220,220,220,0.92)" onChange={c => upd({ descColor: c })} accent={accentColor} />
      <PillSelect label="出现效果" value={aitechOptions.descEnterEffect ?? 'typewriter'} onChange={v => upd({ descEnterEffect: v as AItechOptions['descEnterEffect'] })} options={[
        { value: 'typewriter', label: '打字机' },
        { value: 'fadeIn',     label: '淡入' },
        { value: 'slideRight', label: '右滑入' },
      ]} />

      {/* ── 阶段四：宫格 ────────────────────────────────────────────────────── */}
      <SectionDivider title="阶段四 — 宫格收尾" />
      <PillSelect label="格子出现" value={aitechOptions.gridCellEnterEffect ?? 'zoomIn'} onChange={v => upd({ gridCellEnterEffect: v as AItechOptions['gridCellEnterEffect'] })} options={[
        { value: 'zoomIn',  label: '缩放弹入' },
        { value: 'flipIn',  label: '翻转入场' },
        { value: 'slideUp', label: '上滑入' },
        { value: 'fadeIn',  label: '淡入' },
      ]} />
      <PillSelect label="爆炸效果" value={aitechOptions.gridExplosionStyle ?? 'burst'} onChange={v => upd({ gridExplosionStyle: v as AItechOptions['gridExplosionStyle'] })} options={[
        { value: 'burst',   label: '爆破飞散' },
        { value: 'scatter', label: '随机散开' },
        { value: 'implode', label: '向内收缩' },
      ]} />
      <NumericSlider label="关键词字号" value={aitechOptions.gridKeywordFontSize ?? 72} min={32} max={120} onChange={v => upd({ gridKeywordFontSize: v })} />
      <NumericSlider label="短句字号" value={aitechOptions.gridShortFontSize ?? 38} min={16} max={64} onChange={v => upd({ gridShortFontSize: v })} />
      <OptionalColorPicker label="关键词颜色（空=白色）" value={aitechOptions.gridKeywordColor ?? ''} placeholder="#ffffff" onChange={c => upd({ gridKeywordColor: c })} accent={accentColor} />
      <OptionalColorPicker label="短句颜色" value={aitechOptions.gridShortColor ?? ''} placeholder="rgba(200,200,200,0.9)" onChange={c => upd({ gridShortColor: c })} accent={accentColor} />
      <OptionalColorPicker label="边框颜色（空=主色）" value={aitechOptions.gridBorderColor ?? ''} placeholder="同主色" onChange={c => upd({ gridBorderColor: c })} accent={accentColor} />
      <OptionalColorPicker label="序号颜色（空=主色）" value={aitechOptions.gridNumColor ?? ''} placeholder="同主色" onChange={c => upd({ gridNumColor: c })} accent={accentColor} />
    </div>
  );
}


const NATURE_FONTS = [
  { value: '',                    label: '默认（Noto Sans SC）' },
  { value: 'Microsoft YaHei',     label: '微软雅黑' },
  { value: 'PingFang SC',         label: '苹方' },
  { value: 'STKaiti',             label: '楷体' },
  { value: 'serif',               label: '衬线' },
  { value: 'sans-serif',          label: '无衬线' },
];

function NaturePanel({ coverIndex, onCoverIndexChange, accentColor, onAccentColorChange, style, petCoverConfig, onPetCoverConfigChange, titleForPetCover, natureOptions, onNatureOptionsChange }: {
  coverIndex: number; onCoverIndexChange: (v: number) => void;
  accentColor: string; onAccentColorChange: (c: string) => void;
  style: StyleType;
  petCoverConfig: PetCoverConfig; onPetCoverConfigChange: (c: PetCoverConfig) => void;
  titleForPetCover: string;
  natureOptions: NatureOptions; onNatureOptionsChange: (v: NatureOptions) => void;
}) {
  const upd = (patch: Partial<NatureOptions>) => onNatureOptionsChange({ ...natureOptions, ...patch });

  return (
    <div className="space-y-4">
      {!petCoverConfig.enabled && (
        <Row>
          <Label>场景选择</Label>
          <CoverPicker style={style} value={coverIndex} onChange={onCoverIndexChange} />
        </Row>
      )}
      <PetCoverSection config={petCoverConfig} onChange={onPetCoverConfigChange} titleForGen={titleForPetCover} />

      {/* ── 颜色 ── */}
      <SectionDivider title="颜色" />
      <OptionalColorPicker label="左侧色（空=自动配色）" value={natureOptions.leftColor ?? ''} placeholder="自动" onChange={c => upd({ leftColor: c })} accent={accentColor} />
      <OptionalColorPicker label="右侧色（空=自动配色）" value={natureOptions.rightColor ?? ''} placeholder="自动" onChange={c => upd({ rightColor: c })} accent={accentColor} />
      <OptionalColorPicker label="标题颜色（空=白色）" value={natureOptions.titleColor ?? ''} placeholder="#ffffff" onChange={c => upd({ titleColor: c })} accent={accentColor} />

      {/* ── 字体 ── */}
      <SectionDivider title="字体" />
      <Row>
        <Label>字体</Label>
        <select
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          value={natureOptions.fontFamily ?? ''}
          onChange={e => upd({ fontFamily: e.target.value })}
        >
          {NATURE_FONTS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Row>

      {/* ── 字体大小 ── */}
      <SectionDivider title="字体大小" />
      <NumericSlider label="标题字号" value={natureOptions.titleFontSize ?? 68} min={40} max={100} onChange={v => upd({ titleFontSize: v })} />
      <NumericSlider label="词组字号（基准）" value={natureOptions.wordFontSize ?? 46} min={24} max={70} onChange={v => upd({ wordFontSize: v })} />

      {/* ── 边框 ── */}
      <SectionDivider title="圆圈边框" />
      <NumericSlider label="边框宽度" value={natureOptions.borderWidth ?? 2.5} min={1} max={10} step={0.5} onChange={v => upd({ borderWidth: v })} />

      <ColorPicker label="强调色（备用）" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
    </div>
  );
}

const ENTER_ANIMS: { value: SubtitleEnterAnim; label: string; desc: string }[] = [
  { value: 'slideUp',    label: '上滑进入', desc: '从下向上' },
  { value: 'slideLeft',  label: '左侧进入', desc: '从左滑入' },
  { value: 'slideRight', label: '右侧进入', desc: '从右滑入' },
  { value: 'typewriter', label: '打字机',   desc: '逐字显示' },
  { value: 'fadeIn',     label: '淡入',     desc: '渐变显现' },
];

const FONT_SIZES: { value: SubtitleOptions['fontSize']; label: string; sub: string }[] = [
  { value: 'auto', label: '自适应', sub: '自动' },
  { value: 'sm',   label: '小字',   sub: '52px' },
  { value: 'md',   label: '中字',   sub: '68px' },
  { value: 'lg',   label: '大字',   sub: '88px' },
];

const LINES_PER_SLIDE = [1, 2, 3, 4, 5, 6] as const;

function SubtitlePanel({ opts, onChange, accentColor, onAccentColorChange }: {
  opts: SubtitleOptions;
  onChange: (v: SubtitleOptions) => void;
  accentColor: string;
  onAccentColorChange: (c: string) => void;
}) {
  const u = (patch: Partial<SubtitleOptions>) => onChange({ ...opts, ...patch });

  // ── Keyword highlight add form local state ──────────────────────────────
  const [hlText,  setHlText]  = useState('');
  const [hlColor, setHlColor] = useState('#ff4488');

  const highlights = opts.highlights ?? [];

  const addHighlight = () => {
    const t = hlText.trim();
    if (!t) return;
    // Avoid duplicates
    if (highlights.some(h => h.text === t)) { setHlText(''); return; }
    u({ highlights: [...highlights, { text: t, color: hlColor }] });
    setHlText('');
  };

  const removeHighlight = (i: number) => {
    u({ highlights: highlights.filter((_, idx) => idx !== i) });
  };

  const updateHighlightColor = (i: number, color: string) => {
    const next = highlights.map((h, idx) => idx === i ? { ...h, color } : h);
    u({ highlights: next });
  };

  return (
    <div className="space-y-4">

      {/* Title */}
      <TextInput label="账号 / 标题名称" value={opts.titleText} onChange={v => u({ titleText: v })} placeholder="例：小福分享舍" />

      {/* Title colour */}
      <ColorPicker label="标题色 / 左侧装饰条" value={opts.titleColor} onChange={c => u({ titleColor: c })} accent={opts.accentColor} />

      {/* Accent colour (even lines) */}
      <ColorPicker label="高亮文字色（偶数行）" value={opts.accentColor} onChange={c => u({ accentColor: c })} accent={opts.accentColor} />

      {/* Default text colour */}
      <ColorPicker label="正文颜色（奇数行）" value={opts.defaultTextColor} onChange={c => u({ defaultTextColor: c })} accent={opts.accentColor} />

      {/* Font size */}
      <Row>
        <Label>字体大小</Label>
        <div className="grid grid-cols-4 gap-1">
          {FONT_SIZES.map(fs => {
            const active = opts.fontSize === fs.value;
            return (
              <button
                key={fs.value}
                onClick={() => u({ fontSize: fs.value })}
                className="flex flex-col items-center py-1.5 rounded-lg transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>{fs.label}</span>
                <span className="text-[9px]" style={{ color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{fs.sub}</span>
              </button>
            );
          })}
        </div>
      </Row>

      {/* Enter animation */}
      <Row>
        <Label>字幕出场方式</Label>
        <div className="grid grid-cols-1 gap-1">
          {ENTER_ANIMS.map(a => {
            const active = opts.enterAnim === a.value;
            return (
              <button
                key={a.value}
                onClick={() => u({ enterAnim: a.value })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left"
                style={{
                  background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                  style={{ background: active ? opts.accentColor : 'rgba(255,255,255,0.2)' }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                    {a.label}
                  </span>
                  <span className="ml-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{a.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Row>

      {/* Lines per slide */}
      <Row>
        <div className="flex items-center justify-between">
          <Label>同时显示行数（滚动窗口）</Label>
          <span className="text-[11px] mb-1.5" style={{ color: opts.accentColor }}>
            {opts.linesPerSlide} 行
          </span>
        </div>
        <div className="flex gap-1">
          {LINES_PER_SLIDE.map(n => {
            const active = opts.linesPerSlide === n;
            return (
              <button
                key={n}
                onClick={() => u({ linesPerSlide: n })}
                className="flex-1 h-7 rounded text-xs font-semibold transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? opts.accentColor + '80' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: active ? `0 0 8px ${opts.accentColor}30` : 'none',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          超过此行数自动分页到下一画面
        </p>
      </Row>

      {/* ── Keyword highlights ─────────────────────────────────────────────── */}
      <Row>
        <Label>关键词高亮</Label>

        {/* Existing highlight pills */}
        {highlights.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {highlights.map((hl, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: `${hl.color}18`, border: `1px solid ${hl.color}45` }}
              >
                {/* Inline colour dot / tiny picker */}
                <label className="relative w-4 h-4 rounded-full cursor-pointer flex-shrink-0 overflow-hidden"
                  style={{ background: hl.color }}>
                  <input
                    type="color"
                    value={hl.color}
                    onChange={e => updateHighlightColor(i, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <span className="flex-1 text-xs font-medium truncate" style={{ color: hl.color }}>
                  {hl.text}
                </span>
                <button
                  onClick={() => removeHighlight(i)}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new keyword form */}
        <div className="flex gap-1.5 items-center">
          <input
            type="text"
            value={hlText}
            onChange={e => setHlText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHighlight()}
            placeholder="输入关键词…"
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          {/* Colour dot picker */}
          <label
            className="relative w-7 h-7 rounded-lg cursor-pointer flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: hlColor, border: '1px solid rgba(255,255,255,0.2)' }}
            title="选择颜色"
          >
            <input
              type="color"
              value={hlColor}
              onChange={e => setHlColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
          {/* Add button */}
          <button
            onClick={addHighlight}
            disabled={!hlText.trim()}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
            style={{ background: opts.accentColor, boxShadow: `0 0 10px ${opts.accentColor}50` }}
          >
            <Plus size={13} className="text-black" />
          </button>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          匹配到的关键词将用指定颜色高亮，点击色块可修改颜色
        </p>
      </Row>

      {/* ── Line spacing ─────────────────────────────────────────────────────── */}
      <NumericSlider label="行间距" value={opts.lineSpacing ?? 0} min={0} max={120} step={4}
        onChange={v => u({ lineSpacing: v })} />

      {/* ── Gradient text ────────────────────────────────────────────────────── */}
      <Row>
        <div className="flex items-center gap-2">
          <button
            onClick={() => u({ gradientText: !opts.gradientText })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left"
            style={{
              background: opts.gradientText ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${opts.gradientText ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: opts.gradientText ? opts.accentColor : 'rgba(255,255,255,0.2)' }} />
            <span className="text-[11px] font-semibold" style={{ color: opts.gradientText ? '#fff' : 'rgba(255,255,255,0.4)' }}>渐变文字色</span>
          </button>
        </div>
        {opts.gradientText && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>起始色</span>
              <label className="relative w-6 h-6 rounded cursor-pointer flex-shrink-0 overflow-hidden" style={{ background: opts.gradientColorStart || opts.accentColor, border: '1px solid rgba(255,255,255,0.2)' }}>
                <input type="color" value={opts.gradientColorStart || opts.accentColor} onChange={e => u({ gradientColorStart: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </label>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>结束色</span>
              <label className="relative w-6 h-6 rounded cursor-pointer flex-shrink-0 overflow-hidden" style={{ background: opts.gradientColorEnd || opts.defaultTextColor, border: '1px solid rgba(255,255,255,0.2)' }}>
                <input type="color" value={opts.gradientColorEnd || opts.defaultTextColor} onChange={e => u({ gradientColorEnd: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </label>
              <div className="flex-1 h-4 rounded" style={{ background: `linear-gradient(to right, ${opts.gradientColorStart || opts.accentColor}, ${opts.gradientColorEnd || opts.defaultTextColor})` }} />
            </div>
          </div>
        )}
      </Row>

      {/* ── Per-line text editing ─────────────────────────────────────────────── */}
      {(opts.customLines ?? []).length > 0 && (
        <Row>
          <Label>逐行文字编辑</Label>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {(opts.customLines ?? []).map((line, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-[10px] font-mono mt-2 flex-shrink-0 w-5 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                <textarea
                  value={line}
                  onChange={e => {
                    const next = [...(opts.customLines ?? [])];
                    next[i] = e.target.value;
                    u({ customLines: next });
                  }}
                  rows={2}
                  placeholder="（留空则自动生成）"
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none resize-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    lineHeight: '1.4',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = opts.accentColor + '60')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            每行对应一个内容点，留空则使用自动生成的文字
          </p>
        </Row>
      )}

    </div>
  );
}

function MangaPanel({ opts, onChange }: {
  opts: MangaOptions; onChange: (v: MangaOptions) => void;
}) {
  const u = (patch: Partial<MangaOptions>) => onChange({ ...opts, ...patch });

  // ── Bailian API key (localStorage, not in code) ───────────────────────────
  const [bailianKey, setBailianKey] = useState(() => getStoredBailianKey());
  const handleKeyChange = (val: string) => {
    setBailianKey(val);
    setStoredBailianKey(val);
  };

  // ── Voice preview: use real Bailian TTS (MP3) if key set, else browser TTS ──
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice]       = useState<string | null>(null);
  const [previewError, setPreviewError]        = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPreviewingVoice(null);
    setLoadingVoice(null);
  };

  const previewVoice = async (voiceId: string) => {
    setPreviewError('');
    if (previewingVoice === voiceId || loadingVoice === voiceId) { stopPreview(); return; }
    stopPreview();

    // ── If Bailian key set: fetch real MP3 from Edge Function ──────────────
    if (bailianKey) {
      setLoadingVoice(voiceId);
      try {
        const result = await synthesizeFull('你好，大家好，欢迎使用漫画字幕配音功能。', voiceId, { rate: opts.ttsRate ?? 1.0 });
        // Show warning if falling back to Google TTS (API key not working)
        if (result.source === 'google-fallback') {
          setPreviewError(`API未生效，使用备用语音。错误：${result.errors ?? '请确认API Key是否已开通TTS模型'}`);
        }
        const url = URL.createObjectURL(new Blob([result.data], { type: 'audio/mpeg' }));
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setPreviewingVoice(null); };
        audio.onerror = () => { setPreviewError('播放失败，请检查 API Key 或网络'); setPreviewingVoice(null); };
        await audio.play();
        setLoadingVoice(null);
        setPreviewingVoice(voiceId);
      } catch (e) {
        setLoadingVoice(null);
        setPreviewError(`试听失败: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    // ── Fallback: browser speechSynthesis (all voices sound similar) ───────
    if (!('speechSynthesis' in window)) { setPreviewError('浏览器不支持语音试听'); return; }
    setPreviewingVoice(voiceId);
    const cfg = getVoiceConfig(voiceId);
    const utt = new SpeechSynthesisUtterance('你好，大家好，欢迎使用漫画字幕配音。');
    utt.lang = 'zh-CN';
    utt.rate = cfg.previewRate;
    utt.pitch = cfg.previewPitch;
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh-CN')) ?? voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utt.voice = zhVoice;
    utt.onend = () => setPreviewingVoice(null);
    utt.onerror = (e) => {
      setPreviewingVoice(null);
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (err !== 'interrupted') setPreviewError(`试听失败: ${err ?? '请检查音频设备'}`);
    };
    window.speechSynthesis.speak(utt);
  };

  // Effective voice for highlight
  const effectiveVoice = opts.ttsCustomVoice?.trim() || opts.ttsVoice || 'longxiaochun';

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)');
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)');

  return (
    <div className="space-y-4">
      {/* ── Mode: 普通 / RAP ── */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>内容模式</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: false, label: '漫画字幕', sub: '普通配音' },
            { value: true,  label: 'RAP 模式', sub: '说唱歌词' },
          ] as { value: boolean; label: string; sub: string }[]).map(m => (
            <button
              key={String(m.value)}
              onClick={() => {
                const newRap = m.value;
                u({
                  rapMode: newRap,
                  // Auto-set faster TTS rate for RAP rhythm, reset for normal
                  ttsRate: newRap
                    ? (opts.ttsRate === 1.0 ? 1.3 : opts.ttsRate)
                    : (opts.ttsRate === 1.3 ? 1.0 : opts.ttsRate),
                });
              }}
              className="rounded-xl py-2.5 text-xs font-semibold transition-all"
              style={{
                background: (opts.rapMode ?? false) === m.value ? 'rgba(234,179,8,0.18)' : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: (opts.rapMode ?? false) === m.value ? '#eab308' : 'rgba(255,255,255,0.1)',
                color: (opts.rapMode ?? false) === m.value ? '#eab308' : 'rgba(255,255,255,0.5)',
              }}
            >
              <div>{m.label}</div>
              <div className="text-[10px] font-normal mt-0.5 opacity-70">{m.sub}</div>
            </button>
          ))}
        </div>
        {(opts.rapMode ?? false) && (
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            AI 将根据内容生成押韵中文 RAP 歌词，配图为嘻哈街头风格
          </p>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <Row>
        <Label>免责声明文字（顶部）</Label>
        <input
          type="text"
          value={opts.disclaimer}
          onChange={e => u({ disclaimer: e.target.value })}
          placeholder="仅代表个人观点，无任何不良导向"
          className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/25 outline-none transition-all"
          style={inputStyle}
          onFocus={inputFocus} onBlur={inputBlur}
        />
      </Row>

      {/* ── Font size + slide duration ── */}
      <NumericSlider label="字幕字号" value={opts.subtitleFontSize} min={48} max={100}
        onChange={v => u({ subtitleFontSize: v })} />
      <NumericSlider label="每段停留时间" value={opts.slideDurationMs / 1000} min={2} max={8}
        step={0.5} unit="s" onChange={v => u({ slideDurationMs: Math.round(v * 1000) })} />

      {/* ── Image style selector for character-based manga ── */}
      <Row>
        <Label>图片风格</Label>
        <div className="flex gap-1.5">
          {([
            { val: 'default' as const, label: '🎨 漫画' },
            { val: 'cat3d' as const, label: '🐱 猫咪' },
            { val: 'zen' as const, label: '🧘 禅师' },
            { val: 'elite' as const, label: '💼 精英' },
          ]).map(m => (
            <button key={m.val}
              onClick={() => u({ imageStyle: m.val })}
              className="px-2 py-1 rounded-lg text-[10px] transition-all"
              style={{
                background: (opts.imageStyle ?? 'default') === m.val ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${(opts.imageStyle ?? 'default') === m.val ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                color: (opts.imageStyle ?? 'default') === m.val ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              }}
            >{m.label}</button>
          ))}
        </div>
      </Row>

      {/* ── RAP mode: Suno music info / TTS toggle ── */}
      {(opts.rapMode ?? false) ? (
        <Row>
          <div className="rounded-xl px-3 py-3 space-y-1.5"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <div className="flex items-center gap-2">
              <Label style={{ color: '#eab308' }}>Suno RAP 音乐</Label>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              AI 生成 RAP 歌词后，自动调用 Suno 生成说唱背景音乐（1-3分钟），作为视频的背景音乐轨道。无需配置，点击「AI 生成漫画视频」自动触发。
            </p>
          </div>
        </Row>
      ) : (
        /* ── TTS toggle ── */
        <Row>
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => u({ ttsEnabled: !opts.ttsEnabled })}
          >
          <div className="flex items-center gap-2">
            {opts.ttsEnabled
              ? <Mic size={13} style={{ color: '#a855f7' }} />
              : <MicOff size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
            <Label>{(opts.rapMode ?? false) ? 'RAP 朗读配音' : '配音朗读'}</Label>
          </div>
          <div
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: opts.ttsEnabled ? '#a855f7' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: opts.ttsEnabled ? '1.25rem' : '0.125rem' }}
            />
          </div>
        </div>

        {opts.ttsEnabled && (
          <div className="mt-3 space-y-3">

            {/* ── Bailian API Key ── */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <KeyRound size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  阿里百炼 API Key（不提交代码，仅存本地）
                </span>
              </div>
              <input
                type="password"
                value={bailianKey}
                onChange={e => handleKeyChange(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                autoComplete="off"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none transition-all font-mono"
                style={inputStyle}
                onFocus={inputFocus} onBlur={inputBlur}
              />
              {!bailianKey && (
                <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,200,100,0.5)' }}>
                  未配置时将使用免费备用语音（Google TTS）
                </p>
              )}
            </div>

            {/* ── Preset voice list ── */}
            <div>
              <p className="mb-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                预设音色 · 点击
                <span className="inline-flex items-center mx-1 px-1 py-0.5 rounded"
                  style={{ background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>
                  <Play size={8} className="mr-0.5" />试听
                </span>
                {bailianKey ? '可播放真实百炼语音' : '（配置 API Key 后可试听真实音色）'}
              </p>
              <div className="flex flex-col gap-1.5">
                {TTS_VOICES.map(v => {
                  const isSelected = effectiveVoice === v.id && !opts.ttsCustomVoice?.trim();
                  const isPlaying  = previewingVoice === v.id;
                  const isLoading  = loadingVoice === v.id;
                  return (
                    <div key={v.id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => u({ ttsVoice: v.id, ttsCustomVoice: '' })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all"
                        style={{
                          background: isSelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isSelected ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          color: isSelected ? '#d8b4fe' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {v.label}
                      </button>
                      <button
                        onClick={() => previewVoice(v.id)}
                        disabled={isLoading}
                        title={isPlaying ? '停止试听' : isLoading ? '加载中…' : '试听音色'}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: (isPlaying || isLoading)
                            ? 'rgba(168,85,247,0.35)'
                            : 'rgba(255,255,255,0.07)',
                          border: `1px solid ${(isPlaying || isLoading) ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          opacity: isLoading ? 0.8 : 1,
                        }}
                      >
                        {isLoading ? (
                          <Loader2 size={10} className="animate-spin" style={{ color: '#d8b4fe' }} />
                        ) : isPlaying ? (
                          <Square size={10} style={{ color: '#d8b4fe' }} />
                        ) : (
                          <Play size={10} style={{ color: 'rgba(255,255,255,0.45)' }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              {previewError && (
                <p className="mt-1 text-[10px] text-red-400">{previewError}</p>
              )}
            </div>

            {/* ── Custom voice ID ── */}
            <div>
              <p className="mb-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                自定义音色 ID（非空时覆盖上方选择）
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={opts.ttsCustomVoice ?? ''}
                  onChange={e => u({ ttsCustomVoice: e.target.value })}
                  placeholder="例如 longxiaobai、longtong …"
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none transition-all font-mono"
                  style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
                {opts.ttsCustomVoice?.trim() && (
                  <button
                    onClick={() => previewVoice(opts.ttsCustomVoice!.trim())}
                    disabled={loadingVoice === opts.ttsCustomVoice?.trim()}
                    title="试听自定义音色"
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{
                      background: (previewingVoice === opts.ttsCustomVoice?.trim() || loadingVoice === opts.ttsCustomVoice?.trim())
                        ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${(previewingVoice === opts.ttsCustomVoice?.trim() || loadingVoice === opts.ttsCustomVoice?.trim()) ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {loadingVoice === opts.ttsCustomVoice?.trim() ? (
                      <Loader2 size={10} className="animate-spin" style={{ color: '#d8b4fe' }} />
                    ) : previewingVoice === opts.ttsCustomVoice?.trim() ? (
                      <Square size={10} style={{ color: '#d8b4fe' }} />
                    ) : (
                      <Play size={10} style={{ color: 'rgba(255,255,255,0.45)' }} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Speech rate ── */}
            <NumericSlider
              label="语速"
              value={opts.ttsRate ?? 1.0}
              min={0.5}
              max={2.0}
              step={0.1}
              unit="x"
              onChange={v => u({ ttsRate: v })}
            />

            {/* ── Volume ── */}
            <NumericSlider
              label="音量"
              value={opts.ttsVolume ?? 80}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={v => u({ ttsVolume: v })}
            />

          </div>
        )}
      </Row>
      )}
    </div>
  );
}

function TranslationPanel({ accentColor, onAccentColorChange }: {
  accentColor: string; onAccentColorChange: (c: string) => void;
}) {
  return (
    <div className="space-y-4">
      <ColorPicker label="高亮色（收到扣1）" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />
      <div className="text-[10px] px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
        高亮色用于"收到，扣1"互动文字和卡片装饰线
      </div>
    </div>
  );
}

// ─── AI Goblin Panel ──────────────────────────────────────────────────────────
function AIGoblinPanel({
  options, onChange, accentColor, onAccentColorChange,
}: {
  options: AIGoblinOptions;
  onChange: (v: AIGoblinOptions) => void;
  accentColor: string;
  onAccentColorChange: (c: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Row>
        <Label>角色图片 URL</Label>
        <input
          type="text"
          value={options.characterImageUrl}
          onChange={e => onChange({ ...options, characterImageUrl: e.target.value })}
          placeholder="https://example.com/goblin.png"
          className="w-full rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
        />
        <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          留空则使用暗黑剪影占位
        </div>
      </Row>

      <Row>
        <Label>标题</Label>
        <input
          type="text"
          value={options.titleText}
          onChange={e => onChange({ ...options, titleText: e.target.value })}
          placeholder="视频标题"
          className="w-full rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
        />
      </Row>

      <Row>
        <Label>标签（逗号分隔）</Label>
        <input
          type="text"
          value={options.tags.join(', ')}
          onChange={e => onChange({ ...options, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="认知, 成长, 人生"
          className="w-full rounded-lg px-3 py-2 text-xs"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
        />
      </Row>

      <ColorPicker label="主色调" value={accentColor} onChange={onAccentColorChange} accent={accentColor} />

      <Row>
        <Label>背景色（上）</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={options.bgColor1}
            onChange={e => onChange({ ...options, bgColor1: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={options.bgColor1}
            onChange={e => onChange({ ...options, bgColor1: e.target.value })}
            className="flex-1 rounded-lg px-3 py-2 text-xs font-mono"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
        </div>
      </Row>

      <Row>
        <Label>背景色（下）</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={options.bgColor2}
            onChange={e => onChange({ ...options, bgColor2: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={options.bgColor2}
            onChange={e => onChange({ ...options, bgColor2: e.target.value })}
            className="flex-1 rounded-lg px-3 py-2 text-xs font-mono"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
        </div>
      </Row>

      <Row>
        <Label>字号</Label>
        <div className="flex gap-1.5">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <button
              key={size}
              onClick={() => onChange({ ...options, fontSize: size })}
              className="flex-1 rounded-lg py-2 text-xs font-medium transition-all"
              style={{
                background: options.fontSize === size ? `${accentColor}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${options.fontSize === size ? accentColor : 'rgba(255,255,255,0.06)'}`,
                color: options.fontSize === size ? accentColor : 'rgba(255,255,255,0.4)',
              }}
            >
              {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
            </button>
          ))}
        </div>
      </Row>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function StyleConfigPanel({
  style, accent,
  coverIndex, onCoverIndexChange,
  chineseOptions, onChineseOptionsChange,
  aiOptions, onAiOptionsChange,
  aitechOptions, onAitechOptionsChange,
  subtitleOptions, onSubtitleOptionsChange,
  cityOptions, onCityOptionsChange,
  mangaOptions, onMangaOptionsChange,
  accentOverrides, onAccentOverrideChange,
  petCoverConfig, onPetCoverConfigChange, titleForPetCover,
  natureOptions, onNatureOptionsChange,
  titleOptions, onTitleOptionsChange,
  keywordOptions, onKeywordOptionsChange,
  aigoblinOptions, onAigoblinOptionsChange,
}: Props) {
  const ov = accentOverrides[style];

  switch (style) {
    case 'warning':
      return (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.36)' }}>
          该风格已按案例锁定暗金视觉、警示型文案层级和逐条节奏，无需额外配置。
        </p>
      );

    case 'chinese':
      return (
        <div className="space-y-6">
          <TitlePanel opts={titleOptions} onChange={onTitleOptionsChange} accent={accent} />
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <ChinesePanel
            options={chineseOptions}
            onChange={onChineseOptionsChange}
            accent={accent}
            coverIndex={coverIndex}
            onCoverIndexChange={onCoverIndexChange}
            style={style}
            petCoverConfig={petCoverConfig}
            onPetCoverConfigChange={onPetCoverConfigChange}
            titleForPetCover={titleForPetCover}
          />
        </div>
      );

    case 'city':
    case 'semantic':
      return (
        <div className="space-y-6">
          <TitlePanel opts={titleOptions} onChange={onTitleOptionsChange} accent={accent} />
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <CityPanel
            coverIndex={coverIndex}
            onCoverIndexChange={onCoverIndexChange}
            accentColor={ov ?? (style === 'semantic' ? '#f4cc63' : '#ff8c00')}
            onAccentColorChange={c => onAccentOverrideChange(style, c)}
            style={style}
            cityOptions={cityOptions}
            onCityOptionsChange={onCityOptionsChange}
            petCoverConfig={petCoverConfig}
            onPetCoverConfigChange={onPetCoverConfigChange}
            titleForPetCover={titleForPetCover}
          />
        </div>
      );

    case 'aitech':
      return (
        <div className="space-y-6">
          <TitlePanel opts={titleOptions} onChange={onTitleOptionsChange} accent={accent} />
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <AItechPanel
            coverIndex={coverIndex}
            onCoverIndexChange={onCoverIndexChange}
            aitechOptions={aitechOptions}
            onAitechOptionsChange={(opts) => {
              onAiOptionsChange({ ...aiOptions, polyShape: opts.polyShape });
              onAitechOptionsChange(opts);
            }}
            accentColor={accentOverrides['aitech'] ?? '#a855f7'}
            onAccentColorChange={c => onAccentOverrideChange('aitech', c)}
            style={style}
            petCoverConfig={petCoverConfig}
            onPetCoverConfigChange={onPetCoverConfigChange}
            titleForPetCover={titleForPetCover}
          />
        </div>
      );

    case 'nature':
      return (
        <div className="space-y-6">
          <TitlePanel opts={titleOptions} onChange={onTitleOptionsChange} accent={accent} />
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <NaturePanel
            coverIndex={coverIndex}
            onCoverIndexChange={onCoverIndexChange}
            accentColor={ov ?? '#4ade80'}
            onAccentColorChange={c => onAccentOverrideChange('nature', c)}
            style={style}
            petCoverConfig={petCoverConfig}
            onPetCoverConfigChange={onPetCoverConfigChange}
            titleForPetCover={titleForPetCover}
            natureOptions={natureOptions}
            onNatureOptionsChange={onNatureOptionsChange}
          />
        </div>
      );

    case 'subtitle':
      return (
        <SubtitlePanel
          opts={subtitleOptions}
          onChange={onSubtitleOptionsChange}
          accentColor={subtitleOptions.accentColor}
          onAccentColorChange={c => onAccentOverrideChange('subtitle', c)}
        />
      );

    case 'translation':
      return (
        <TranslationPanel
          accentColor={ov ?? '#ffe44d'}
          onAccentColorChange={c => onAccentOverrideChange('translation', c)}
        />
      );

    case 'manga':
    case 'cat3d':
    case 'zen':
    case 'elite':
      return <MangaPanel opts={mangaOptions} onChange={onMangaOptionsChange} />;

    case 'keyword': {
      const accentColor = ov ?? '#00d4ff';
      return (
        <KeywordPanel
          keywordOptions={keywordOptions}
          onKeywordOptionsChange={onKeywordOptionsChange}
          accentColor={accentColor}
          onAccentColorChange={c => onAccentOverrideChange('keyword', c)}
        />
      );
    }

    case 'aigoblin': {
      const gobAccent = ov ?? '#f59e0b';
      return (
        <AIGoblinPanel
          options={aigoblinOptions}
          onChange={onAigoblinOptionsChange}
          accentColor={gobAccent}
          onAccentColorChange={c => onAccentOverrideChange('aigoblin', c)}
        />
      );
    }

    default:
      return null;
  }
}
