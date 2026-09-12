// Main canvas engine — split into focused sub-modules to keep files manageable.
import type { GeneratedContent, StyleType, ChineseOptions, AIOptions, NatureContent, SubtitleOptions, CityOptions, MangaContent, MangaOptions, AItechOptions, NatureOptions, TitleOptions, KeywordOptions, AIGoblinOptions } from '../types/video';
import { getThemeConfig, pickChineseShapeByTitle } from './themes';
import { loadShapeImage } from './shapes';
import { CHINESE_SHAPES, CITY_SHAPES, AI_SHAPES, pickKnowledgeShapeByTitle } from './themes';

import { CW, CH, seededRandom, T, totalDuration, aiTechPhases, chineseSlideDuration, keywordTotalMs } from './engine/helpers';
import { initChineseEffects } from './engine/chinese';
import { initCityEffects } from './engine/city';
import { initAIEffects } from './engine/aitech';
import { drawTitle } from './engine/title';
import { drawCards } from './engine/cards';
import { drawOutro, drawOverlays } from './engine/outro';
import { drawNatureScene, natureTotalMs } from './engine/nature-scene';
import { cityTotalMs, KNOWLEDGE_OUTRO_MS } from './engine/cards-city';
import { semanticTotalMs } from './engine/cards-semantic';
import { drawWarningScene, warningTotalMs } from './engine/cards-warning';
import {
  drawSubtitle, subtitleTotalMs,
  initSubtitleParticles, type SubParticle,
} from './engine/subtitle';
import {
  drawTranslation, TR_TOTAL_MS,
  initTrParticles, type TrParticle,
} from './engine/translation';
import { drawMangaScene, mangaTotalMs } from './engine/manga';
import { drawAIGoblin, goblinTotalMs, GOBLIN_W, GOBLIN_H } from './engine/aigoblin';

// ── Image proxy: fetch via Supabase edge function → Blob URL (always origin-clean) ──
const SUPABASE_URL = "https://spb-t4ngxi6xsx650369.supabase.opentrust.net";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5neGk2eHN4NjUwMzY5IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzY5MjgzNDAsImV4cCI6MjA5MjUwNDM0MH0.EHz1XRSbWC1AktqItCyzJ5uK5bTPVGEpsots4QJMHyI";

