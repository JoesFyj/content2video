import { useState, useEffect, type ReactNode } from 'react';
import { ArrowLeft, Film, Key, Video, Sparkles, Settings2, UserRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type {
  StyleType, ChineseOptions, AIOptions, NatureContent, GeneratedContent,
  SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions, NatureOptions,
  TitleOptions, KeywordOptions, AIGoblinOptions,
} from '../types/video';
import {
  DEFAULT_SUBTITLE_OPTIONS, DEFAULT_CITY_OPTIONS, DEFAULT_MANGA_OPTIONS, DEFAULT_AITECH_OPTIONS,
  DEFAULT_PET_COVER_CONFIG, DEFAULT_NATURE_OPTIONS, DEFAULT_TITLE_OPTIONS, DEFAULT_KEYWORD_OPTIONS,
  DEFAULT_AIGOBLIN_OPTIONS, type PetCoverConfig,
} from '../types/video';
import StyleSelector from '../components/StyleSelector';
import ContentForm from '../components/ContentForm';
import ContentEditor from '../components/ContentEditor';
import MangaContentEditor from '../components/MangaContentEditor';
import MangaGenerationProgress from '../components/MangaGenerationProgress';
import StyleConfigPanel from '../components/StyleConfigPanel';
import { buildCharacterImagePrompt } from '../lib/engine/characterPrompts';
import VideoGenerator from '../components/VideoGenerator';
import ApiKeyDialog from '../components/ApiKeyDialog';
import StudioCanvas from '../components/StudioCanvas';
import { validateKnowledgeContent } from '../lib/knowledgeQuality';
import {
  extractContent, extractWarningContent, extractNatureContent, translateSentence, getStoredApiKey, extractKeywords,
} from '../services/deepseek';
import {
  generateMangaContent, type GenerationProgress,
} from '../services/mangaGenerator';
import { generateArkImage } from '../services/ark';
import { useCommerce } from '../contexts/commerce-context';

// ─── Subtitle parser ───────────────────────────────────────────────────────
function parseSubtitleContent(text: string): GeneratedContent {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const groups: string[][] = [];
  let current: string[] = [];
  for (const line of rawLines) {
    if (/^\d{1,2}[.、）)]\s*/.test(line)) {
      if (current.length > 0) groups.push(current);
      const content = line.replace(/^\d{1,2}[.、）)]\s*/, '').trim();
      current = content ? [content] : [];
    } else current.push(line);
  }
  if (current.length > 0) groups.push(current);
  if (groups.length === 0) {
    const sentences: string[] = [];
    for (const line of rawLines) {
      const parts = line.split(/((?:[。！？!?]+))/);
      for (let j = 0; j < parts.length; j += 2) {
        const sentence = (parts[j] + (parts[j + 1] ?? '')).trim();
        if (sentence) sentences.push(sentence);
      }
    }
    const items = sentences.length > 0 ? sentences : rawLines;
    for (const item of items) groups.push([item]);
  }
  return {
    title: '字幕视频',
    points: groups.map((lines, i) => ({
      label: `${i + 1}`, short: '', desc: lines.join('\n'), formatted: lines.join(' '),
    })),
  };
}

function parseRawContent(text: string): GeneratedContent {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let title = '内容';
  let startIdx = 0;
  if (rawLines.length > 0 && !/^\d{1,2}[.、）)]\s*/.test(rawLines[0])) {
    title = rawLines[0];
    startIdx = 1;
  }
  const groups: { label: string; rest: string[] }[] = [];
  let curLabel = '';
  let curRest: string[] = [];
  for (let i = startIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    const m = line.match(/^\d{1,2}[.、）)]\s*(.*)/);
    if (m) {
      if (curLabel) groups.push({ label: curLabel, rest: curRest });
      curLabel = m[1].trim();
      curRest = [];
    } else if (curLabel) curRest.push(line);
  }
  if (curLabel) groups.push({ label: curLabel, rest: curRest });
  if (groups.length === 0) {
    return {
      title,
      points: rawLines.slice(startIdx).map(line => ({
        label: line.slice(0, 20), short: line.slice(20, 50), desc: line, formatted: line,
      })),
    };
  }
  return {
    title,
    points: groups.map(g => ({
      label: g.label, short: g.rest[0] ?? '',
      desc: g.rest.slice(1).join('\n') || g.rest[0] || '',
      formatted: [g.label, ...g.rest].join(' '),
    })),
  };
}

