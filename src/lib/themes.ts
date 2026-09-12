import type { StyleType, ColorScheme, ThemeConfig, ChineseOptions } from '../types/video';

// ─── Color Schemes (Chinese theme) ────────────────────────────────────────────
export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; secondary: string; tertiary: string }> = {
  ink: { primary: '#c0c0c0', secondary: '#8b8b8b', tertiary: '#4a4a4a' },
  cinnabar: { primary: '#e74c3c', secondary: '#f39c12', tertiary: '#c0392b' },
  jade: { primary: '#1abc9c', secondary: '#27ae60', tertiary: '#16a085' },
  gold: { primary: '#f0c040', secondary: '#d4a017', tertiary: '#8b6914' },
  porcelain: { primary: '#2980b9', secondary: '#ecf0f1', tertiary: '#2c3e50' },
};

// ─── Theme Configs ─────────────────────────────────────────────────────────────
export function getThemeConfig(style: StyleType, chineseOptions?: ChineseOptions): ThemeConfig {
  if (style === 'chinese') {
    const scheme = COLOR_SCHEMES[chineseOptions?.colorScheme ?? 'cinnabar'];
    return {
      bg: ['#0a0a14', '#12121f', '#1a1a2e'],
      accent: scheme.primary,
      accent2: scheme.secondary,
      particle: scheme.primary,
      gridColor: scheme.primary,
    };
  }
  if (style === 'city') {
    return {
      bg: ['#0d1b2a', '#1a2a4a', '#0f1c30'],
      accent: '#f5d87a',
      accent2: '#c8a240',
      particle: '#f5d87a',
      gridColor: '#f5d87a',
    };
  }
  if (style === 'semantic') {
    return {
      bg: ['#081a2f', '#081a2f', '#061426'],
      accent: '#f4cc63',
      accent2: '#ff941a',
      particle: '#f4cc63',
      gridColor: '#9ec9e6',
    };
  }
  if (style === 'warning') {
    return {
      bg: ['#050505', '#151407', '#3b3512'],
      accent: '#f4dc70',
      accent2: '#ff9d18',
      particle: '#f4dc70',
      gridColor: '#8f8234',
    };
  }
  if (style === 'nature') {
    return {
      bg: ['#060e06', '#0d1a0e', '#111f12'],
      accent: '#4ade80',
      accent2: '#86efac',
      particle: '#4ade80',
      gridColor: '#4ade80',
    };
  }
  if (style === 'subtitle') {
    return {
      bg: ['#020204', '#07070f', '#0a0a12'],
      accent: '#ffd700',
      accent2: '#00d4ff',
      particle: '#ffd700',
      gridColor: '#ffd70040',
    };
  }
  if (style === 'translation') {
    return {
      bg: ['#190404', '#3b0c0c', '#8c2222'],
      accent: '#c83030',
      accent2: '#ffe44d',
      particle: '#ffe44d',
      gridColor: '#c8303040',
    };
  }
  if (style === 'manga' || style === 'cat3d' || style === 'zen' || style === 'elite') {
    return {
      bg: ['#0e0818', '#1a0a2e', '#2d1b4e'],
      accent: '#f59e0b',
      accent2: '#fde68a',
      particle: '#f59e0b',
      gridColor: '#f59e0b40',
    };
  }
  if (style === 'aigoblin') {
    return {
      bg: ['#1a0a0a', '#150518', '#0d0820'],
      accent: '#f59e0b',
      accent2: '#fbbf24',
      particle: '#f59e0b',
      gridColor: '#f59e0b30',
    };
  }
  // aitech
  return {
    bg: ['#080c14', '#0f172a', '#1e1b4b'],
    accent: '#a855f7',
    accent2: '#06b6d4',
    particle: '#a855f7',
    gridColor: '#06b6d4',
  };
}

// ─── Shape Metadata ────────────────────────────────────────────────────────────
export interface ShapeItem {
  id: string;
  label: string;
  group: string;
}

