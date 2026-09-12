import type { StyleType } from '../types/video';

export interface AnimationStyleDefinition {
  key: StyleType;
  name: string;
  desc: string;
  tag: string;
  bg: string;
  accent: string;
}

// This is the single registry used by the generator's style picker. Add future
// public animation styles here; legacy renderers remain internal until exposed.
export const ANIMATION_STYLES: AnimationStyleDefinition[] = [
  {
    key: 'city',
    name: '知识结构',
    desc: '全貌 · 金字塔 · 流程教学',
    tag: '系统化讲解',
    bg: 'linear-gradient(135deg,#081a2f,#102b48)',
    accent: '#f5d87a',
  },
  {
    key: 'semantic',
    name: '语义图解',
    desc: '左侧重点文字 · 右侧动态图形',
    tag: '逐组单页讲解',
    bg: 'linear-gradient(135deg,#090b14,#172033)',
    accent: '#f4cc63',
  },
  {
    key: 'warning',
    name: '认知警示',
    desc: '陷阱清单 · 尖锐判断 · 具体后果',
    tag: '观点警示清单',
    bg: 'radial-gradient(circle,#050505,#3b3512)',
    accent: '#f4dc70',
  },
];