function ensureKnowledgeLimit(result: GeneratedContent): GeneratedContent {
  if (result.points.length > 16) {
    throw new Error(`当前最多支持 16 组内容，本次识别到 ${result.points.length} 组。请拆分为上下集后再生成。`);
  }
  return result;
}

// ─── Claude-style color palette ──────────────────────────────────────────────
const CLAUDE_BG = '#081A2F';
const CLAUDE_SURFACE = '#081A2F';
const CLAUDE_BORDER = 'rgba(255,255,255,0.06)';
const CLAUDE_ACCENT = '#d97706';

const BG_BY_STYLE: Record<StyleType, string> = {
  chinese:     CLAUDE_BG,
  city:        CLAUDE_BG,
  semantic:    CLAUDE_BG,
  warning:     CLAUDE_BG,
  aitech:      CLAUDE_BG,
  nature:      CLAUDE_BG,
  subtitle:    CLAUDE_BG,
  translation: CLAUDE_BG,
  manga:       CLAUDE_BG,
  keyword:     CLAUDE_BG,
  cat3d:       CLAUDE_BG,
  zen:         CLAUDE_BG,
  elite:       CLAUDE_BG,
  aigoblin:    CLAUDE_BG,
};

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
  keyword:     '#00d4ff',
  cat3d:       '#60a5fa',
  zen:         '#fbbf24',
  elite:       '#818cf8',
  aigoblin:    '#f59e0b',
};

