export type StyleType = 'chinese' | 'city' | 'semantic' | 'warning' | 'aitech' | 'nature' | 'subtitle' | 'translation' | 'manga' | 'keyword' | 'cat3d' | 'zen' | 'elite' | 'aigoblin';
export type ColorScheme = 'ink' | 'cinnabar' | 'jade' | 'gold' | 'porcelain';
export type AnimMode = 'grid' | 'single';
export type PolyShape = 'triangle' | 'quad' | 'pentagon' | 'hexagon' | 'octagon' | 'star5' | 'decagon';

// ─── Chinese card line animation types ────────────────────────────────────────
export type ChineseLineEnterAnim =
  | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'zoomIn' | 'bounceIn' | 'rotateIn' | 'flipH' | 'typewriter'
  | 'glitch' | 'wave';

export type ChineseLineExitAnim =
  | 'fadeOut' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'zoomOut' | 'dissolve';

export interface ChineseCardLineConfig {
  field: 'label' | 'short' | 'desc' | 'static'; // content source
  staticText: string;                             // used when field='static'
  fontSize: number;
  fontFamily: string;           // '' = "Noto Sans SC"
  color: string;                // '' = auto from theme
  fontWeight: 400 | 600 | 800;
  enterAnim: ChineseLineEnterAnim;
  exitAnim: ChineseLineExitAnim;
}

export const DEFAULT_CARD_LINES: ChineseCardLineConfig[] = [
  { field: 'label', staticText: '', fontSize: 68, fontFamily: '', color: '', fontWeight: 800, enterAnim: 'slideLeft',  exitAnim: 'fadeOut' },
  { field: 'short', staticText: '', fontSize: 36, fontFamily: '', color: '', fontWeight: 600, enterAnim: 'slideUp',    exitAnim: 'fadeOut' },
  { field: 'desc',  staticText: '', fontSize: 32, fontFamily: '', color: '', fontWeight: 400, enterAnim: 'fadeIn',     exitAnim: 'dissolve' },
];

// ─── Existing ──────────────────────────────────────────────────────────────────
export interface AIOptions {
  polyShape: PolyShape;
}

export interface ChineseOptions {
  colorScheme: ColorScheme;
  borderWidth: 1 | 2 | 3 | 4;
  lineWidth: 1 | 2 | 3 | 4;
  animMode: AnimMode;
  titleEntranceAnim?: 'dropsFromSky' | 'typewriter';  // default 'dropsFromSky'
  // ── Card layout ────────────────────────────────────────────────────────────
  cardCols?: 1 | 2;     // default 2
  cardRows?: 1 | 2 | 3; // default 3
  // ── Per-line card text config (1-3 items) ──────────────────────────────────
  cardLines?: ChineseCardLineConfig[];
  // ── Legacy text style overrides (kept for backward compat) ────────────────
  titleFontSize?: number;    // default 68
  titleColor?: string;       // default '' = use accent
  shortFontSize?: number;    // default 36
  shortColor?: string;       // default '' = use accent2
  descFontSize?: number;     // default 32
  descColor?: string;        // default '' = rgba(255,255,255,0.92)
  // ── Optional background overrides ('' = use colorScheme defaults) ───────
  bgColor1?: string;
  bgColor2?: string;
}

// ─── Subtitle style options ────────────────────────────────────────────────────
export type SubtitleEnterAnim =
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'typewriter'
  | 'fadeIn';

export interface SubtitleHighlight {
  text: string;   // keyword to match (exact)
  color: string;  // highlight colour (hex)
}

export interface SubtitleOptions {
  titleText: string;           // account badge name (top-left)
  titleColor: string;          // hex — accent stripe + badge highlight
  accentColor: string;         // hex — even-line colour
  defaultTextColor: string;    // hex — odd-line colour (default #ffffff)
  fontSize: 'auto' | 'sm' | 'md' | 'lg';  // auto = adaptive, others set ceiling
  enterAnim: SubtitleEnterAnim;
  linesPerSlide: 1 | 2 | 3 | 4 | 5 | 6;  // max visual lines per page
  highlights: SubtitleHighlight[];         // keyword → colour overrides
  // New fields
  customLines?: string[];          // per-line text overrides (1 override per content point)
  lineSpacing?: number;            // extra px gap between lines (default 0)
  gradientText?: boolean;          // enable left→right gradient on each line
  gradientColorStart?: string;     // gradient start (empty = accentColor)
  gradientColorEnd?: string;       // gradient end   (empty = defaultTextColor)
}

