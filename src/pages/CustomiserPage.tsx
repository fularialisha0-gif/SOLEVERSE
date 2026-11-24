import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, ShoppingBag, ZoomIn } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  formatINR,
  getDiscountedPrice,
  IMG_ANGLE_BACK,
  IMG_ANGLE_FRONT,
  IMG_ANGLE_SIDE,
  IMG_ANGLE_TOP,
  IMG_ECLIPSE,
  IMG_GLACIER_FRONT,
  IMG_GLACIER_HEEL,
  IMG_GLACIER_TOP,
  IMG_KINETIC,
  IMG_MONOLITH,
  IMG_STRATA,
} from '../data/catalog';
import { ShoePalette } from '../types';

interface CustomiserPageProps {
  initialProductId?: string;
}

const ANGLE_LABELS = ['Side View', 'Front View', 'Heel View', 'Top View'];

const SWATCH_COLORS = [
  { name: 'Obsidian', hex: '#14171f' },
  { name: 'Void Black', hex: '#090a0d' },
  { name: 'Electric Blue', hex: '#2563eb' },
  { name: 'Glacier Cyan', hex: '#60a5fa' },
  { name: 'Platinum', hex: '#cbd5e1' },
  { name: 'Chalk White', hex: '#f1f5f9' },
  { name: 'Titanium Sand', hex: '#a89f91' },
  { name: 'Carbon Slate', hex: '#475569' },
  { name: 'Steel Silver', hex: '#94a3b8' },
];

const PRESETS: { label: string; imageSet: string[]; palette: ShoePalette }[] = [
  {
    label: 'Obsidian Cobalt',
    imageSet: [IMG_ANGLE_SIDE, IMG_ANGLE_FRONT, IMG_ANGLE_BACK, IMG_ANGLE_TOP],
    palette: {
      upper: '#14171f',
      midsole: '#262b36',
      cage: '#cbd5e1',
      outsole: '#2563eb',
      laces: '#111318',
      finish: 'metallic',
    },
  },
  {
    label: 'Glacier White & Blue',
    imageSet: [IMG_KINETIC, IMG_GLACIER_FRONT, IMG_GLACIER_HEEL, IMG_GLACIER_TOP],
    palette: {
      upper: '#e5e9f0',
      midsole: '#1d4ed8',
      cage: '#cbd5e1',
      outsole: '#0f172a',
      laces: '#2563eb',
      finish: 'matte',
    },
  },
  {
    label: 'Platinum Monolith',
    imageSet: [IMG_MONOLITH, IMG_GLACIER_FRONT, IMG_GLACIER_HEEL, IMG_GLACIER_TOP],
    palette: {
      upper: '#e2e8f0',
      midsole: '#f1f5f9',
      cage: '#94a3b8',
      outsole: '#090a0d',
      laces: '#f8fafc',
      finish: 'metallic',
    },
  },
  {
    label: 'Eclipse Liquid Chrome',
    imageSet: [IMG_ECLIPSE, IMG_ANGLE_FRONT, IMG_ANGLE_BACK, IMG_ANGLE_TOP],
    palette: {
      upper: '#090a0d',
      midsole: '#60a5fa',
      cage: '#f1f5f9',
      outsole: '#2563eb',
      laces: '#090a0d',
      finish: 'chrome',
    },
  },
];

type ZoneKey = 'upper' | 'midsole' | 'cage' | 'outsole' | 'laces';

const ZONES: { key: ZoneKey; label: string }[] = [
  { key: 'upper', label: 'Upper Knit / Leather' },
  { key: 'midsole', label: 'Sculpted Midsole' },
  { key: 'cage', label: 'Metallic Heel Cage' },
  { key: 'outsole', label: 'Outsole & Air Cushion' },
  { key: 'laces', label: 'Lacing System' },
];

