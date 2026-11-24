import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sliders,
  Star,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  formatINR,
  getDiscountedPrice,
  IMG_ANGLE_BACK,
  IMG_ANGLE_FRONT,
  IMG_ANGLE_SIDE,
  IMG_ANGLE_TOP,
  IMG_GLACIER_FRONT,
  IMG_GLACIER_HEEL,
  IMG_GLACIER_TOP,
} from '../data/catalog';
import { ProductCard } from '../components/ProductCard';
import { AppRoute } from '../types';

interface ProductDetailPageProps {
  productId: string;
  navigate: (route: AppRoute) => void;
}

const ANGLE_LABELS: { label: string; caption: string }[] = [
  { label: 'Side View', caption: 'Lateral Profile & Construction' },
  { label: 'Front View', caption: 'Toe Box & Lacing System' },
  { label: 'Heel View', caption: 'Sculpted Counter & Air Cushion' },
  { label: 'Top View', caption: 'Anatomical Last & Collar' },
];

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, navigate }) => {
  const { products, wishlist, toggleWishlist, addToCart } = useStore();

  const product = useMemo(
    () => products.find((p) => p.id === productId) || products[0],
    [products, productId]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [isHoveringMain, setIsHoveringMain] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes[2] || product?.sizes[0] || 'UK 8'
  );
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors[0] || 'Obsidian');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveImageIdx(0);
    setZoomActive(false);
    if (product) {
      setSelectedSize(product.sizes[2] || product.sizes[0] || 'UK 8');
      setSelectedColor(product.colors[0] || 'Obsidian');
    }
  }, [product?.id]);

  // Ensure every product displays 4 distinct photorealistic studio angles: Side, Front, Heel, Top
  const galleryPhotos = useMemo(() => {
    if (!product) return [];
    const primaryLower = (product.images[0] || '').toLowerCase();
    const isLightColorway =
      primaryLower.includes('kinetic') ||
      primaryLower.includes('monolith') ||
      primaryLower.includes('strata');

    const fallbackAngles = isLightColorway
      ? [IMG_ANGLE_SIDE, IMG_GLACIER_FRONT, IMG_GLACIER_HEEL, IMG_GLACIER_TOP]
      : [IMG_ANGLE_SIDE, IMG_ANGLE_FRONT, IMG_ANGLE_BACK, IMG_ANGLE_TOP];

    const seen = new Set<string>();
    const picked: string[] = [];

    const first = product.images[0] || fallbackAngles[0];
    picked.push(first);
    seen.add(first);

    for (let i = 1; i < 4; i++) {
      const provided = product.images[i];
      const fallback = fallbackAngles[i];
      const candidate =
        provided && !seen.has(provided)
          ? provided
          : !seen.has(fallback)
            ? fallback
            : fallbackAngles.find((u) => !seen.has(u)) || fallback;
      picked.push(candidate);
      seen.add(candidate);
    }

    return ANGLE_LABELS.map((meta, idx) => ({
      src: picked[idx],
      label: meta.label,
      caption: meta.caption,
    }));
  }, [product]);

  if (!product) return null;

  const isSaved = wishlist.includes(product.id);
  const finalPrice = getDiscountedPrice(product.priceInr, product.discountPercent);
  const savings = product.priceInr - finalPrice;
  const activePhoto = galleryPhotos[activeImageIdx] || galleryPhotos[0];

  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.featured))
    .slice(0, 4);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const computedScale = zoomActive ? 2.1 : isHoveringMain ? 1.05 : 1;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-14 space-y-16">
      <button
        onClick={() => navigate({ page: 'collections' })}
        className="inline-flex items-center gap-2 text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collections</span>
      </button>

      {/* Main Split PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Sticky 4-Angle Studio Photography Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-[#A1AAB8] flex items-center gap-2">
              <span className="font-mono-num text-[#22D3EE]">
                0{activeImageIdx + 1} / 04
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-white font-medium">{activePhoto?.label}</span>
              <span className="hidden sm:inline text-[#64748B]">— {activePhoto?.caption}</span>
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
              <span>{zoomActive ? 'Reset Zoom' : 'Detail Zoom'}</span>
            </button>
          </div>

          {/* Primary Angle Stage with Smooth Transition & Cursor-Tracked Zoom */}
          <div
            onMouseEnter={() => setIsHoveringMain(true)}
            onMouseLeave={() => setIsHoveringMain(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setZoomActive((v) => !v)}
            className={`relative aspect-[4/3] bg-[#0B0C10] border border-white/10 rounded-2xl overflow-hidden ${
              zoomActive ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePhoto?.src}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <img
                  src={activePhoto?.src}
                  alt={`${product.name} — ${activePhoto?.label}`}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(${computedScale})`,
                    transformOrigin: zoomActive ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : '50% 50%',
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out"
                />
              </motion.div>
            </AnimatePresence>

            {/* Bottom Subtle Contrast Scrim & Zoom Hint */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-10 flex items-end justify-between px-5 pb-3.5 text-[11px] text-[#CBD5E1]">
              <span>{product.name}</span>
              <span className="text-[#94A3B8]">
                {zoomActive ? 'Move cursor to inspect stitching & materials · Click to reset' : 'Click image for detail zoom'}
              </span>
            </div>
          </div>

          {/* 4 Clickable Angle Thumbnails: Side, Front, Heel, Top */}
          <div className="grid grid-cols-4 gap-3">
            {galleryPhotos.map((photo, idx) => {
              const isActive = activeImageIdx === idx;
              return (
                <button
                  key={`${photo.label}-${idx}`}
                  onClick={() => {
                    setActiveImageIdx(idx);
                    setZoomActive(false);
                  }}
                  className={`group text-left rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer bg-[#111318] ${
                    isActive
                      ? 'border-[#2563EB] ring-1 ring-[#2563EB]/60'
                      : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/25'
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#090A0D]">
                    <img
                      src={photo.src}
                      alt={`${product.name} — ${photo.label}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-2.5 py-2 border-t border-white/5 flex items-center justify-between gap-1">
                    <span
                      className={`text-[11px] font-medium truncate ${
                        isActive ? 'text-white' : 'text-[#A1AAB8]'
                      }`}
                    >
                      {photo.label}
                    </span>
                    <span className="font-mono-num text-[10px] text-[#64748B] shrink-0">
                      0{idx + 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-white/10 pb-5">
            <div className="flex items-center justify-between text-xs text-[#A1AAB8]">
              <span>{product.categories.join(' · ')}</span>
              <span className="inline-flex items-center gap-1 text-white tabular-nums">
                <Star className="w-3.5 h-3.5 text-[#3B82F6] fill-[#3B82F6]" />
                {product.rating.toFixed(1)} ({product.reviewCount || 48})
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono-num text-2xl font-bold text-white">
                {formatINR(finalPrice)}
              </span>
              {product.discountPercent > 0 && (
                <>
                  <span className="font-mono-num text-sm text-[#64748B] line-through">
                    {formatINR(product.priceInr)}
                  </span>
                  <span className="text-xs font-medium text-[#22D3EE]">
                    Save {formatINR(savings)} ({product.discountPercent}% off)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-[#64748B]">Inclusive of all taxes · Free shipping above ₹12,000</p>
          </div>

          {/* Colorway Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1AAB8]">Colorway</span>
              <span className="text-white font-medium">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedColor === color
                      ? 'bg-[#2563EB]/20 border-[#2563EB] text-white'
                      : 'bg-[#090A0D] border-white/10 text-[#A1AAB8] hover:text-white'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* UK Size Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1AAB8]">Select Size (UK)</span>
              <span className="text-white font-mono-num">{selectedSize}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2.5 text-xs font-mono-num font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedSize === size
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'bg-[#090A0D] border-white/10 text-[#A1AAB8] hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Availability */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="inline-flex items-center border border-white/10 rounded-lg bg-[#090A0D]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-[#A1AAB8] hover:text-white cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-mono-num text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                className="p-2.5 text-[#A1AAB8] hover:text-white cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-[#A1AAB8] inline-flex items-center gap-1.5 tabular-nums">
              <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
              {product.stock > 0 ? `${product.stock} pairs in studio stock` : 'Out of stock'}
            </span>
          </div>

          {/* Primary Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, selectedSize, selectedColor, quantity)}
                className="flex-1 py-3.5 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock > 0 ? 'Add to Bag' : 'Out of Stock'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`px-4 py-3.5 rounded-lg border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#93C5FD]'
                    : 'bg-[#090A0D] border-white/15 text-[#A1AAB8] hover:text-white'
                }`}
                aria-label="Save to wishlist"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => navigate({ page: 'customiser', productId: product.id })}
              className="w-full py-3 px-4 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-[#F4F6FA] text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span>Customise Colorway in Bespoke Studio</span>
            </button>
          </div>

          {/* Description & Technical Specs */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-2">
                Craftsmanship & Materials
              </h3>
              <p className="text-sm text-[#A1AAB8] leading-relaxed">{product.description}</p>
            </div>

            {product.specs && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-2.5">
                  Technical Specifications
                </h3>
                <dl className="divide-y divide-white/5 text-xs border border-white/10 rounded-lg bg-[#090A0D]">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-4 px-3.5 py-2.5">
                      <dt className="capitalize text-[#64748B]">{key}</dt>
                      <dd className="text-right text-[#F4F6FA]">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <h2 className="font-display text-2xl font-bold text-white">Related Silhouettes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {relatedProducts.map((rel) => (
            <ProductCard
              key={rel.id}
              product={rel}
              onSelect={(id) => {
                setActiveImageIdx(0);
                setZoomActive(false);
                navigate({ page: 'product', productId: id });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