export const CHINESE_SHAPES: ShapeItem[] = [
  // 自然
  { id: 'mountain', label: '水墨山水', group: '自然' },
  { id: 'koi', label: '锦鲤波浪', group: '自然' },
  { id: 'bamboo', label: '竹石图', group: '自然' },
  { id: 'crane', label: '仙鹤云纹', group: '自然' },
  { id: 'lotus', label: '荷花蜻蜓', group: '自然' },
  { id: 'plum', label: '梅花五瓣', group: '自然' },
  { id: 'pine', label: '松树剪影', group: '自然' },
  { id: 'wave', label: '水波纹', group: '自然' },
  { id: 'peony', label: '牡丹花开', group: '自然' },
  // 纹样
  { id: 'cloud', label: '祥云瑞气', group: '纹样' },
  { id: 'taichi', label: '太极八卦', group: '纹样' },
  { id: 'swastika', label: '万字纹', group: '纹样' },
  { id: 'meander', label: '回纹边框', group: '纹样' },
  { id: 'icecrack', label: '冰裂纹', group: '纹样' },
  { id: 'knot', label: '盘长结', group: '纹样' },
  { id: 'fenix', label: '凤凰纹', group: '纹样' },
  { id: 'fish', label: '鱼纹', group: '纹样' },
  { id: 'hexflower', label: '六角花', group: '纹样' },
  // 瑞兽
  { id: 'dragon', label: '龙纹', group: '瑞兽' },
  { id: 'opera', label: '京剧脸谱', group: '瑞兽' },
  { id: 'toad', label: '金蟾', group: '瑞兽' },
  { id: 'magpie', label: '喜鹊登梅', group: '瑞兽' },
  // 文字
  { id: 'fu', label: '福', group: '文字' },
  { id: 'shou', label: '寿', group: '文字' },
  { id: 'xi', label: '囍', group: '文字' },
  // 器物
  { id: 'guqin', label: '古琴', group: '器物' },
  { id: 'tile', label: '瓦当纹', group: '器物' },
  { id: 'lantern', label: '灯笼纹', group: '器物' },
  { id: 'ruyi', label: '玉如意', group: '器物' },
  { id: 'fan', label: '折扇', group: '器物' },
  { id: 'vase', label: '花瓶', group: '器物' },
  { id: 'seal', label: '印章框', group: '器物' },
  // 几何
  { id: 'coin', label: '铜钱纹', group: '几何' },
  { id: 'papercut', label: '窗花剪纸', group: '几何' },
  { id: 'jade', label: '玉佩纹', group: '几何' },
  { id: 'heaven', label: '天圆地方', group: '几何' },
  { id: 'bagua', label: '八卦阵', group: '几何' },
  { id: 'ring3', label: '三环', group: '几何' },
  { id: 'starburst', label: '放射星', group: '几何' },
  { id: 'diamond4', label: '四钻', group: '几何' },
  { id: 'lotus8', label: '八瓣莲', group: '几何' },
  { id: 'maze', label: '迷宫格', group: '几何' },
  { id: 'spiral', label: '螺旋纹', group: '几何' },
];

export const CITY_SHAPES: ShapeItem[] = [
  { id: 'network', label: '知识网络', group: '通用知识' },
  { id: 'target', label: '目标聚焦', group: '通用知识' },
  { id: 'prism', label: '结构拆解', group: '通用知识' },
  { id: 'spiral', label: '成长演进', group: '思维成长' },
  { id: 'vortex', label: '心理思维', group: '思维成长' },
  { id: 'star8', label: '历史文化', group: '思维成长' },
  { id: 'atom', label: '科学原理', group: '科技科学' },
  { id: 'helix', label: '生命健康', group: '科技科学' },
  { id: 'hex', label: '数字科技', group: '科技科学' },
  { id: 'crystal', label: '商业财经', group: '商业社会' },
  { id: 'pentagon', label: '组织管理', group: '商业社会' },
  { id: 'snowflake', label: '自然环境', group: '商业社会' },
];