export const CustomiserPage: React.FC<CustomiserPageProps> = ({ initialProductId }) => {
  const { products, addToCart } = useStore();
  const [baseId, setBaseId] = useState<string>(initialProductId || products[0]?.id || '');

  const baseProduct = useMemo(
    () => products.find((p) => p.id === baseId) || products[0],
    [products, baseId]
  );

  const defaultPalette: ShoePalette = baseProduct?.shoePalette || PRESETS[0].palette;

  const [palette, setPalette] = useState<ShoePalette>(defaultPalette);
  const [overrideImages, setOverrideImages] = useState<string[] | null>(null);
  const [activeAngleIdx, setActiveAngleIdx] = useState<number>(0);
  const [zoomActive, setZoomActive] = useState<boolean>(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [activeZone, setActiveZone] = useState<ZoneKey>('upper');
  const [selectedSize, setSelectedSize] = useState<string>('UK 8');

  const studioImages = useMemo(() => {
    if (overrideImages && overrideImages.length === 4) return overrideImages;
    if (baseProduct?.images && baseProduct.images.length >= 4) return baseProduct.images.slice(0, 4);
    const first = baseProduct?.images?.[0] || IMG_STRATA;
    return [first, IMG_ANGLE_FRONT, IMG_ANGLE_BACK, IMG_ANGLE_TOP];
  }, [baseProduct, overrideImages]);

  const handleSelectBase = (id: string) => {
    setBaseId(id);
    setOverrideImages(null);
    setActiveAngleIdx(0);
    const found = products.find((p) => p.id === id);
    if (found?.shoePalette) {
      setPalette(found.shoePalette);
    }
  };

  const handleReset = () => {
    setOverrideImages(null);
    setActiveAngleIdx(0);
    setZoomActive(false);
    setPalette(baseProduct?.shoePalette || PRESETS[0].palette);
  };

  const handleAddCustom = () => {
    if (!baseProduct) return;
    addToCart(baseProduct, selectedSize, `Bespoke (${palette.finish || 'metallic'})`, 1, palette);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const price = baseProduct
    ? getDiscountedPrice(baseProduct.priceInr, baseProduct.discountPercent)
    : 18999;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD] mb-1">
            Bespoke Footwear Atelier
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Craft Your Bespoke Pair
          </h1>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#111318] hover:bg-white/5 border border-white/15 text-xs font-medium text-[#A1AAB8] hover:text-white rounded-lg transition-colors self-start md:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Design</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Photorealistic Multi-Angle Studio Stage */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-[#A1AAB8]">
              <span className="font-medium text-white">
                {baseProduct?.name || 'SOLEVERSE Studio Edition'}
              </span>
              <span className="mx-2 text-[#64748B]">·</span>
              <span>{ANGLE_LABELS[activeAngleIdx]}</span>
            </div>
            <button
              onClick={() => setZoomActive((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                zoomActive
                  ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#93C5FD]'
                  : 'bg-[#111318] border-white/10 text-[#A1AAB8] hover:text-white'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{zoomActive ? 'Reset Zoom' : 'Inspect Materials'}</span>
            </button>
          </div>

          <div
            onMouseMove={handleMouseMove}
            onClick={() => setZoomActive((v) => !v)}
            className={`relative aspect-[4/3] bg-[#0B0C10] border border-white/10 rounded-2xl overflow-hidden ${
              zoomActive ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          >
            {/* Dynamic Studio Lighting Backdrop matching selected outsole & upper bespoke colors */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 transition-all duration-500"
              style={{
                background: `radial-gradient(circle at 65% 40%, ${palette.outsole}33, transparent 58%), radial-gradient(circle at 30% 65%, ${palette.cage}22, transparent 55%)`,
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={studioImages[activeAngleIdx]}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.25 }}
                className="relative z-10 w-full h-full"
              >
                <img
                  src={studioImages[activeAngleIdx]}
                  alt={`${baseProduct?.name || 'Sneaker'} — ${ANGLE_LABELS[activeAngleIdx]}`}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: zoomActive ? 'scale(2.05)' : 'scale(1)',
                    transformOrigin: zoomActive ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : '50% 50%',
                    filter:
                      palette.finish === 'chrome'
                        ? 'contrast(1.08) saturate(1.12)'
                        : palette.finish === 'matte'
                          ? 'contrast(0.96) brightness(0.98)'
                          : palette.finish === 'suede'
                            ? 'contrast(0.98) sepia(0.06)'
                            : 'none',
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out"
                />
                {/* Soft Bespoke Trim Glow Tint */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-color opacity-25 transition-colors duration-300"
                  style={{ backgroundColor: palette.outsole }}
                />
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-5 pb-3.5 text-xs text-[#CBD5E1]">
              <span className="capitalize">Finish: {palette.finish || 'metallic'}</span>
              <span className="text-[#94A3B8]">Click image to zoom into stitching & textures</span>
            </div>
          </div>

          {/* 4-Angle Thumbnail Selector */}
          <div className="grid grid-cols-4 gap-3">
            {studioImages.map((src, idx) => (
              <button
                key={`${ANGLE_LABELS[idx]}-${idx}`}
                onClick={() => {
                  setActiveAngleIdx(idx);
                  setZoomActive(false);
                }}
                className={`rounded-xl overflow-hidden border bg-[#111318] text-left transition-all cursor-pointer ${
                  activeAngleIdx === idx
                    ? 'border-[#2563EB] ring-1 ring-[#2563EB]/60'
                    : 'border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="aspect-[4/3] bg-[#090A0D] overflow-hidden">
                  <img
                    src={src}
                    alt={ANGLE_LABELS[idx]}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-2.5 py-2 border-t border-white/5 text-[11px] font-medium text-white truncate">
                  {ANGLE_LABELS[idx]}
                </div>
              </button>
            ))}
          </div>

          {/* Selected Palette Readout */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-medium text-[#A1AAB8]">Active Bespoke Specification</span>
            <div className="flex flex-wrap items-center gap-4">
              {ZONES.map((z) => (
                <div key={z.key} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: palette[z.key] }}
                  />
                  <span className="text-[#CBD5E1]">{z.label.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Customisation Panel */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Base Silhouette */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1AAB8]">
              1. Base Silhouette
            </label>
            <select
              value={baseId}
              onChange={(e) => handleSelectBase(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatINR(getDiscountedPrice(p.priceInr, p.discountPercent))})
                </option>
              ))}
            </select>
          </div>

          {/* Curated Studio Editions */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#A1AAB8]">
              2. Studio Colorway References
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setPalette(preset.palette);
                    setOverrideImages(preset.imageSet);
                    setActiveAngleIdx(0);
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-[#090A0D] hover:bg-white/5 border border-white/10 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <div className="flex -space-x-1 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-white/25"
                      style={{ backgroundColor: preset.palette.upper }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white/25"
                      style={{ backgroundColor: preset.palette.outsole }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zone Selection */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#A1AAB8]">
              3. Customise Material Zone Colors
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ZONES.map((z) => (
                <button
                  key={z.key}
                  onClick={() => setActiveZone(z.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    activeZone === z.key
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'bg-[#090A0D] border-white/10 text-[#A1AAB8] hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30"
                    style={{ backgroundColor: palette[z.key] }}
                  />
                  <span>{z.label}</span>
                </button>
              ))}
            </div>

            {/* Swatches + Custom Color Picker */}
            <div className="p-4 bg-[#090A0D] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A1AAB8]">
                  Editing:{' '}
                  <strong className="text-white">
                    {ZONES.find((z) => z.key === activeZone)?.label}
                  </strong>
                </span>
                <label className="inline-flex items-center gap-2 text-xs text-[#93C5FD] cursor-pointer">
                  <span>Custom Hex</span>
                  <input
                    type="color"
                    value={palette[activeZone]}
                    onChange={(e) =>
                      setPalette((prev) => ({ ...prev, [activeZone]: e.target.value }))
                    }
                    className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                {SWATCH_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() =>
                      setPalette((prev) => ({ ...prev, [activeZone]: c.hex }))
                    }
                    className={`h-8 rounded-lg border transition-transform hover:scale-105 cursor-pointer ${
                      palette[activeZone].toLowerCase() === c.hex.toLowerCase()
                        ? 'border-[#2563EB] ring-2 ring-[#2563EB]/50'
                        : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Material Finish */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#A1AAB8]">
              4. Upper Material Finish
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(['matte', 'metallic', 'suede', 'chrome'] as const).map((fin) => (
                <button
                  key={fin}
                  onClick={() => setPalette((prev) => ({ ...prev, finish: fin }))}
                  className={`py-2 text-xs font-medium rounded-lg border capitalize transition-colors cursor-pointer ${
                    palette.finish === fin
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'bg-[#090A0D] border-white/10 text-[#A1AAB8] hover:text-white'
                  }`}
                >
                  {fin}
                </button>
              ))}
            </div>
          </div>

          {/* Size & Add to Bag */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A1AAB8]">Size:</span>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="px-3 py-1.5 bg-[#090A0D] border border-white/10 rounded-lg text-xs font-mono-num text-white cursor-pointer"
                >
                  {(baseProduct?.sizes || ['UK 7', 'UK 8', 'UK 9', 'UK 10']).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-[#64748B]">Bespoke Total</span>
                <span className="font-mono-num text-xl font-bold text-white">{formatINR(price)}</span>
              </div>
            </div>

            <button
              onClick={handleAddCustom}
              className="w-full py-3.5 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Customised Pair to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
