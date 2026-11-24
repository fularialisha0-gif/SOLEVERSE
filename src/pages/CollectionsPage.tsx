import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { getDiscountedPrice } from '../data/catalog';
import { AppRoute } from '../types';

interface CollectionsPageProps {
  initialCategory?: string;
  initialQuery?: string;
  navigate: (route: AppRoute) => void;
}

type SortOption = 'featured' | 'popularity' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

const SIZE_FILTERS = ['All Sizes', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  initialCategory,
  initialQuery,
  navigate,
}) => {
  const { products, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedSize, setSelectedSize] = useState<string>('All Sizes');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'All');
  }, [initialCategory]);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const catMatch =
        selectedCategory === 'All' ||
        p.category === selectedCategory ||
        p.categories.includes(selectedCategory as never);
      const sizeMatch = selectedSize === 'All Sizes' || p.sizes.includes(selectedSize);
      const qMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.colors.some((c) => c.toLowerCase().includes(q));
      const discMatch = !onlyDiscounted || p.discountPercent > 0;
      return catMatch && sizeMatch && qMatch && discMatch;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort(
        (a, b) =>
          getDiscountedPrice(a.priceInr, a.discountPercent) -
          getDiscountedPrice(b.priceInr, b.discountPercent)
      );
    }
    if (sortBy === 'price-desc') {
      return [...list].sort(
        (a, b) =>
          getDiscountedPrice(b.priceInr, b.discountPercent) -
          getDiscountedPrice(a.priceInr, a.discountPercent)
      );
    }
    if (sortBy === 'popularity') {
      return [...list].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    if (sortBy === 'newest') {
      return [...list].sort((a, b) => {
        const aNew = a.categories.includes('New Arrivals') ? 1 : 0;
        const bNew = b.categories.includes('New Arrivals') ? 1 : 0;
        return bNew - aNew || b.rating - a.rating;
      });
    }
    if (sortBy === 'rating') {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [onlyDiscounted, products, searchQuery, selectedCategory, selectedSize, sortBy]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 border-b border-white/10 pb-5 sm:pb-7">
        <div className="space-y-1.5">
          <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD]">SOLEVERSE Catalog</p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white">
            {selectedCategory === 'All' ? 'All Footwear Collections' : selectedCategory}
          </h1>
          <p className="text-xs sm:text-sm text-[#A1AAB8] tabular-nums">
            Showing {filteredProducts.length} of {products.length} silhouettes · Prices in INR
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or color..."
              className="w-full sm:w-64 pl-10 pr-8 py-2.5 bg-[#111318] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#A1AAB8] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort footwear"
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-[#111318] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="popularity">Popularity</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                  : 'bg-[#111318] border-white/10 text-[#A1AAB8] hover:text-white'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'bg-[#111318] border-white/10 text-[#A1AAB8] hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#A1AAB8] cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={onlyDiscounted}
              onChange={(e) => setOnlyDiscounted(e.target.checked)}
              className="accent-[#2563EB] rounded"
            />
            <span>Special Offers Only</span>
          </label>
        </div>

        {/* UK Size Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] uppercase tracking-wider text-[#64748B] mr-1 shrink-0">
            Size:
          </span>
          {SIZE_FILTERS.map((sz) => (
            <button
              key={sz}
              onClick={() => setSelectedSize(sz)}
              className={`px-2.5 py-1 text-[11px] font-mono-num rounded-md border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedSize === sz
                  ? 'bg-white/15 border-[#2563EB] text-white'
                  : 'bg-[#0C0E13] border-white/10 text-[#94A3B8] hover:text-white'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Product Grid: 2 cols Mobile, 3 cols Tablet, 4 cols Desktop */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#111318] border border-white/10 rounded-xl space-y-4">
          <p className="font-display text-xl font-semibold text-white">No matching footwear found</p>
          <p className="text-sm text-[#A1AAB8]">
            Try clearing your active search query, size filter, or switching to All collections.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedSize('All Sizes');
              setSearchQuery('');
              setOnlyDiscounted(false);
            }}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          data-testid="collections-grid"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
