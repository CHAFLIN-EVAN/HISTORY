import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface Props {
  onComplete: () => void;
}

const TERMS = [
  '夏', '商', '周', '春秋', '战国', '秦', '汉', '三国', '晋', '南北朝',
  '隋', '唐', '五代', '宋', '辽', '金', '西夏', '元', '明', '清',
  '禹', '汤', '武王', '周公', '孔子', '老子', '孙子', '屈原',
  '秦始皇', '刘邦', '项羽', '韩信', '张良', '汉武帝', '司马迁',
  '曹操', '诸葛亮', '关羽', '王羲之', '陶渊明',
  '唐太宗', '李白', '杜甫', '韩愈', '柳宗元',
  '苏轼', '王安石', '岳飞', '文天祥', '成吉思汗', '忽必烈',
  '朱元璋', '郑和', '王阳明', '张居正', '康熙', '乾隆', '林则徐',
  '夏朝', '商朝', '西周', '东周', '秦朝', '西汉', '东汉', '唐朝', '宋朝', '明朝', '清朝',
  '希腊', '罗马', '埃及', '波斯', '印度', '日本', '玛雅', '印加',
  '凯撒', '亚历山大', '汉尼拔', '奥古斯都', '君士坦丁',
  '金字塔', '长城', '丝绸之路', '大运河', '紫禁城', '兵马俑',
  '甲骨文', '青铜器', '造纸术', '火药', '印刷术', '指南针',
  '科举', '郡县', '分封', '三省六部', '行省', '八旗',
  '贞观之治', '开元盛世', '康乾盛世', '文景之治', '光武中兴',
  '安史之乱', '靖康之耻', '鸦片战争', '辛亥革命',
  '史记', '汉书', '资治通鉴', '永乐大典', '四库全书',
  '儒家', '道家', '法家', '墨家', '兵家', '佛', '禅',
];

interface Particle {
  x: number; y: number;
  text: string;
  opacity: number;
  targetOpacity: number;
  size: number;
  fadeSpeed: number;
}

export default function SplashScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<'build' | 'dissolve' | 'logo'>('build');
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const stageFrameRef = useRef(0);
  const pulseTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: 60 }, () => makeParticle(canvas!));

    let animId: number;

    function makeParticle(cvs: HTMLCanvasElement): Particle {
      return {
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        text: TERMS[Math.floor(Math.random() * TERMS.length)],
        opacity: 0,
        targetOpacity: 0.1 + Math.random() * 0.45,
        size: 9 + Math.random() * 20,
        fadeSpeed: 0.004 + Math.random() * 0.012,
      };
    }

    function draw() {
      frameRef.current++;
      const cvs = canvas!;

      ctx!.fillStyle = 'rgba(8,8,8,0.08)';
      ctx!.fillRect(0, 0, cvs.width, cvs.height);

      const ps = particlesRef.current;

      if (stage === 'build') {
        if (frameRef.current % 2 === 0 && ps.length < 280) {
          ps.push(makeParticle(cvs));
        }
        if (frameRef.current > 150) {
          setStage('dissolve');
          stageFrameRef.current = frameRef.current;
        }
      }

      if (stage === 'dissolve') {
        const elapsed = frameRef.current - stageFrameRef.current;
        if (elapsed > 70) {
          setStage('logo');
        }
      }

      for (const p of ps) {
        if (stage === 'build' && p.opacity < p.targetOpacity) {
          p.opacity += p.fadeSpeed;
        }
        if (stage === 'dissolve') {
          p.opacity -= 0.012;
          if (p.opacity < 0) p.opacity = 0;
        }
        if (p.opacity <= 0.005) continue;

        ctx!.font = `${p.size}px "PingFang SC", "Microsoft YaHei", "SimSun", serif`;
        ctx!.fillStyle = `rgba(200,195,185,${p.opacity})`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(p.text, p.x, p.y);
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    function onResize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [stage]);

  useGSAP(() => {
    if (stage !== 'logo' || !logoRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.fromTo(logoRef.current,
      { autoAlpha: 0, scale: 0.9, filter: 'blur(4px)' },
      { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1 }
    );

    tl.fromTo(ringRef.current,
      { autoAlpha: 0, scale: 0.8 },
      { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
      '<0.3'
    );

    tl.fromTo(textRef.current,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.5 },
      '<0.2'
    );

    pulseTweenRef.current = gsap.fromTo(pulseRef.current,
      { autoAlpha: 0.5, scale: 1 },
      { autoAlpha: 0, scale: 1.6, duration: 2.5, ease: 'none', repeat: -1, repeatDelay: 0.3 }
    );

    return () => {
      pulseTweenRef.current?.kill();
    };
  }, [stage]);

  useGSAP(() => {
    if (stage !== 'logo' || !ringRef.current || !textRef.current) return;

    const ringEl = ringRef.current;
    const textEl = textRef.current;

    function onEnter() {
      gsap.to(ringEl, { borderColor: 'rgba(255,255,255,0.15)', boxShadow: '0 0 120px rgba(255,255,255,0.04)', duration: 0.7 });
      gsap.to(textEl, { color: 'rgba(255,255,255,0.75)', duration: 0.5 });
    }
    function onLeave() {
      gsap.to(ringEl, { borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0px rgba(255,255,255,0)', duration: 0.7 });
      gsap.to(textEl, { color: 'rgba(255,255,255,0.5)', duration: 0.5 });
    }

    const btn = ringEl.closest('button');
    btn?.addEventListener('mouseenter', onEnter);
    btn?.addEventListener('mouseleave', onLeave);

    return () => {
      btn?.removeEventListener('mouseenter', onEnter);
      btn?.removeEventListener('mouseleave', onLeave);
    };
  }, [stage]);

  function handleEnter() {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => onComplete(),
    });

    tl.to(containerRef.current, { autoAlpha: 0, duration: 0.7 });
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50" style={{ background: '#080808' }}>
      <canvas ref={canvasRef} className="absolute inset-0" />

      {stage === 'logo' && (
        <div ref={logoRef} className="absolute inset-0 flex items-center justify-center z-10">
          <button onClick={handleEnter} className="group relative">
            <div className="absolute inset-0 rounded-full blur-3xl scale-150" style={{ background: 'rgba(255,255,255,0.015)' }} />

            <div
              ref={ringRef}
              className="relative w-44 h-44 rounded-full border flex items-center justify-center"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div ref={textRef} className="text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <div className="text-base tracking-[0.5em] font-light">
                  历史资料库
                </div>
                <div className="mt-2 text-sm tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  进 入
                </div>
              </div>
            </div>

            <div
              ref={pulseRef}
              className="absolute inset-0 rounded-full border pointer-events-none"
              style={{ borderColor: 'rgba(255,255,255,0.02)' }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