const MANGA_DUMMY_CONTENT: GeneratedContent = { title: '', points: [] };
const MANGA_STORAGE_KEY = 'vreel_manga_content_v1';

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPaidAccess, openAuth } = useCommerce();
  const initialStyle = searchParams.get('style');
  const [style, setStyle] = useState<StyleType>(initialStyle === 'semantic' || initialStyle === 'warning' ? initialStyle : 'city');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [natureContent, setNatureContent] = useState<NatureContent | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [mangaContent, setMangaContent] = useState<MangaContent | null>(null);
  const [mangaProgress, setMangaProgress] = useState<GenerationProgress | null>(null);
  const [mangaOptions, setMangaOptions] = useState<MangaOptions>(DEFAULT_MANGA_OPTIONS);
  const [mangaRegeneratingIndexes, setMangaRegeneratingIndexes] = useState<Set<number>>(new Set());

  const [coverIndex, setCoverIndex] = useState(0);
  const [chineseOptions, setChineseOptions] = useState<ChineseOptions>({
    colorScheme: 'cinnabar', borderWidth: 2, lineWidth: 2, animMode: 'single',
  });
  const [aiOptions, setAiOptions] = useState<AIOptions>({ polyShape: 'hexagon' });
  const [aitechOptions, setAitechOptions] = useState<AItechOptions>(DEFAULT_AITECH_OPTIONS);
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOptions>(DEFAULT_SUBTITLE_OPTIONS);
  const [cityOptions, setCityOptions] = useState<CityOptions>(() => {
    try {
      const saved = localStorage.getItem('content-video-city-options');
      return saved ? { ...DEFAULT_CITY_OPTIONS, ...JSON.parse(saved) } : DEFAULT_CITY_OPTIONS;
    } catch { return DEFAULT_CITY_OPTIONS; }
  });
  const [natureOptions, setNatureOptions] = useState<NatureOptions>(DEFAULT_NATURE_OPTIONS);
  const [titleOptions, setTitleOptions] = useState<TitleOptions>(DEFAULT_TITLE_OPTIONS);
  const [keywordOptions, setKeywordOptions] = useState<KeywordOptions>(DEFAULT_KEYWORD_OPTIONS);
  const [aigoblinOptions, setAigoblinOptions] = useState<AIGoblinOptions>(DEFAULT_AIGOBLIN_OPTIONS);
  const [accentOverrides, setAccentOverrides] = useState<Partial<Record<StyleType, string>>>({});
  const [petCoverConfig, setPetCoverConfig] = useState<PetCoverConfig>(DEFAULT_PET_COVER_CONFIG);

  const accent = style === 'subtitle'
    ? subtitleOptions.accentColor
    : (accentOverrides[style] ?? ACCENT_BY_STYLE[style]);

  useEffect(() => {
    try {
      if (mangaContent) localStorage.setItem(MANGA_STORAGE_KEY, JSON.stringify(mangaContent));
      else localStorage.removeItem(MANGA_STORAGE_KEY);
    } catch { /* ignore */ }
  }, [mangaContent]);

  useEffect(() => {
    try { localStorage.setItem('content-video-city-options', JSON.stringify(cityOptions)); } catch { /* ignore */ }
  }, [cityOptions]);

  const handleStyleChange = (s: StyleType) => {
    setStyle(s);
    setContent(null);
    setNatureContent(null);
    setMangaContent(null);
    setMangaProgress(null);
    setError('');
    setCoverIndex(0);
    // Set manga sub-style for character styles
    if (s === 'cat3d') setMangaOptions(prev => ({ ...prev, imageStyle: 'cat3d' }));
    else if (s === 'zen') setMangaOptions(prev => ({ ...prev, imageStyle: 'zen' }));
    else if (s === 'elite') setMangaOptions(prev => ({ ...prev, imageStyle: 'elite' }));
    else if (s === 'manga') setMangaOptions(prev => ({ ...prev, imageStyle: 'default' }));
    else if (s === 'aigoblin') setAigoblinOptions(DEFAULT_AIGOBLIN_OPTIONS);
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async (text: string, rawMode = false) => {
    setError('');
    setIsLoading(true);
    if (style === 'city' || style === 'semantic') {
      setCityOptions(prev => ({ ...prev, animationSeed: (prev.animationSeed ?? 1) + 1 }));
    }
    try {
      if (style === 'subtitle') {
        const result = parseSubtitleContent(text);
        setContent(result);
        setNatureContent(null);
        setSubtitleOptions(prev => ({
          ...prev,
          customLines: result.points.map(pt => (pt.desc ?? pt.short ?? pt.label ?? '').replace(/\n/g, ' ').trim()),
        }));
      } else if (style === 'aigoblin') {
        const result = parseRawContent(text);
        setContent(result);
        setNatureContent(null);
        setAigoblinOptions(prev => ({
          ...prev,
          titleText: result.title ?? '',
          subtitleText: result.points[0]?.label ?? '',
          tags: result.points.map(p => p.label),
        }));
      } else if (style === 'translation') {
        const englishText = await translateSentence(text.trim());
        setContent({ title: text.trim(), points: [{ label: '', short: '', desc: englishText, formatted: text.trim() }] });
        setNatureContent(null);
      } else if (style === 'nature') {
        const nc = await extractNatureContent(text);
        setNatureContent(nc);
        setContent({ title: nc.title, points: [] });
      } else if (style === 'keyword') {
        const result = rawMode ? parseRawContent(text) : await extractKeywords(text);
        setContent(result);
        setNatureContent(null);
      } else if (style === 'warning') {
        const result = rawMode ? parseRawContent(text) : await extractWarningContent(text);
        setContent(ensureKnowledgeLimit(result));
        setNatureContent(null);
      } else if (rawMode) {
        setContent(ensureKnowledgeLimit(parseRawContent(text)));
        setNatureContent(null);
      } else {
        setContent(ensureKnowledgeLimit(await extractContent(text)));
        setNatureContent(null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      if (msg === 'NO_API_KEY') setApiKeyOpen(true);
      else if (msg === 'NO_ARK_KEY') setApiKeyOpen(true);
      else setError(msg);
    } finally { setIsLoading(false); }
  };

  const handleGenerateManga = async (text: string, _rawMode?: boolean) => {
    if (!text.trim()) return;
    setError('');
    setMangaContent(null);
    setMangaProgress({ phase: 'script', total: 0, done: 0, segments: [] });
    setIsLoading(true);
    try {
      const result = await generateMangaContent(text, (p) => setMangaProgress(p),
        { disclaimer: mangaOptions.disclaimer, rapMode: mangaOptions.rapMode ?? false, imageStyle: mangaOptions.imageStyle });
      setMangaContent(result);
      setMangaProgress(null);
      setContent(MANGA_DUMMY_CONTENT);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      if (msg === 'NO_API_KEY') setApiKeyOpen(true);
      else if (msg === 'NO_ARK_KEY') setApiKeyOpen(true);
      else setError(msg);
      setMangaProgress(null);
    } finally { setIsLoading(false); }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!mangaContent) return;
    const seg = mangaContent.segments[index];
    if (!seg) return;
    setMangaRegeneratingIndexes(prev => new Set(prev).add(index));
    try {
      const prompt = mangaOptions.imageStyle && mangaOptions.imageStyle !== 'default'
        ? buildCharacterImagePrompt(seg.scene, mangaOptions.imageStyle)
        : seg.scene;
      const url = await generateArkImage(prompt);
      setMangaContent(prev => {
        if (!prev) return prev;
        return { ...prev, segments: prev.segments.map((s, i2) => i2 === index ? { ...s, imageUrl: url } : s) };
      });
      setContent(c => c ? { ...c } : MANGA_DUMMY_CONTENT);
    } catch (e) { console.error('Regen failed:', e); }
    finally { setMangaRegeneratingIndexes(prev => { const next = new Set(prev); next.delete(index); return next; }); }
  };

  const handleManual = () => {
    setContent({
      title: '', audience: 'beginner', actionPrompt: '收藏这套方法',
      points: [{ label: '', short: '', desc: '', formatted: '', sceneType: 'workflow', source: '', verifiedAt: '' }],
    });
    setNatureContent(null);
    setError('');
  };

  const handleContentChange = (c: GeneratedContent) => setContent(c);
  const handleMangaContentChange = (mc: MangaContent) => {
    setMangaContent(mc);
    setContent(c => c ? { ...c } : MANGA_DUMMY_CONTENT);
  };

  const isManga = style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite';
  const isGoblin = style === 'aigoblin';
  const canvasContent = isManga ? (mangaContent ? MANGA_DUMMY_CONTENT : null) : content;
  const hasRecordableContent = isManga ? !!mangaContent : (isGoblin ? !!content : !!content);
  const qualityIssues = (style === 'city' || style === 'semantic' || style === 'warning') && content ? validateKnowledgeContent(content) : [];
  const canExport = hasRecordableContent;

  const requestExport = () => {
    if (!user) {
      openAuth();
      return;
    }
    if (!hasPaidAccess) {
      navigate('/pricing');
      return;
    }
    if (canExport) setShowRecorder(true);
  };

  // ─── Claude-style Layout ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden" style={{ background: CLAUDE_BG }}>
      {/* ── Minimal Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex flex-shrink-0 items-center justify-between px-4 py-3 md:px-6"
        style={{ borderBottom: `1px solid ${CLAUDE_BORDER}`, background: CLAUDE_BG }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5" aria-label="返回首页"><ArrowLeft size={16} className="text-white/60" /></Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
            <Film size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight">内容转视频</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all duration-200"
            style={{ border: `1px solid ${CLAUDE_BORDER}`, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.02)' }}>
            <UserRound size={14} /><span className="hidden sm:inline">账户</span>
          </Link>
          <button onClick={requestExport} disabled={!canExport}
            title={!hasRecordableContent ? '请先生成或填写内容' : '导出视频'}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: canExport ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.08)', color: canExport ? '#fff' : 'rgba(255,255,255,0.32)', boxShadow: canExport ? '0 2px 16px rgba(217,119,6,0.3)' : 'none', cursor: canExport ? 'pointer' : 'not-allowed' }}>
            <Video size={16} /><span className="hidden sm:inline">导出视频</span><span className="sm:hidden">导出</span>
          </button>
          <button onClick={() => setApiKeyOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all duration-200"
            style={{ border: `1px solid ${CLAUDE_BORDER}`, color: getStoredApiKey() ? '#f59e0b' : 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)' }}>
            <Key size={14} />
            <span className="hidden sm:inline">{getStoredApiKey() ? 'API 已配置' : '设置 API'}</span>
          </button>
        </div>
      </header>

      {/* ── Body: Two-column ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-visible md:flex-row md:overflow-hidden">
        {/* LEFT: Controls */}
        <aside className="w-full flex-shrink-0 border-b border-r md:w-[380px] md:overflow-y-auto md:border-b-0 custom-scroll"
          style={{ borderColor: CLAUDE_BORDER, background: CLAUDE_SURFACE }}>
          <div className="space-y-5 p-4 md:p-5">
            {/* Style Selector */}
            <section>
              <Label>选择风格</Label>
              <StyleSelector selected={style} onChange={handleStyleChange} compact />
            </section>

            {/* Config Toggle */}
            <button onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs transition-colors"
              style={{ border: `1px solid ${CLAUDE_BORDER}`, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)' }}>
              <Settings2 size={14} />
              风格配置
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(217,119,6,0.12)', color: '#f59e0b' }}>
                {showConfig ? '收起' : '展开'}
              </span>
            </button>

            {showConfig && (
              <section className="animate-fade-in">
                <StyleConfigPanel
                  style={style} accent={accent} coverIndex={coverIndex}
                  onCoverIndexChange={setCoverIndex}
                  chineseOptions={chineseOptions} onChineseOptionsChange={setChineseOptions}
                  aiOptions={aiOptions} onAiOptionsChange={setAiOptions}
                  aitechOptions={aitechOptions} onAitechOptionsChange={setAitechOptions}
                  subtitleOptions={subtitleOptions} onSubtitleOptionsChange={setSubtitleOptions}
                  cityOptions={cityOptions} onCityOptionsChange={setCityOptions}
                  mangaOptions={mangaOptions} onMangaOptionsChange={setMangaOptions}
                  natureOptions={natureOptions} onNatureOptionsChange={setNatureOptions}
                  titleOptions={titleOptions} onTitleOptionsChange={setTitleOptions}
                  keywordOptions={keywordOptions} onKeywordOptionsChange={setKeywordOptions}
                  aigoblinOptions={aigoblinOptions} onAigoblinOptionsChange={setAigoblinOptions}
                  accentOverrides={accentOverrides}
                  onAccentOverrideChange={(sty, color) => setAccentOverrides(prev => ({ ...prev, [sty]: color }))}
                  petCoverConfig={petCoverConfig} onPetCoverConfigChange={setPetCoverConfig}
                  titleForPetCover={style === 'nature' ? (natureContent?.title ?? '') : (canvasContent?.title ?? '')}
                />
              </section>
            )}

            <Divider />

            {/* Content */}
            <section>
              <Label>
                内容
                {(content || mangaContent) && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(217,119,6,0.12)', color: '#f59e0b' }}>
                    {isManga ? `${mangaContent?.segments.length} 段` : '编辑中'}
                  </span>
                )}
              </Label>

              {isManga ? (
                mangaContent ? (
                  <MangaContentEditor content={mangaContent} onChange={handleMangaContentChange}
                    onReset={() => { setMangaContent(null); setMangaProgress(null); setContent(null); setError(''); }}
                    onRegenerateImage={handleRegenerateImage} regeneratingIndexes={mangaRegeneratingIndexes} />
                ) : mangaProgress ? (
                  <MangaGenerationProgress progress={mangaProgress} />
                ) : (
                  <ContentForm style={style} onGenerate={handleGenerateManga} isLoading={isLoading} error={error} />
                )
              ) : (
                content ? (
                  <ContentEditor content={content} style={style} onChange={handleContentChange}
                    onReset={() => { setContent(null); setNatureContent(null); setError(''); }} />
                ) : (
                  <ContentForm style={style} onGenerate={handleGenerate} isLoading={isLoading} error={error} onManual={handleManual} />
                )
              )}
              {qualityIssues.length > 0 && (
                <div className="mt-3 rounded-lg p-3 text-[11px] leading-relaxed"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.24)', color: '#f7c66b' }}>
                  <div className="font-semibold mb-1">内容优化建议 {qualityIssues.length} 项（不影响导出）</div>
                  {qualityIssues.slice(0, 3).map((issue, index) => <div key={`${issue.message}-${index}`}>· {issue.message}</div>)}
                  {qualityIssues.length > 3 && <div>· 另有 {qualityIssues.length - 3} 项</div>}
                </div>
              )}
            </section>
          </div>
        </aside>

        {/* RIGHT: Preview */}
        <main className="flex min-h-[400px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden p-4 md:min-h-0 md:p-8"
          style={{ background: CLAUDE_BG }}>
          {canvasContent ? (
            <div className="animate-fade-in-scale w-full max-w-[960px]">
              <StudioCanvas
                content={canvasContent} style={style} coverIndex={coverIndex}
                chineseOptions={chineseOptions} aiOptions={aiOptions}
                natureContent={natureContent} accent={accent}
                subtitleOptions={subtitleOptions} accentOverride={accentOverrides[style]}
                cityOptions={cityOptions} mangaContent={mangaContent ?? undefined}
                mangaOptions={mangaOptions} aitechOptions={aitechOptions}
                natureOptions={natureOptions} titleOptions={titleOptions}
                keywordOptions={keywordOptions} />
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: 'rgba(217,119,6,0.08)' }}>
                <Sparkles size={28} style={{ color: '#f59e0b' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                输入知识内容，生成动态讲解视频
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
                封面图案会根据知识主题自动匹配
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Recording Overlay ─────────────────────────────────────────────── */}
      {showRecorder && (
        <VideoGenerator
          content={canvasContent ?? MANGA_DUMMY_CONTENT} style={style}
          coverIndex={coverIndex} chineseOptions={chineseOptions} aiOptions={aiOptions}
          natureContent={natureContent} onClose={() => setShowRecorder(false)}
          subtitleOptions={subtitleOptions} accentOverride={accentOverrides[style]}
          cityOptions={cityOptions} mangaContent={mangaContent ?? undefined}
          mangaOptions={mangaOptions} aitechOptions={aitechOptions}
          petCoverConfig={petCoverConfig} natureOptions={natureOptions}
          titleOptions={titleOptions} keywordOptions={keywordOptions}
          aigoblinOptions={aigoblinOptions} />
      )}

      {/* ── API Key Dialog ────────────────────────────────────────────────── */}
      <ApiKeyDialog open={apiKeyOpen} onClose={() => setApiKeyOpen(false)} accent={accent} />
    </div>
  );
}

// ─── Micro Components ─────────────────────────────────────────────────────────
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wider uppercase mb-3"
      style={{ color: 'rgba(255,255,255,0.35)' }}>{children}</p>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />;
}