export const AI_SHAPES: ShapeItem[] = [
  // 大模型
  { id: 'chatgpt', label: 'ChatGPT', group: '大模型' },
  { id: 'claude', label: 'Claude', group: '大模型' },
  { id: 'gemini', label: 'Gemini', group: '大模型' },
  { id: 'deepseek', label: 'DeepSeek', group: '大模型' },
  // AI工具
  { id: 'midjourney', label: 'Midjourney', group: 'AI工具' },
  { id: 'stablediff', label: 'StableDiff', group: 'AI工具' },
  { id: 'dalle', label: 'DALL·E', group: 'AI工具' },
  { id: 'sora', label: 'Sora', group: 'AI工具' },
  // 搜索代码
  { id: 'perplexity', label: 'Perplexity', group: '搜索代码' },
  { id: 'cursor', label: 'Cursor', group: '搜索代码' },
  { id: 'copilot', label: 'Copilot', group: '搜索代码' },
  { id: 'grok', label: 'Grok', group: '搜索代码' },
  // 开源模型
  { id: 'llama', label: 'LLaMA', group: '开源模型' },
  { id: 'gemma', label: 'Gemma', group: '开源模型' },
  { id: 'mistral', label: 'Mistral', group: '开源模型' },
  { id: 'qwen', label: 'Qwen', group: '开源模型' },
  // 中国AI
  { id: 'kimi', label: 'Kimi', group: '中国AI' },
  { id: 'doubao', label: '豆包', group: '中国AI' },
  { id: 'wenxin', label: '文心一言', group: '中国AI' },
  { id: 'tongyi', label: '通义千问', group: '中国AI' },
  { id: 'xunfei', label: '讯飞星火', group: '中国AI' },
  // 科技公司
  { id: 'nvidia', label: 'NVIDIA', group: '科技公司' },
  { id: 'tesla', label: 'Tesla', group: '科技公司' },
  { id: 'apple', label: 'Apple', group: '科技公司' },
];

export const NATURE_PAIRS: ShapeItem[] = [
  // Group A - 名山胜水 (6)
  { id: 'pair0',  label: '黄山 | 西湖',    group: '名山胜水' },
  { id: 'pair1',  label: '泰山 | 九寨沟',  group: '名山胜水' },
  { id: 'pair2',  label: '张家界 | 桂林',  group: '名山胜水' },
  { id: 'pair3',  label: '峨眉山 | 三峡',  group: '名山胜水' },
  { id: 'pair4',  label: '长城 | 雪山',    group: '名山胜水' },
  { id: 'pair5',  label: '武夷山 | 青海湖',group: '名山胜水' },
  // Group B - 山水相映 (6)
  { id: 'pair6',  label: '黄山 | 泰山',    group: '山水相映' },
  { id: 'pair7',  label: '西湖 | 九寨沟',  group: '山水相映' },
  { id: 'pair8',  label: '张家界 | 峨眉山',group: '山水相映' },
  { id: 'pair9',  label: '桂林 | 三峡',    group: '山水相映' },
  { id: 'pair10', label: '长城 | 武夷山',  group: '山水相映' },
  { id: 'pair11', label: '雪山 | 青海湖',  group: '山水相映' },
  // Group C - 江山如画 (6)
  { id: 'pair12', label: '黄山 | 张家界',  group: '江山如画' },
  { id: 'pair13', label: '西湖 | 桂林',    group: '江山如画' },
  { id: 'pair14', label: '泰山 | 峨眉山',  group: '江山如画' },
  { id: 'pair15', label: '九寨沟 | 三峡',  group: '江山如画' },
  { id: 'pair16', label: '长城 | 青海湖',  group: '江山如画' },
  { id: 'pair17', label: '武夷山 | 雪山',  group: '江山如画' },
  // Group D - 天地辉映 (6)
  { id: 'pair18', label: '黄山 | 峨眉山',  group: '天地辉映' },
  { id: 'pair19', label: '西湖 | 三峡',    group: '天地辉映' },
  { id: 'pair20', label: '泰山 | 张家界',  group: '天地辉映' },
  { id: 'pair21', label: '九寨沟 | 桂林',  group: '天地辉映' },
  { id: 'pair22', label: '长城 | 三峡',    group: '天地辉映' },
  { id: 'pair23', label: '武夷山 | 泰山',  group: '天地辉映' },
];

export function getShapeList(style: StyleType): ShapeItem[] {
  if (style === 'chinese') return CHINESE_SHAPES;
  if (style === 'city' || style === 'semantic') return CITY_SHAPES;
  if (style === 'nature') return NATURE_PAIRS;
  if (style === 'subtitle') return [];
  if (style === 'translation') return [];
  return AI_SHAPES;
}