export const DEFAULT_SUBTITLE_OPTIONS: SubtitleOptions = {
  titleText: '',
  titleColor: '#ffd700',
  accentColor: '#ffd700',
  defaultTextColor: '#ffffff',
  fontSize: 'auto',
  enterAnim: 'slideUp',
  linesPerSlide: 3,
  highlights: [],
  lineSpacing: 0,
  gradientText: false,
  gradientColorStart: '',
  gradientColorEnd: '',
};

// ─── City style options ────────────────────────────────────────────────────────
export interface CityOptions {
  accentColor: string;                     // warm highlight
  secondaryColor: string;                  // contrast (default red)
  animSpeed: 'slow' | 'normal' | 'fast';
  animationSeed?: number;                   // stable variation across preview/export
  // Text style overrides (optional — fall back to defaults when empty/undefined)
  labelFontSize?: number;   // panorama keyword, default 50
  labelColor?: string;      // panorama keyword, default white
  shortFontSize?: number;   // pyramid explanation, default 36
  shortColor?: string;      // pyramid explanation, default white
  descFontSize?: number;    // workflow step, default 36
  descColor?: string;       // workflow step, default white
  descFontFamily?: string;  // workflow step card font
  pyramidLabelFontSize?: number;
  pyramidLabelColor?: string;
  workflowLabelFontSize?: number;
  workflowLabelColor?: string;
  knowledgeMode?: 'ai';
  visualTheme?: AIKnowledgeTheme;
  animationIntensity?: 'calm' | 'balanced' | 'dynamic';
  accountName?: string;
  outroSlogan?: string;
}

export const DEFAULT_CITY_OPTIONS: CityOptions = {
  accentColor: '#ff8800',
  secondaryColor: '#e52222',
  animSpeed: 'normal',
  animationSeed: 1,
  knowledgeMode: 'ai',
  visualTheme: 'deep-tech',
  animationIntensity: 'balanced',
  accountName: '思享稼',
  outroSlogan: '生活新方案，就找AIfman.',
};

// ─── AI Tech style options ─────────────────────────────────────────────────────
export interface PetCoverConfig {
  enabled: boolean;
  position: 'bottom' | 'center' | 'full';
  imageUrl: string;
}

export const DEFAULT_PET_COVER_CONFIG: PetCoverConfig = {
  enabled: false,
  position: 'bottom',
  imageUrl: '',
};

// ─── AI Tech style options ─────────────────────────────────────────────────────
export interface AItechOptions {
  polyShape: PolyShape;
  accentColor: string;
  glowIntensity: 'off' | 'subtle' | 'normal' | 'strong';
  // ── Phase 1: center pattern ───────────────────────────────────────────────
  centerPattern?: 'random' | 'arc' | 'rings' | 'spiral' | 'neuron' | 'dna' | 'atom' | 'compass' | 'radar' | 'hexgrid' | 'sunburst' | 'vortex' | 'crystal' | 'eye' | 'infinity';
  // ── Phase 1: radial text labels ──────────────────────────────────────────
  radialFontSize?: number;        // default 52
  radialColor?: string;           // '' = '#ffffff'
  radialNumberColor?: string;     // '' = accent
  radialShortFontSize?: number;   // default 34
  radialShortColor?: string;      // '' = 'rgba(200,220,255,0.85)'
  // ── Phase 2→3 burst transition ───────────────────────────────────────────
  burstTransition?: 'shatter' | 'flash' | 'wipe'; // default 'shatter'
  // ── Phase 3: keyword box ──────────────────────────────────────────────────
  kwBoxFontSize?: number;         // default 62 — "01关键词" in left box
  kwBoxColor?: string;            // '' = '#ffffff'
  kwBoxBorderColor?: string;      // '' = accent
  kwBoxBorderWidth?: number;      // default 3
  kwBoxBorderRadius?: number;     // default 16
  kwBoxBgAlpha?: number;          // 0 = transparent, default 0
  // ── Phase 3: description text ────────────────────────────────────────────
  descFontSize?: number;          // default 42
  descColor?: string;             // '' = 'rgba(220,220,220,0.92)'
  descEnterEffect?: 'typewriter' | 'fadeIn' | 'slideRight'; // default 'typewriter'
  // ── Phase 4: grid ────────────────────────────────────────────────────────
  gridCellEnterEffect?: 'zoomIn' | 'flipIn' | 'slideUp' | 'fadeIn'; // default 'zoomIn'
  gridExplosionStyle?: 'burst' | 'scatter' | 'implode'; // default 'burst'
  gridKeywordFontSize?: number;   // default 72
  gridShortFontSize?: number;     // default 38
  gridKeywordColor?: string;      // '' = '#ffffff'
  gridShortColor?: string;        // '' = 'rgba(200,200,200,0.9)'
  gridBorderColor?: string;       // '' = accent
  gridNumColor?: string;          // '' = accent
}

