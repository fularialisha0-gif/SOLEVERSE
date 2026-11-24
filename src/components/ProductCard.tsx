import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Product } from '../types';
import { formatINR, getDiscountedPrice } from '../data/catalog';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
}) => {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[2] || product.sizes[0] || 'UK 8'
  );

  const isSaved = wishlist.includes(product.id);
  const finalPrice = getDiscountedPrice(product.priceInr, product.discountPercent);
  const outOfStock = product.stock <= 0;

  const primarySrc = product.images[0];
  const secondarySrc = product.images[1] && product.images[1] !== primarySrc ? product.images[1] : null;
  const activeSrc = hovered && secondarySrc ? secondarySrc : primarySrc;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(
      product,
      selectedSize || product.sizes[2] || product.sizes[0] || 'UK 8',
      product.colors[0] || 'Obsidian',
      1
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      onClick={() => onSelect(product.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group bg-[#111318] border border-white/10 rounded-xl overflow-hidden hover:border-[#2563EB]/55 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] cursor-pointer flex flex-col min-w-0"
    >
      {/* Unified 1:1 Studio Image Frame with object-contain so complete sneaker stays visible */}
      <div className="relative aspect-square bg-[#080A0F] overflow-hidden flex items-center justify-center p-2.5 sm:p-4">
        {!imgError && activeSrc ? (
          <img
            src={activeSrc}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#131722] to-[#090A0D] p-3 text-center rounded-lg">
            <span className="font-display text-xs sm:text-sm font-semibold text-white/80 line-clamp-2">
              {product.name}
            </span>
            <span className="text-[10px] text-[#A1AAB8] mt-1">{product.category}</span>
          </div>
        )}

        {/* Top-right Wishlist icon button */}
        <button
          onClick={handleWishlist}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
            isSaved
              ? 'bg-[#2563EB] border-[#2563EB] text-white'
              : 'bg-[#090A0D]/85 border-white/15 text-[#A1AAB8] hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Quiet Single Discount Indicator */}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono-num font-medium bg-[#090A0D]/90 text-[#93C5FD] border border-[#2563EB]/40 rounded">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Consistent Card Metadata & Quick Actions */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-xs text-[#A1AAB8]">
            <span className="truncate">{product.category}</span>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 tabular-nums shrink-0 text-[#E2E8F0]">
              <Star className="w-3 h-3 text-[#3B82F6] fill-[#3B82F6]" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          <h3 className="font-display text-[13px] sm:text-[15px] font-semibold leading-snug text-[#F4F6FA] group-hover:text-white line-clamp-1">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-[10px] sm:text-xs text-[#64748B] truncate">{product.colors[0]}</p>
            <select
              value={selectedSize}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedSize(e.target.value);
              }}
              aria-label={`Select size for ${product.name}`}
              className="px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono-num bg-[#090A0D] border border-white/10 rounded text-[#CBD5E1] focus:outline-none focus:border-[#2563EB] cursor-pointer shrink-0"
            >
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="font-mono-num text-[13px] sm:text-[15px] font-semibold text-white">
              {formatINR(finalPrice)}
            </span>
            {product.discountPercent > 0 && (
              <span className="font-mono-num text-[10px] sm:text-xs text-[#64748B] line-through">
                {formatINR(product.priceInr)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={outOfStock}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg bg-white/5 hover:bg-[#2563EB] text-[#F4F6FA] hover:text-white border border-white/10 hover:border-[#2563EB] transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{outOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