async function loadCanvasImage(imageUrl: string): Promise<HTMLImageElement> {
  const empty = new Image();
  if (!imageUrl) return empty;
  try {
    const proxyUrl = `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const resp = await fetch(proxyUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!resp.ok) return empty;
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    return await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(empty);
      img.src = blobUrl; // Blob URLs are always origin-clean — no crossOrigin needed
    });
  } catch {
    return empty;
  }
}

export { CW, CH };

export interface AnimEngine {
  start: () => void;
  stop: () => void;
  restart: (onComplete?: () => void) => void;
  seekTo: (ms: number) => void;
  getElapsed: () => number;
  isRunning: () => boolean;
  getTotalMs: () => number;
  getCanvasWidth: () => number;
  getCanvasHeight: () => number;
}

function drawPerspectiveGridBackground(ctx: CanvasRenderingContext2D, strongerDepth = false) {
  const inner = { x: 390, y: 205, w: 1140, h: 610 };
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#081A2F';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#061426';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);

  if (strongerDepth) {
    const depthGlow = ctx.createRadialGradient(CW / 2, CH * 0.5, 40, CW / 2, CH * 0.5, 780);
    depthGlow.addColorStop(0, 'rgba(48,112,164,0.16)');
    depthGlow.addColorStop(0.55, 'rgba(14,54,88,0.08)');
    depthGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = depthGlow;
    ctx.fillRect(0, 0, CW, CH);
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(150,195,225,0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const outerX = CW * t;
    const innerX = inner.x + inner.w * t;
    ctx.beginPath(); ctx.moveTo(outerX, 0); ctx.lineTo(innerX, inner.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(outerX, CH); ctx.lineTo(innerX, inner.y + inner.h); ctx.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const outerY = CH * t;
    const innerY = inner.y + inner.h * t;
    ctx.beginPath(); ctx.moveTo(0, outerY); ctx.lineTo(inner.x, innerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CW, outerY); ctx.lineTo(inner.x + inner.w, innerY); ctx.stroke();
  }
  for (const depth of [0.14, 0.3, 0.48, 0.66, 0.83]) {
    const x = inner.x * depth;
    const y = inner.y * depth;
    ctx.strokeRect(x, y, CW - x * 2, CH - y * 2);
  }
  ctx.strokeStyle = 'rgba(175,215,240,0.24)';
  ctx.lineWidth = 2;
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);

  if (strongerDepth) {
    ctx.strokeStyle = 'rgba(190,225,245,0.20)';
    ctx.lineWidth = 1.5;
    for (const inset of [42, 92, 158]) {
      ctx.beginPath();
      ctx.moveTo(inset, CH); ctx.lineTo(inner.x, inner.y + inner.h);
      ctx.lineTo(inner.x + inner.w, inner.y + inner.h); ctx.lineTo(CW - inset, CH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(inset, 0); ctx.lineTo(inner.x, inner.y);
      ctx.lineTo(inner.x + inner.w, inner.y); ctx.lineTo(CW - inset, 0);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.restore();
}

export async function createAnimEngine(
  canvas: HTMLCanvasElement,
  content: GeneratedContent,
  style: StyleType,
  coverIndex: number,
  chineseOptions?: ChineseOptions,
  aiOptions?: AIOptions,
  natureContent?: NatureContent,
  onComplete?: () => void,
  subtitleOptions?: SubtitleOptions,
  accentOverride?: string,
  cityOptions?: CityOptions,
  mangaContent?: MangaContent,
  mangaOptions?: MangaOptions,
  aitechOptions?: AItechOptions,
  natureOptions?: NatureOptions,
  titleOptions?: TitleOptions,
  keywordOptions?: KeywordOptions,
  aigoblinOptions?: AIGoblinOptions,
): Promise<AnimEngine> {
  const theme = getThemeConfig(style, chineseOptions);
  // Allow per-style accent override (affects BG, title, overlays, shape decoration)
  const accent  = accentOverride ?? theme.accent;
  const accent2 = theme.accent2;
  const isNature      = style === 'nature';
  const isSubtitle    = style === 'subtitle';
  const isTranslation = style === 'translation';
  const isManga       = style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite';
  const isGoblin      = style === 'aigoblin';
  const isKeyword     = style === 'keyword';
  const isSemantic    = style === 'semantic';
  const isWarning     = style === 'warning';

  const rand = seededRandom(coverIndex * 31 + content.points.length * 17 + 7);

  // Shape image not needed for nature, subtitle, translation, manga, goblin, or keyword styles
  let shapeImg: HTMLImageElement | null = null;
  if (!isNature && !isSubtitle && !isTranslation && !isManga && !isKeyword && !isGoblin && !isSemantic && !isWarning) {
    const shapeList = style === 'chinese' ? CHINESE_SHAPES
      : style === 'city' ? CITY_SHAPES : AI_SHAPES;
    // For Chinese: pick shape by content keywords; other styles cycle by coverIndex
    const shapeId = style === 'chinese'
      ? pickChineseShapeByTitle(
          content.title ?? '',
          content.points.map(p => p.label ?? ''),
          coverIndex,
        )
      : style === 'city'
        ? pickKnowledgeShapeByTitle(
            content.title ?? '',
            content.points.map(p => `${p.label ?? ''}${p.short ?? ''}${p.desc ?? ''}`),
            coverIndex,
          )
      : shapeList[coverIndex % shapeList.length]?.id ?? shapeList[0].id;
    const shapeColor = style === 'city' ? '#f5d87a' : accent;
    const lineWidth = style === 'chinese' ? (chineseOptions?.lineWidth ?? 2) : 1.5;
    shapeImg = await loadShapeImage(style, shapeId, shapeColor, lineWidth);
  }

  // Manga: pre-load all images via proxy → Blob URLs (origin-clean for canvas)
  let mangaImages: HTMLImageElement[] = [];
  if (isManga && mangaContent) {
    mangaImages = await Promise.all(
      mangaContent.segments.map(s => loadCanvasImage(s.imageUrl ?? ''))
    );
  }

  // Goblin: pre-load character image
  let goblinImg: HTMLImageElement = new Image();
  if (isGoblin && aigoblinOptions?.characterImageUrl) {
    goblinImg = await loadCanvasImage(aigoblinOptions.characterImageUrl);
  }

  const knowledgeImages: HTMLImageElement[] = style === 'city'
    ? await Promise.all(content.points.map(point => loadCanvasImage(point.mediaUrl ?? '')))
    : [];

  const chineseEffects = style === 'chinese'  ? initChineseEffects(rand) : null;
  const cityEffects    = style === 'city'      ? initCityEffects(rand)    : null;
  const aiEffects      = style === 'aitech'    ? initAIEffects(rand)      : null;
  const subtitlePs: SubParticle[] | null = isSubtitle
    ? initSubtitleParticles(rand) : null;
  const trPs: TrParticle[] | null = isTranslation
    ? initTrParticles(rand) : null;

  const slideDurMs = mangaOptions?.slideDurationMs ?? 4000;

  const ctx = canvas.getContext('2d')!;
  const total = isGoblin
    ? goblinTotalMs(content.points.length, aigoblinOptions)
    : isManga
      ? mangaTotalMs(mangaContent?.segments.length ?? 0, slideDurMs)
      : isNature
      ? natureTotalMs(
          natureContent?.leftItems.length ?? 0,
          natureContent?.rightItems.length ?? 0,
          natureContent?.commonItems?.length ?? 0,
        )
      : isSubtitle
        ? subtitleTotalMs(content, subtitleOptions)
        : isTranslation
          ? TR_TOTAL_MS
          : style === 'city'
            ? cityTotalMs(content.points.length, content, cityOptions?.animationSeed)
            : style === 'semantic'
              ? semanticTotalMs(content.points.length)
            : style === 'warning'
              ? warningTotalMs(content.points.length)
            : style === 'aitech'
              ? aiTechPhases(content.points.length).total
              : style === 'chinese'
                ? chineseSlideDuration(content.points.length)
                : style === 'keyword'
                  ? keywordTotalMs(content.points.length, keywordOptions?.staggerMs)
                  : totalDuration(content.points.length);

  let rafId = 0, startTime = 0, running = false;
  let lastElapsed = 0;
  let completionCallback = onComplete;

  function render(elapsed: number) {
    // Use canvas's actual dimensions (supports variable-aspect engines like aigoblin 9:16)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Manga: fully self-contained pipeline ──
    if (isManga && mangaContent && mangaOptions) {
      drawMangaScene(ctx, elapsed, mangaContent, mangaOptions, mangaImages);
      return;
    }

    // ── Subtitle: fully self-contained pipeline ──
    if (isSubtitle && subtitlePs) {
      drawSubtitle(ctx, elapsed, content, subtitlePs, subtitleOptions);
      return;
    }

    // ── Translation: fully self-contained pipeline ──
    if (isTranslation && trPs) {
      drawTranslation(ctx, elapsed, content, trPs);
      return;
    }

    // ── AI Goblin: 9:16 portrait, dark character + sequential reveals ──
    if (isGoblin && aigoblinOptions) {
      drawAIGoblin(ctx, elapsed, content, aigoblinOptions, goblinImg);
      return;
    }

    if (isNature && natureContent) {
      drawNatureScene(ctx, elapsed, natureContent, accent, accent2, coverIndex, natureOptions);
      // Nature title is handled by unified drawTitle
      const natureTitleContent: GeneratedContent = { title: natureContent.title, points: [] };
      drawTitle(ctx, elapsed, natureTitleContent, accent, accent2, 'nature', titleOptions);
      return;
    }

    if (isWarning) {
      drawWarningScene(ctx, elapsed, content);
      return;
    }

    if (style === 'chinese' && chineseEffects) {
      // Clean dark gradient background (navy to near-black) matching reference design
      const bg = ctx.createLinearGradient(0, 0, CW, CH);
      bg.addColorStop(0, '#0b1126');
      bg.addColorStop(0.55, '#080d1a');
      bg.addColorStop(1, '#030508');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
      // Subtle center glow
      const glow = ctx.createRadialGradient(CW * 0.5, CH * 0.5, 0, CW * 0.5, CH * 0.5, CW * 0.5);
      glow.addColorStop(0, `${accent}0a`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, CW, CH);
    } else if ((style === 'city' && cityEffects) || style === 'semantic') {
      drawPerspectiveGridBackground(ctx, isSemantic);
    } else if (style === 'aitech' && aiEffects) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CW, CH);
    } else if (style === 'keyword') {
      const bg2 = ctx.createLinearGradient(0, 0, CW, CH);
      bg2.addColorStop(0, '#030510');
      bg2.addColorStop(0.5, '#080c1a');
      bg2.addColorStop(1, '#040508');
      ctx.fillStyle = bg2; ctx.fillRect(0, 0, CW, CH);
      const glow2 = ctx.createRadialGradient(CW * 0.5, CH * 0.5, 0, CW * 0.5, CH * 0.5, 680);
      glow2.addColorStop(0, `${accent}15`);
      glow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow2; ctx.fillRect(0, 0, CW, CH);
    }

    // Shape decoration removed — background is plain black
    // For keyword style: title is handled internally (no header)
    const cityOutroStart = style === 'city' || style === 'semantic'
      ? (style === 'city'
        ? cityTotalMs(content.points.length, content, cityOptions?.animationSeed)
        : semanticTotalMs(content.points.length)) - KNOWLEDGE_OUTRO_MS
      : Number.POSITIVE_INFINITY;
    if (!isKeyword && elapsed <= cityOutroStart) drawTitle(ctx, elapsed, content, accent, accent2, style, titleOptions, cityOptions);
    drawCards(ctx, elapsed, content, accent, accent2, style, shapeImg!, aitechOptions?.polyShape ?? aiOptions?.polyShape, coverIndex, chineseOptions, cityOptions, aitechOptions, keywordOptions, knowledgeImages);

    const outroStart = style === 'city' || style === 'semantic'
      ? cityOutroStart
      : (style === 'chinese'
        ? chineseSlideDuration(content.points.length)
        : style === 'keyword'
          ? keywordTotalMs(content.points.length, keywordOptions?.staggerMs)
          : totalDuration(content.points.length)) - T.outroDur;
    // aitech has its own phase-5 outro; keyword just holds last frame
    if (style !== 'aitech' && style !== 'keyword' && elapsed > outroStart) {
      drawOutro(ctx, elapsed - outroStart, content, accent, accent2, style, cityOptions);
    }

    drawOverlays(ctx, elapsed, accent, style);
  }

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - startTime;
    lastElapsed = elapsed;
    render(elapsed);
    if (elapsed < total) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      lastElapsed = total;
      render(total);
      completionCallback?.();
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startTime = performance.now() - lastElapsed;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    restart(cb?: () => void) {
      running = false;
      cancelAnimationFrame(rafId);
      completionCallback = cb;
      lastElapsed = 0;
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    seekTo(ms: number) {
      running = false;
      cancelAnimationFrame(rafId);
      const clamped = Math.max(0, Math.min(ms, total));
      lastElapsed = clamped;
      render(clamped);
    },
    getElapsed: () => lastElapsed,
    isRunning: () => running,
    getTotalMs: () => total,
    getCanvasWidth: () => isGoblin ? GOBLIN_W : CW,
    getCanvasHeight: () => isGoblin ? GOBLIN_H : CH,
  };
}
