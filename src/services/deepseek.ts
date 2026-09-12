import type { GeneratedContent, NatureContent } from '../types/video';

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const LS_KEY = 'deepseek_api_key';

const SYSTEM_PROMPT = `你是AIfman的AI知识视频导演。受众是完全不懂AI的普通人或中小企业经营者。把输入整理成看完就能操作的知识视频，以严格JSON返回，不要有任何多余文字。

返回格式：
{
  "title": "核心标题（≤12字，有冲击力）",
  "audience": "beginner或small-business",
  "actionPrompt": "本期行动提示（≤12字）",
  "points": [
    {
      "label": "核心词（2-4字，有冲击力）",
      "short": "一句话补充（5-10字）",
      "desc": "详细解释（15-20字，务必简洁）",
      "formatted": "精炼格式（3-5字事件：3-5字感悟，共10-16字）",
      "sceneType": "tool-steps或prompt-breakdown或before-after或workflow",
      "source": "涉及价格、产品功能或具体数据时填写可靠来源名称，否则留空",
      "verifiedAt": "来源核验日期YYYY-MM-DD，否则留空"
    }
  ]
}

规则：
- 若原文有明确维度（如"三维度"、"三个要点"），严格对应生成，不增不减
- 若原文无明确分类，自然分3~5个主题点
- 工具操作选tool-steps；提示词组成选prompt-breakdown；修改前后或优劣选before-after；有步骤和因果链选workflow
- 面向零基础用户，不堆术语；面向小老板时优先说明业务动作，不得捏造收益数字
- 具体价格、产品能力、效率数字缺少来源时，不得写成确定事实
- 只返回JSON，不要任何其他文字
- 确保所有字段都有值`;

const NATURE_PROMPT = `你是一个内容对比提炼专家。用户会给你一段文章或话题，你需要提炼出两组对比内容以及共同点，以严格的JSON格式返回。

返回格式：
{
  "title": "对比主题标题（≤14字，有冲击力）",
  "leftTitle": "A方标签（3-8字，如'穷人在想'）",
  "rightTitle": "B方标签（3-8字，如'富人在研究'）",
  "leftItems": ["关键词1","关键词2"],
  "rightItems": ["关键词1","关键词2"],
  "commonItems": ["双方都有的关键词1","关键词2"]
}

规则：
- leftItems：A方特有的关键词，4-8个，每个2-5字
- rightItems：B方特有的关键词，4-8个，每个2-5字
- commonItems：A和B共同拥有或都会经历的概念，2-5个，每个2-5字（如"健康","时间","家庭"等）
- 三组内容之间不能重复
- 只返回JSON，不要任何其他文字`;

export function getStoredApiKey(): string {
  try { return localStorage.getItem(LS_KEY) ?? ''; }
  catch { return ''; }
}

export function setStoredApiKey(key: string) {
  try { localStorage.setItem(LS_KEY, key); }
  catch { /* ignore */ }
}

function parseJsonFromAI(raw: string): unknown {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? match[1].trim() : raw.trim();
  return JSON.parse(jsonStr);
}

async function callDeepSeek(systemPrompt: string, userText: string, maxTokens: number): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API 错误 (${res.status})`);
  }
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('AI 返回内容为空，请重试');
  return content;
}

export async function extractContent(text: string): Promise<GeneratedContent> {
  if (text.length < 20) throw new Error('内容太短，请输入至少20个字符');
  if (text.length > 8000) throw new Error('内容过长，请控制在8000字以内');

  const raw = await callDeepSeek(SYSTEM_PROMPT, text, 1200);

  let parsed: GeneratedContent;
  try { parsed = parseJsonFromAI(raw) as GeneratedContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }

  if (!parsed.title || !Array.isArray(parsed.points) || parsed.points.length === 0) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  const validScenes = new Set(['tool-steps', 'prompt-breakdown', 'before-after', 'workflow']);
  return {
    ...parsed,
    audience: parsed.audience === 'small-business' ? 'small-business' : 'beginner',
    actionPrompt: parsed.actionPrompt?.trim() || '收藏这套方法',
    points: parsed.points.map(point => ({
      ...point,
      sceneType: validScenes.has(point.sceneType ?? '') ? point.sceneType : undefined,
      source: point.source?.trim() || '',
      verifiedAt: point.verifiedAt?.trim() || '',
    })),
  };
}

const WARNING_PROMPT = `你是观点型短视频文案编辑。用户会提供一段观点、文章或主题。必须严格整理成“认知警示清单”，以JSON返回，不要输出任何多余文字。