export const DEFAULT_AITECH_OPTIONS: AItechOptions = {
  polyShape: 'hexagon',
  accentColor: '#a855f7',
  glowIntensity: 'normal',
};

// ─── Nature style options ──────────────────────────────────────────────────────
export interface NatureOptions {
  accentColor: string;
  particleStyle: 'default' | 'snow' | 'rain' | 'petals';
  // ── Text overrides ────────────────────────────────────────────────────────
  titleFontSize?: number;   // default 68
  titleColor?: string;      // '' = '#fff'
  wordFontSize?: number;    // default 46 (base; shorter words scale up)
  fontFamily?: string;      // '' = "Noto Sans SC"
  // ── Color overrides ('' = auto from built-in contrast palette) ───────────
  leftColor?: string;       // left circle + left words
  rightColor?: string;      // right circle + right words
  // ── Circle ring ──────────────────────────────────────────────────────────
  borderWidth?: number;     // default 2.5
}

export const DEFAULT_NATURE_OPTIONS: NatureOptions = {
  accentColor: '#4ade80',
  particleStyle: 'default',
};

// ─── Translation style options ─────────────────────────────────────────────────
export interface TranslationOptions {
  bgStyle: 'warm' | 'cool' | 'dark';
  highlightColor: string;  // "收到，扣1" highlight
}

export const DEFAULT_TRANSLATION_OPTIONS: TranslationOptions = {
  bgStyle: 'warm',
  highlightColor: '#ffe44d',
};

// ─── Manga style ──────────────────────────────────────────────────────────────
export interface MangaSegment {
  text: string;        // subtitle sentence (editable)
  scene: string;       // English scene description for image gen (editable)
  imageUrl: string;    // AI-generated image URL (filled after polling)
}

export interface MangaContent {
  segments: MangaSegment[];
  disclaimer: string;
  rapAudioUrl?: string;  // Suno-generated RAP song URL (only in RAP mode)
}

// Manga image sub-styles (character + scene)
export type MangaImageStyle = 'default' | 'cat3d' | 'zen' | 'elite';

export interface MangaOptions {
  disclaimer: string;
  subtitleFontSize: number;    // default 72
  slideDurationMs: number;     // ms per segment, default 4000
  ttsEnabled: boolean;         // enable voice narration during recording
  ttsVoice: string;            // Bailian CosyVoice voice ID
  ttsCustomVoice: string;      // custom voice ID; if non-empty, overrides ttsVoice
  ttsRate: number;             // speech rate multiplier: 0.5 ~ 2.0, default 1.0
  ttsVolume: number;           // audio volume 0-100, default 80
  rapMode: boolean;            // RAP mode: generates rap lyrics + hip-hop visuals
  imageStyle: MangaImageStyle; // character image style (default / cat3d / zen / elite)
  minimaxVoiceId: string;      // MiniMax TTS voice ID for character styles
}

export const DEFAULT_MANGA_OPTIONS: MangaOptions = {
  disclaimer: '仅代表个人观点，无任何不良导向',
  subtitleFontSize: 72,
  slideDurationMs: 4000,
  ttsEnabled: false,
  ttsVoice: 'longxiaochun',
  ttsCustomVoice: '',
  ttsRate: 1.0,
  ttsVolume: 80,
  rapMode: false,
  imageStyle: 'default',
  minimaxVoiceId: '',
};

// ─── AI Goblin style options ──────────────────────────────────────────────────
export interface AIGoblinOptions {
  characterImageUrl: string;
  titleText: string;
  subtitleText: string;
  tags: string[];
  primaryColor: string;
  bgColor1: string;
  bgColor2: string;
  fontSize: 'sm' | 'md' | 'lg';
}

export const DEFAULT_AIGOBLIN_OPTIONS: AIGoblinOptions = {
  characterImageUrl: '',
  titleText: '',
  subtitleText: '',
  tags: [],
  primaryColor: '#f59e0b',
  bgColor1: '#1a0a0a',
  bgColor2: '#0d0820',
  fontSize: 'md',
};

