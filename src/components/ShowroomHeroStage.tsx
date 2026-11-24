import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { IMG_HERO_GLACIER, IMG_HERO_SHOWROOM, IMG_SHOWCASE_HERO } from '../data/catalog';

interface HeroSneakerTarget {
  id: string;
  name: string;
  subtitle: string;
  priceFormatted: string;
}

interface ShowroomHeroStageProps {
  primarySneaker: HeroSneakerTarget;
  secondarySneaker: HeroSneakerTarget;
  onInspect: (productId: string) => void;
  onPointerShift?: (x: number, y: number) => void;
}

/**
 * Extracts pure pitch-black studio void outside each sneaker silhouette via an
 * outside-in edge flood-fill so internal dark knit/leather pixels remain 100% solid
 * against the architectural 3D studio environment.
 */
function useExtractedSneakerCutout(src: string): string | null {
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (!active) return;
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const total = w * h;
        const visited = new Uint8Array(total);
        const isBg = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;

        const isDarkVoid = (idx: number) => {
          const p = idx * 4;
          return data[p] < 15 && data[p + 1] < 15 && data[p + 2] < 18;
        };

        const enqueue = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          const idx = y * w + x;
          if (visited[idx]) return;
          visited[idx] = 1;
          if (isDarkVoid(idx)) {
            isBg[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < w; x++) {
          enqueue(x, 0);
          enqueue(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          enqueue(0, y);
          enqueue(w - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          const x = idx % w;
          const y = (idx - x) / w;
          enqueue(x + 1, y);
          enqueue(x - 1, y);
          enqueue(x, y + 1);
          enqueue(x, y - 1);
        }

        for (let i = 0; i < total; i++) {
          if (isBg[i]) {
            data[i * 4 + 3] = 0;
          } else {
            const x = i % w;
            const y = (i - x) / w;
            let bgNeighbors = 0;
            if (x > 0 && isBg[i - 1]) bgNeighbors++;
            if (x < w - 1 && isBg[i + 1]) bgNeighbors++;
            if (y > 0 && isBg[i - w]) bgNeighbors++;
            if (y < h - 1 && isBg[i + w]) bgNeighbors++;
            if (bgNeighbors > 0) {
              const p = i * 4;
              const lum = Math.max(data[p], data[p + 1], data[p + 2]);
              data[p + 3] = Math.min(255, Math.max(40, Math.round((lum / 28) * 255)));
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        if (active) {
          setCutoutUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Fallback gracefully to masked photo
      }
    };

    return () => {
      active = false;
    };
  }, [src]);

  return cutoutUrl;
}

export const ShowroomHeroStage: React.FC<ShowroomHeroStageProps> = ({
  primarySneaker,
  secondarySneaker,
  onInspect,
  onPointerShift,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const obsidianCutout = useExtractedSneakerCutout(IMG_HERO_SHOWROOM);
  const glacierCutout = useExtractedSneakerCutout(IMG_HERO_GLACIER);

  const [hoveredTarget, setHoveredTarget] = useState<'primary' | 'secondary' | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 22, mass: 0.65 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 22, mass: 0.65 });

  const stageRotateY = useTransform(springX, [-0.5, 0.5], [-7, 7]);
  const stageRotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);

  const frontShiftX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const frontShiftY = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  const rearShiftX = useTransform(springX, [-0.5, 0.5], [14, -14]);
  const rearShiftY = useTransform(springY, [-0.5, 0.5], [8, -8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    if (!prefersReducedMotion) {
      mouseX.set(nx);
      mouseY.set(ny);
    }
    onPointerShift?.(nx, ny);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredTarget(null);
    onPointerShift?.(0, 0);
  };

  const obsidianSrc = obsidianCutout || IMG_HERO_SHOWROOM || IMG_SHOWCASE_HERO;
  const glacierSrc = glacierCutout || IMG_HERO_GLACIER;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[430px] sm:min-h-[540px] lg:min-h-[630px] flex items-center justify-center select-none"
      style={{ perspective: '1500px' }}
    >
      {/* Subtle Blue & Silver Architectural Lighting Pool (Zero circular ring or bare platform) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 55% at 62% 52%, rgba(37, 99, 235, 0.22), transparent 65%), radial-gradient(ellipse 52% 45% at 32% 42%, rgba(96, 165, 250, 0.14), transparent 60%)',
        }}
      />

      {/* Interactive Twin-Sneaker 3D Depth Stage */}
      <motion.div
        style={{
          rotateX: prefersReducedMotion ? 0 : stageRotateX,
          rotateY: prefersReducedMotion ? 0 : stageRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-[400px] sm:h-[510px] lg:h-[600px] flex items-center justify-center"
      >
        {/* SNEAKER 2 (Rear-Left / Elevated Counter-Depth) — Alabaster Platinum & Electric Blue */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : rearShiftX,
            y: prefersReducedMotion ? 0 : rearShiftY,
            transform: 'translateZ(20px)',
          }}
          className="absolute left-0 sm:left-2 lg:left-0 top-3 sm:top-4 lg:top-6 w-[60%] sm:w-[56%] max-w-[430px] z-10"
        >
          <motion.button
            type="button"
            onClick={() => onInspect(secondarySneaker.id)}
            onMouseEnter={() => setHoveredTarget('secondary')}
            onFocus={() => setHoveredTarget('secondary')}
            animate={prefersReducedMotion ? undefined : { y: [4, -8, 4] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
            className="group relative w-full text-left cursor-pointer focus:outline-none"
            aria-label={`Inspect ${secondarySneaker.name}`}
          >
            <img
              src={glacierSrc}
              alt={`${secondarySneaker.name} — Platinum & Electric Blue Knit Runner`}
              referrerPolicy="no-referrer"
              style={
                !glacierCutout
                  ? {
                      maskImage:
                        'radial-gradient(ellipse 84% 78% at 50% 50%, black 55%, transparent 98%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 84% 78% at 50% 50%, black 55%, transparent 98%)',
                    }
                  : undefined
              }
              className="w-full h-auto max-h-[250px] sm:max-h-[320px] lg:max-h-[360px] object-contain drop-shadow-[0_24px_34px_rgba(37,99,235,0.22)] group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
            {/* Glossy Studio Mirror Reflection under Sneaker 2 */}
            <img
              src={glacierSrc}
              alt=""
              aria-hidden="true"
              className="pointer-events-none w-full max-h-[90px] sm:max-h-[115px] object-contain -mt-6 sm:-mt-8 scale-y-[-0.42] opacity-[0.14] blur-[2px]"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 72%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 72%)',
              }}
            />
          </motion.button>
        </motion.div>

        {/* SNEAKER 1 (Foreground-Right Primary Hero Anchor) — Obsidian Carbon & Electric Blue */}
        <motion.div
          style={{
            x: prefersReducedMotion ? 0 : frontShiftX,
            y: prefersReducedMotion ? 0 : frontShiftY,
            transform: 'translateZ(65px)',
          }}
          className="absolute right-0 sm:right-2 lg:right-0 bottom-10 sm:bottom-12 lg:bottom-14 w-[70%] sm:w-[66%] max-w-[520px] z-20"
        >
          <motion.button
            type="button"
            onClick={() => onInspect(primarySneaker.id)}
            onMouseEnter={() => setHoveredTarget('primary')}
            onFocus={() => setHoveredTarget('primary')}
            animate={prefersReducedMotion ? undefined : { y: [-8, 6, -8] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            className="group relative w-full text-left cursor-pointer focus:outline-none"
            aria-label={`Inspect ${primarySneaker.name}`}
          >
            <img
              src={obsidianSrc}
              alt={`${primarySneaker.name} — Obsidian Carbon & Electric Blue Sneaker`}
              referrerPolicy="no-referrer"
              style={
                !obsidianCutout
                  ? {
                      maskImage:
                        'radial-gradient(ellipse 84% 80% at 50% 50%, black 56%, transparent 98%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 84% 80% at 50% 50%, black 56%, transparent 98%)',
                    }
                  : undefined
              }
              className="w-full h-auto max-h-[290px] sm:max-h-[380px] lg:max-h-[430px] object-contain drop-shadow-[0_32px_44px_rgba(37,99,235,0.34)] group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
            {/* Soft Basalt Contact Shadow + Mirrored Floor Reflection under Sneaker 1 */}
            <div
              aria-hidden="true"
              className="mx-auto w-[72%] h-5 -mt-3 rounded-full bg-black/80 blur-lg"
            />
            <img
              src={obsidianSrc}
              alt=""
              aria-hidden="true"
              className="pointer-events-none w-full max-h-[100px] sm:max-h-[125px] object-contain -mt-6 sm:-mt-8 scale-y-[-0.42] opacity-[0.18] blur-[2px]"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 72%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 72%)',
              }}
            />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Interactive Twin-Model Selector Callout Strip (Bottom Right) */}
      <div className="absolute bottom-1 sm:bottom-2 right-0 sm:right-2 z-30 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onInspect(secondarySneaker.id)}
          onMouseEnter={() => setHoveredTarget('secondary')}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
            hoveredTarget === 'secondary'
              ? 'bg-[#121826] border-[#2563EB]'
              : 'bg-[#0C0F16]/90 border-white/15 hover:border-white/30'
          }`}
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#93C5FD]">
              {secondarySneaker.subtitle}
            </p>
            <p className="text-xs font-semibold text-white truncate max-w-[165px]">
              {secondarySneaker.name} ·{' '}
              <span className="font-mono-num text-[#CBD5E1]">{secondarySneaker.priceFormatted}</span>
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#93C5FD] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onInspect(primarySneaker.id)}
          onMouseEnter={() => setHoveredTarget('primary')}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
            hoveredTarget === 'primary'
              ? 'bg-[#121826] border-[#2563EB]'
              : 'bg-[#0C0F16]/90 border-[#2563EB]/45 hover:border-[#2563EB]'
          }`}
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#60A5FA]">
              {primarySneaker.subtitle}
            </p>
            <p className="text-xs font-semibold text-white truncate max-w-[175px]">
              {primarySneaker.name} ·{' '}
              <span className="font-mono-num text-[#CBD5E1]">{primarySneaker.priceFormatted}</span>
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
        </button>
      </div>
    </div>
  );
};
