import { useEffect, useRef, memo } from 'react';
import { Shuffle } from 'lucide-react';
import type { StyleType } from '../types/video';
import { getShapeList } from '../lib/themes';
import { getShapeSvg, svgToDataUrl } from '../lib/shapes';

interface Props {
  style: StyleType;
  selected: number;
  onChange: (idx: number) => void;
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
};

const ShapeThumbnail = memo(function ShapeThumbnail({
  style, shapeId, accent,
}: { style: StyleType; shapeId: string; accent: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const svg = getShapeSvg(style, shapeId, accent, 1.5);
    if (imgRef.current) {
      imgRef.current.src = svgToDataUrl(svg);
    }
  }, [style, shapeId, accent]);
  return (
    <img
      ref={imgRef}
      alt=""
      className="w-full h-full object-contain p-1.5"
      draggable={false}
    />
  );
});

export default function CoverPicker({ style, selected, onChange }: Props) {
  const shapes = getShapeList(style);
  const accent = ACCENT_BY_STYLE[style];

  const handleRandom = () => {
    onChange(Math.floor(Math.random() * shapes.length));
  };

  // Nature style: show text-based pair selector (no SVG thumbnails)
  if (style === 'nature') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">景点对</span>
          <button
            onClick={handleRandom}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}
          >
            <Shuffle size={12} />
            随机
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((pair, idx) => (
            <button
              key={pair.id}
              onClick={() => onChange(idx)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-left transition-all"
              style={{
                background: idx === selected ? `${accent}22` : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${idx === selected ? accent : 'rgba(255,255,255,0.1)'}`,
                color: idx === selected ? accent : 'rgba(255,255,255,0.6)',
                boxShadow: idx === selected ? `0 0 12px ${accent}50` : 'none',
              }}
            >
              {pair.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/40 text-center">
          已选：{shapes[selected]?.label ?? '—'}
        </div>
      </div>
    );
  }

  // Group shapes
  const groups: Record<string, typeof shapes> = {};
  shapes.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">封面图案</span>
        <button
          onClick={handleRandom}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors"
          style={{
            background: `${accent}18`,
            color: accent,
            border: `1px solid ${accent}40`,
          }}
        >
          <Shuffle size={12} />
          随机
        </button>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scroll">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="mb-1.5 text-xs text-white/35 font-medium tracking-wider uppercase">{group}</div>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {items.map((shape) => {
                const globalIdx = shapes.findIndex(s => s.id === shape.id);
                const isSelected = globalIdx === selected;
                return (
                  <button
                    key={shape.id}
                    title={shape.label}
                    onClick={() => onChange(globalIdx)}
                    className="relative aspect-square rounded-lg overflow-hidden transition-all duration-150 hover:scale-105 active:scale-100"
                    style={{
                      background: isSelected ? `${accent}22` : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${isSelected ? accent : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isSelected ? `0 0 10px ${accent}60` : 'none',
                    }}
                  >
                    <ShapeThumbnail style={style} shapeId={shape.id} accent={accent} />
                    {isSelected && (
                      <div
                        className="absolute inset-0 rounded-lg opacity-20"
                        style={{ background: accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/40 text-center">
        已选：{shapes[selected]?.label ?? '—'}
      </div>
    </div>
  );
}