// ─── Content / generator ──────────────────────────────────────────────────────
export interface ContentPoint {
  label: string;
  short: string;
  desc: string;
  formatted: string;
  sceneType?: AIKnowledgeSceneType;
  source?: string;
  verifiedAt?: string;
  mediaUrl?: string;
}

export type AIKnowledgeSceneType = 'tool-steps' | 'prompt-breakdown' | 'before-after' | 'workflow';
export type AIKnowledgeTheme = 'deep-tech' | 'bright-knowledge' | 'business';
export type AIKnowledgeAudience = 'beginner' | 'small-business';

export interface GeneratedContent {
  title: string;
  points: ContentPoint[];
  audience?: AIKnowledgeAudience;
  actionPrompt?: string;
}

export interface NatureContent {
  title: string;
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  commonItems?: string[];
}

export interface GeneratorConfig {
  style: StyleType;
  coverIndex: number;
  text: string;
  chineseOptions: ChineseOptions;
  aiOptions?: AIOptions;
  natureContent?: NatureContent;
}

export interface ThemeConfig {
  bg: [string, string, string];
  accent: string;
  accent2: string;
  particle: string;
  gridColor: string;
}

// ─── Unified Title Options (all canvas styles) ────────────────────────────────
export type TitleLineEnterAnim = 'withScene' | 'dropsFromSky' | 'slideUp' | 'fadeIn' | 'typewriter';

export interface TitleLineConfig {
  text: string;       // '' = auto-split from content.title by line index
  fontSize: number;
  fontFamily: string; // '' = "Noto Sans SC"
  fontWeight: 400 | 700 | 900;
  color: string;      // '' = '#ffffff'
  colorEnd: string;   // '' = solid; non-empty = horizontal left→right gradient
  enterAnim: TitleLineEnterAnim;
  // ── Optional border box (like green box in reference) ────────────────────
  borderEnabled?: boolean;   // show a rounded-rect border + optional fill behind this line
  borderColor?: string;      // '' = use accent color
  borderBgAlpha?: number;    // 0–1, fill opacity (default 0.75); 0 = border only
  borderPadX?: number;       // horizontal padding (default 48)
  borderPadY?: number;       // vertical padding (default 22)
  borderRadius?: number;     // corner radius (default 20)
}

export interface TitleOptions {
  lines: TitleLineConfig[];    // 1-3 items
  subtitleText: string;        // custom small text below title; '' = hidden
  subtitleColor: string;
  subtitleFontSize: number;
  headerFontSize: number;      // font size after fly-up settle
}

export const DEFAULT_TITLE_LINE_1: TitleLineConfig = {
  text: '', fontSize: 88, fontFamily: '', fontWeight: 700,
  color: '#ffffff', colorEnd: '', enterAnim: 'withScene',
};
export const DEFAULT_TITLE_LINE_2: TitleLineConfig = {
  text: '', fontSize: 172, fontFamily: '', fontWeight: 900,
  color: '#ffffff', colorEnd: '#3b9ef5', enterAnim: 'dropsFromSky',
};
export const DEFAULT_TITLE_OPTIONS: TitleOptions = {
  lines: [DEFAULT_TITLE_LINE_1, DEFAULT_TITLE_LINE_2],
  subtitleText: '',
  subtitleColor: 'rgba(180,200,255,0.75)',
  subtitleFontSize: 40,
  headerFontSize: 60,
};

// ─── Keyword Layout Options ────────────────────────────────────────────────────
export type KeywordLayout = 'grid' | 'radial' | 'card' | 'flow' | 'hexgrid' | 'colorgrid';
export type KeywordCenterAnim = 'scale' | 'typewriter' | 'flydown' | 'glitch' | 'explode' | 'blur' | 'wave';

export interface KeywordOptions {
  layout: KeywordLayout;
  accentColor: string;
  bgColor?: string;
  centerFontSize: number;
  centerColor?: string;
  keywordFontSize: number;
  keywordColor?: string;
  fontFamily?: string;
  fontWeight?: 400 | 600 | 700 | 800;
  staggerMs: number;
  gridLineColor?: string;
  cardBorderColor?: string;
  centerEnterAnim?: KeywordCenterAnim;   // center word entrance animation
}

export const DEFAULT_KEYWORD_OPTIONS: KeywordOptions = {
  layout: 'grid',
  accentColor: '#00d4ff',
  centerFontSize: 120,
  keywordFontSize: 48,
  staggerMs: 280,
  fontWeight: 700,
  centerEnterAnim: 'scale',
};