// ─── Content-aware shape picker for Chinese style ──────────────────────────────
// Maps content keywords → most relevant shape, falls back to coverIndex cycling.
const CHINESE_TOPIC_SHAPES: [string[], string][] = [
  [['情感', '恋爱', '爱情', '感情', '心动', '暗恋', '脱单', '初恋', '暗恋', '恋人'], 'lotus'],
  [['婚姻', '婚恋', '夫妻', '伴侣', '结婚', '婚礼', '离婚', '爱人'], 'peony'],
  [['工作', '职场', '升职', '加薪', '跳槽', '事业', '老板', '员工', '职业'], 'mountain'],
  [['赚钱', '理财', '投资', '财富', '收入', '薪资', '副业', '创收', '钱'], 'coin'],
  [['健康', '养生', '减肥', '锻炼', '运动', '医', '身体', '亚健康', '保健'], 'taichi'],
  [['朋友', '社交', '人际', '交往', '圈子', '朋友圈', '闺蜜'], 'crane'],
  [['学习', '读书', '考试', '知识', '教育', '培训', '课程'], 'bamboo'],
  [['孩子', '亲子', '家庭', '父母', '育儿', '成长', '教子'], 'pine'],
  [['习惯', '自律', '自我', '改变', '提升', '觉醒', '成长'], 'bagua'],
  [['成功', '梦想', '创业', '奋斗', '机遇', '未来', '目标', '理想'], 'starburst'],
  [['中国', '传统', '国学', '文化', '历史', '古代', '古风'], 'dragon'],
  [['喜庆', '节日', '春节', '新年', '过年', '祝福', '团圆', '元宵'], 'lantern'],
  [['禅', '冥想', '修行', '佛', '道', '哲学', '觉悟', '修心'], 'taichi'],
  [['运气', '福气', '招财', '好运', '风水', '吉祥'], 'fu'],
  [['情绪', '焦虑', '压力', '内耗', '边界', '心理', '抑郁'], 'taichi'],
  [['沟通', '表达', '说话', '语言', '谈判', '演讲', '话术'], 'seal'],
  [['美食', '美容', '穿搭', '颜值', '生活方式', '时尚'], 'fan'],
  [['女性', '女人', '女生', '妈妈', '姐姐', '她'], 'lotus'],
  [['团队', '领导', '管理', '企业', '职业规划'], 'mountain'],
  [['人性', '人心', '人生', '真相', '本质', '底层', '规律'], 'bagua'],
];

export function pickChineseShapeByTitle(
  title: string,
  items: string[],
  coverIndex = 0,
): string {
  const text = title + items.join('');
  for (const [keywords, shapeId] of CHINESE_TOPIC_SHAPES) {
    if (keywords.some(kw => text.includes(kw))) return shapeId;
  }
  return CHINESE_SHAPES[coverIndex % CHINESE_SHAPES.length]?.id ?? 'mountain';
}

const KNOWLEDGE_TOPIC_SHAPES: [string[], string][] = [
  [['科技', 'AI', '人工智能', '互联网', '软件', '编程', '数据', '数字'], 'hex'],
  [['科学', '物理', '化学', '宇宙', '能源', '原理', '实验'], 'atom'],
  [['健康', '医学', '医疗', '生物', '基因', '营养', '疾病', '身体'], 'helix'],
  [['财经', '金融', '投资', '商业', '经济', '赚钱', '财富', '市场', '复利', '收益', '利率', '股票', '基金'], 'crystal'],
  [['管理', '职场', '组织', '团队', '企业', '领导', '效率'], 'pentagon'],
  [['历史', '文化', '人物', '传统', '国学', '文明'], 'star8'],
  [['心理', '情绪', '认知', '思维', '焦虑', '关系', '沟通'], 'vortex'],
  [['成长', '学习', '教育', '读书', '方法', '习惯', '人生'], 'spiral'],
  [['自然', '环境', '气候', '地理', '动物', '植物'], 'snowflake'],
  [['目标', '重点', '策略', '计划', '行动'], 'target'],
  [['结构', '拆解', '分析', '逻辑', '框架', '系统'], 'prism'],
];

export function pickKnowledgeShapeByTitle(
  title: string,
  items: string[],
  coverIndex = 0,
): string {
  const text = title + items.join('');
  for (const [keywords, shapeId] of KNOWLEDGE_TOPIC_SHAPES) {
    if (keywords.some(kw => text.includes(kw))) return shapeId;
  }
  return CITY_SHAPES[coverIndex % CITY_SHAPES.length]?.id ?? 'network';
}
