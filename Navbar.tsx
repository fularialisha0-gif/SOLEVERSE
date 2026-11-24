import React, { useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AppRoute } from '../types';

interface NavbarProps {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const {
    storeSettings,
    cartCount,
    wishlist,
    user,
    setCartOpen,
    setAuthModalOpen,
    setSearchOpen,
  } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; route: AppRoute; activeKey: AppRoute['page'] }[] = [
    { label: 'Collections', route: { page: 'collections' }, activeKey: 'collections' },
    { label: 'Studio', route: { page: 'customiser' }, activeKey: 'customiser' },
    { label: 'About', route: { page: 'about' }, activeKey: 'about' },
    { label: 'Support', route: { page: 'support' }, activeKey: 'support' },
    { label: 'Admin', route: { page: 'admin' }, activeKey: 'admin' },
  ];

  const handleNav = (route: AppRoute) => {
    navigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090A0D]/95 border-b border-white/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          onClick={() => handleNav({ page: 'home' })}
          className="font-display text-xl font-bold tracking-[0.18em] text-[#F4F6FA] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          aria-label={storeSettings.brandName}
        >
          {storeSettings.brandName}
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const active = currentRoute.page === item.activeKey;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.route)}
                className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer ${
                  active
                    ? 'text-white border-[#2563EB]'
                    : 'text-[#A1AAB8] border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Utility triggers & Primary Bag Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-[#A1AAB8] hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Search footwear"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleNav({ page: 'orders' })}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#A1AAB8] hover:text-white transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Wishlist and Orders"
          >
            <Heart className="w-4 h-4" />
            <span className="tabular-nums">{wishlist.length}</span>
          </button>

          <button
            onClick={() => (user ? handleNav({ page: 'orders' }) : setAuthModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#A1AAB8] hover:text-white transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Account"
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline max-w-[110px] truncate">
              {user ? user.displayName.split(' ')[0] : 'Sign In'}
            </span>
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="tabular-nums">Bag ({cartCount})</span>
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#111318] px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute.page === item.activeKey
                  ? 'bg-[#2563EB]/15 text-white'
                  : 'text-[#A1AAB8] hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNav({ page: 'orders' })}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#A1AAB8] hover:text-white hover:bg-white/5"
          >
            Orders & Wishlist ({wishlist.length})
          </button>
        </div>
      )}
    </header>
  );
};
