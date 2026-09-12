import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Expand, Play, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '@/components/commerce/SiteHeader';
import PlanGrid from '@/components/commerce/PlanGrid';

const STYLE_CASES = [
  { id: 'city', name: '知识结构', video: '/videos/style-structure-preview.mp4', poster: '/videos/style-structure-poster.jpg' },
  { id: 'semantic', name: '语义图解', video: '/videos/style-semantic-preview.mp4', poster: '/videos/style-semantic-poster.jpg' },
  { id: 'warning', name: '认知警示', video: '/videos/style-warning-preview.mp4', poster: '/videos/style-warning-poster.jpg' },
];

export default function Home() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<(typeof STYLE_CASES)[number] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (preview) void videoRef.current?.play();
  }, [preview]);

  const selectStyle = (style: (typeof STYLE_CASES)[number]) => {
    setPreview(null);
    navigate(`/create?style=${style.id}`);
  };

  return (
    <div className="commercial-page">
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div className="hero-copy-block">
            <p className="home-eyebrow">内容动画视频生成工具</p>
            <h1>输入内容，<br />直接生成动画视频</h1>
            <p className="home-subtitle">不用剪辑，不用做动画。选择喜欢的案例效果，把文案变成可以发布的视频。</p>
            <div className="hero-actions"><a href="#styles" className="button button-primary button-large">选择风格 <ArrowRight size={17} /></a><a href="#pricing" className="text-link">查看价格</a></div>
          </div>
          <button className="hero-media" onClick={() => setPreview(STYLE_CASES[0])} aria-label="播放知识结构风格案例">
            <img src={STYLE_CASES[0].poster} alt="知识结构动画视频案例封面" />
            <span className="hero-media-shade" />
            <span className="hero-play"><Play fill="currentColor" size={22} /></span>
            <span className="hero-media-caption"><strong>知识结构</strong><span>点击播放案例</span></span>
          </button>
        </section>

        <section className="proof-strip" aria-label="产品特点"><span><Check size={15} />真实视频案例</span><span><Check size={15} />浏览器直接生成</span><span><Check size={15} />高清 MP4 导出</span><span><Check size={15} />支持中文内容</span></section>

        <section className="styles-section" id="styles">
          <div className="section-heading"><h2>先看成片，再选风格</h2><p>小窗查看封面，点击后放大播放。确定效果后直接进入创作台。</p></div>
          <div className="style-case-row">
            {STYLE_CASES.map((style) => <button className="style-case" key={style.id} onClick={() => setPreview(style)}><img src={style.poster} alt={`${style.name}视频案例`} /><span className="style-case-shade" /><strong>{style.name}</strong><span className="case-play"><Play fill="currentColor" size={15} /></span></button>)}
            <div className="style-upcoming"><div className="upcoming-orbit"><span /></div><strong>更多风格</strong><span>待上线</span></div>
          </div>
        </section>

        <section className="product-story">
          <div className="story-copy"><h2>内容交给你，动画交给工具</h2><p>粘贴文章、口播稿或观点内容，系统负责拆解结构、组织画面并生成动画。</p><Link to="/create" className="button button-secondary">进入创作台 <ArrowRight size={16} /></Link></div>
          <div className="story-steps"><div><strong>选择</strong><span>用视频案例判断最终效果</span></div><div><strong>输入</strong><span>填写文案并调整内容结构</span></div><div><strong>导出</strong><span>生成可以发布的 MP4 视频</span></div></div>
        </section>

        <section className="pricing-section" id="pricing"><div className="section-heading pricing-heading"><h2>按你的创作频率选择</h2><p>四档价格一次看清，不设置复杂的功能陷阱。</p></div><PlanGrid /></section>

        <section className="final-cta"><h2>先从一个案例开始</h2><p>看清效果，选好风格，再把内容交给我们。</p><a href="#styles" className="button button-primary button-large">查看风格案例</a></section>
      </main>
      <footer className="site-footer"><div className="site-brand"><span className="site-brand-mark">A</span><span>AIfman 视频</span></div><p>让内容更容易被看见。</p><nav><Link to="/terms">用户协议</Link><Link to="/privacy">隐私政策</Link><Link to="/refund">退款政策</Link></nav></footer>

      {preview && <div className="commerce-modal" role="dialog" aria-modal="true" aria-label={`${preview.name}视频预览`} onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}><div className="video-dialog"><button className="modal-close video-close" onClick={() => setPreview(null)} aria-label="关闭"><X size={19} /></button><video ref={videoRef} src={preview.video} poster={preview.poster} controls playsInline /><div className="video-dialog-footer"><strong>{preview.name}</strong><button className="button button-primary" onClick={() => selectStyle(preview)}>使用这个风格 <Expand size={15} /></button></div></div></div>}
    </div>
  );
}
