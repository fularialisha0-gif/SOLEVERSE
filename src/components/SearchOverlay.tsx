import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR, getDiscountedPrice } from '../data/catalog';
import { AppRoute } from '../types';

interface SearchOverlayProps {
  navigate: (route: AppRoute) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ navigate }) => {
  const { searchOpen, setSearchOpen, products, categories } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.colors.some((c) => c.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [products, query]);

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-[#111318] border border-white/15 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#A1AAB8] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search footwear by silhouette, category, or colorway..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#64748B] focus:outline-none"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1.5 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSearchOpen(false);
                navigate({ page: 'collections', category: cat.name });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-[#090A0D] hover:bg-[#2563EB] text-[#A1AAB8] hover:text-white border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A1AAB8]">
              No silhouettes matched "{query}".
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSearchOpen(false);
                  navigate({ page: 'product', productId: p.id });
                }}
                className="w-full p-4 flex items-center gap-4 hover:bg-white/5 text-left transition-colors cursor-pointer"
              >
                <img
                  src={p.images[0]}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 object-cover rounded-md bg-[#090A0D] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-[#A1AAB8]">
                    {p.category} · {p.colors[0]}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-semibold text-white shrink-0">
                  {formatINR(getDiscountedPrice(p.priceInr, p.discountPercent))}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