返回格式：
{
  "title": "某类人的N大陷阱/误区/表现（8-14字）",
  "audience": "beginner",
  "actionPrompt": "避开这些陷阱",
  "points": [
    {
      "label": "四到八字的陷阱名称",
      "short": "一句尖锐判断（8-16字）",
      "desc": "一句具体行为或后果（14-24字）",
      "formatted": "陷阱名称：尖锐判断",
      "sceneType": "before-after",
      "source": "",
      "verifiedAt": ""
    }
  ]
}

写法必须遵守：
- 标题明确说清对象、数量和警示主题，例如“困住普通人的四大陷阱”
- label只命名一种陷阱，具体、有记忆点，禁止空泛词
- short必须像案例中的判断句，短、狠、直接点破代价；禁止解释概念
- desc只写可观察的行为或结果，不重复short，不喊口号
- 每一点之间角度不同，句式平行，长度接近
- 原文明确数量时严格保持；未明确时提炼4点
- 不捏造事实、数字、身份或因果
- 只返回JSON`;

export async function extractWarningContent(text: string): Promise<GeneratedContent> {
  if (text.length < 20) throw new Error('内容太短，请输入至少20个字符');
  if (text.length > 8000) throw new Error('内容过长，请控制在8000字以内');
  const raw = await callDeepSeek(WARNING_PROMPT, text, 1000);
  let parsed: GeneratedContent;
  try { parsed = parseJsonFromAI(raw) as GeneratedContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }
  if (!parsed.title || !Array.isArray(parsed.points) || parsed.points.length === 0) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return {
    ...parsed,
    audience: 'beginner',
    actionPrompt: parsed.actionPrompt?.trim() || '避开这些陷阱',
    points: parsed.points.map(point => ({
      ...point,
      sceneType: 'before-after',
      source: point.source?.trim() || '',
      verifiedAt: point.verifiedAt?.trim() || '',
    })),
  };
}

export async function extractNatureContent(text: string): Promise<NatureContent> {
  if (text.length < 10) throw new Error('内容太短');

  const raw = await callDeepSeek(NATURE_PROMPT, text, 600);

  let parsed: NatureContent;
  try { parsed = parseJsonFromAI(raw) as NatureContent; }
  catch { throw new Error('AI 返回格式错误，请重试'); }

  if (!parsed.title || !Array.isArray(parsed.leftItems) || !Array.isArray(parsed.rightItems)) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed;
}

const TRANSLATION_PROMPT = `你是一个中英互译专家。用户给你一句中文，你直接返回对应的英文翻译，要求：
- 简洁自然，符合英文表达习惯
- 不超过20个单词
- 只返回英文翻译，不要任何解释、引号或其他文字`;

const MANGA_SCRIPT_PROMPT = `你是一个自媒体短视频文案专家。用户给你一段文字，你要优化成适合漫画短视频的字幕脚本。

返回格式（严格JSON，不要任何多余文字）：
{
  "segments": [
    {
      "subtitle": "字幕台词（≤20字，口语化，有感染力）",
      "scene": "anime manga style illustration, [brief scene in English], dramatic lighting, detailed character, cinematic"
    }
  ]
}

规则：
- 生成 5~8 段
- 每段字幕≤20字，口语化，连贯流畅，有情绪感
- 每段的 scene 用简洁英文描述与字幕对应的画面，风格为 anime manga illustration
- 场景描述要多样，不要重复（如：close-up face, two people talking, city background, indoor scene等）
- 只返回JSON，不要任何其他文字`;

export async function extractMangaScript(text: string): Promise<{ subtitle: string; scene: string }[]> {
  if (text.length < 10) throw new Error('内容太短');
  const raw = await callDeepSeek(MANGA_SCRIPT_PROMPT, text, 1000);
  let parsed: { segments: { subtitle: string; scene: string }[] };
  try { parsed = parseJsonFromAI(raw) as typeof parsed; }
  catch { throw new Error('AI 返回格式错误，请重试'); }
  if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed.segments;
}

// ─── RAP Script ──────────────────────────────────────────────────────────────

const RAP_SCRIPT_PROMPT = `你是一个专业的中文 RAP 词人。用户给你一段文字或话题，你要将其核心观点改写成地道的中文 RAP 歌词，每一行是一个 bar，在视频中逐段展示。

返回格式（严格JSON，不要任何多余文字）：
{
  "segments": [
    {
      "subtitle": "RAP 歌词一行（8-14字，押韵有节拍感）",
      "scene": "hip hop urban street art illustration, [brief English scene description], neon lights, graffiti, cinematic"
    }
  ]
}

要求：
- 生成 10~14 个 bar，每个 bar 一个 segment
- 每段字幕 8-14 个汉字，节拍感强，口语化，有力量感
- 押韵规则：每两行押尾韵（AABB 格式优先），听起来要顺口
- 内容忠实于输入文字的核心观点，但要用街头说唱的语气和表达方式
- 每段 scene 用简洁英文描述对应的嘻哈街头画面（如 graffiti wall, neon city night, rapper silhouette, urban rooftop 等）
- 图像风格全部为 hip hop street art anime style，色彩鲜艳，有冲击力
- 只返回JSON，不要任何其他文字`;

export async function extractRapScript(text: string): Promise<{ subtitle: string; scene: string }[]> {
  if (text.length < 10) throw new Error('内容太短');
  const raw = await callDeepSeek(RAP_SCRIPT_PROMPT, text, 1400);
  let parsed: { segments: { subtitle: string; scene: string }[] };
  try { parsed = parseJsonFromAI(raw) as typeof parsed; }
  catch { throw new Error('AI 返回格式错误，请重试'); }
  if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
    throw new Error('AI 返回数据不完整，请重试');
  }
  return parsed.segments;
}

export async function translateSentence(text: string): Promise<string> {
  const raw = await callDeepSeek(TRANSLATION_PROMPT, text, 250);
  return raw.trim().replace(/^["'\s]+|["'\s]+$/g, '');
}

// ─── Keyword Layout: extract central word + surrounding keywords ───────────────
const KEYWORD_PROMPT = `你是一个关键词提炼专家。用户给你一段文章或话题，你要提炼出一个中心主题词（2-6个字，精炼有力，将显示在画面正中央）和18-26个围绕主题的关键词，以严格的JSON格式返回，不要有任何多余文字。

输出格式：
{
  "title": "中心主题词（2-6字，精炼有力）",
  "points": [
    {"label": "关键词1", "short": "简短行动短语（3-7字）", "desc": "", "formatted": ""},
    {"label": "关键词2", "short": "简短行动短语（3-7字）", "desc": "", "formatted": ""}
  ]
}

要求：
- title 是文章核心主题，2-6个字，简洁有力，将作为大字出现在画面中央
- label 每个关键词 2-6 个字，简洁精炼
- short 每个关键词配一个简短的行动短语或补充说明，3-7个字（如"快刀斩乱麻"、"借势登高"）
- 总关键词数量 18-26 个
- desc/formatted 保持空字符串
- 关键词要覆盖文章的核心概念、关键动作、价值观等维度`;

export async function extractKeywords(text: string): Promise<GeneratedContent> {
  const raw = await callDeepSeek(KEYWORD_PROMPT, text, 1200);
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw) as { title: string; points: Array<{ label: string; short: string; desc: string; formatted: string }> };
    if (!parsed.title || !Array.isArray(parsed.points) || parsed.points.length < 5) {
      throw new Error('格式错误');
    }
    return {
      title: parsed.title,
      points: parsed.points.map(p => ({
        label:     (p.label ?? '').trim(),
        short:     (p.short ?? '').trim(),
        desc:      '',
        formatted: (p.label ?? '').trim(),
      })).filter(p => p.label.length > 0),
    };
  } catch {
    throw new Error('关键词提炼失败，请重试');
  }
}
