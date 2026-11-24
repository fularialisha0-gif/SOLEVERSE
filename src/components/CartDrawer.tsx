import React, { useState } from 'react';
import { ArrowRight, Heart, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR, getDiscountedPrice } from '../data/catalog';
import { AppRoute } from '../types';

interface CartDrawerProps {
  navigate: (route: AppRoute) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ navigate }) => {
  const {
    cart,
    wishlist,
    products,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    toggleWishlist,
    addToCart,
    cartSubtotalInr,
    cartDiscountInr,
    shippingInr,
    cartTotalInr,
    storeSettings,
  } = useStore();

  const [tab, setTab] = useState<'bag' | 'wishlist'>('bag');

  if (!cartOpen) return null;

  const savedProducts = products.filter((p) => wishlist.includes(p.id));
  const threshold = storeSettings.freeShippingThresholdInr || 12000;
  const discountedSubtotal = cartSubtotalInr - cartDiscountInr;
  const remainingForFree = Math.max(0, threshold - discountedSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75">
      <div className="w-full max-w-md bg-[#111318] border-l border-white/10 h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-[#090A0D] rounded-lg border border-white/10">
            <button
              onClick={() => setTab('bag')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'bag' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8] hover:text-white'
              }`}
            >
              Bag ({cart.reduce((s, c) => s + c.quantity, 0)})
            </button>
            <button
              onClick={() => setTab('wishlist')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'wishlist' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8] hover:text-white'
              }`}
            >
              Wishlist ({savedProducts.length})
            </button>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === 'bag' ? (
            cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <ShoppingBag className="w-10 h-10 text-[#64748B] mx-auto" />
                <div>
                  <p className="font-display text-lg font-semibold text-white">Your bag is empty</p>
                  <p className="text-sm text-[#A1AAB8] mt-1">
                    Explore our 3D-engineered silhouettes or craft your own pair in the studio.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    navigate({ page: 'collections' });
                  }}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              <>
                <div className="p-3.5 bg-[#090A0D] border border-white/10 rounded-lg text-xs text-[#A1AAB8]">
                  {remainingForFree === 0 ? (
                    <span className="text-[#93C5FD]">Complimentary express delivery unlocked.</span>
                  ) : (
                    <span>
                      Add <strong className="text-white font-mono-num">{formatINR(remainingForFree)}</strong> more for complimentary express delivery.
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {cart.map((item) => {
                    const unit = getDiscountedPrice(item.priceInr, item.discountPercent);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 object-cover rounded-lg bg-[#090A0D] border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#64748B] hover:text-red-400 transition-colors cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-[#A1AAB8] mt-0.5">
                            {item.size} · {item.color}
                          </p>
                          {item.customPalette && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {[
                                item.customPalette.upper,
                                item.customPalette.midsole,
                                item.customPalette.cage,
                                item.customPalette.outsole,
                              ].map((hex, i) => (
                                <span
                                  key={i}
                                  className="w-3 h-3 rounded-full border border-white/25"
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                              <span className="text-[11px] text-[#93C5FD]">Custom 3D</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="inline-flex items-center border border-white/10 rounded-lg bg-[#090A0D]">
                              <button
                                onClick={() => updateCartQty(item.id, item.quantity - 1)}
                                className="p-1.5 text-[#A1AAB8] hover:text-white cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-mono-num text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQty(item.id, item.quantity + 1)}
                                className="p-1.5 text-[#A1AAB8] hover:text-white cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-mono-num text-sm font-semibold text-white">
                              {formatINR(unit * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : savedProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Heart className="w-10 h-10 text-[#64748B] mx-auto" />
              <p className="font-display text-lg font-semibold text-white">No saved pairs yet</p>
              <p className="text-sm text-[#A1AAB8]">Tap the heart icon on any silhouette to save it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-lg bg-[#090A0D] border border-white/10 shrink-0 cursor-pointer"
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ page: 'product', productId: p.id });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{p.name}</h4>
                    <p className="text-xs text-[#A1AAB8]">{p.category}</p>
                    <p className="font-mono-num text-sm font-semibold text-white mt-1">
                      {formatINR(getDiscountedPrice(p.priceInr, p.discountPercent))}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => {
                          addToCart(p, p.sizes[2] || p.sizes[0], p.colors[0], 1);
                          setTab('bag');
                        }}
                        className="px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-md cursor-pointer"
                      >
                        Move to Bag
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="px-2.5 py-1 text-xs text-[#A1AAB8] hover:text-white cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Totals */}
        {tab === 'bag' && cart.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#090A0D] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#A1AAB8]">
                <span>MRP Subtotal</span>
                <span className="font-mono-num">{formatINR(cartSubtotalInr)}</span>
              </div>
              {cartDiscountInr > 0 && (
                <div className="flex justify-between text-[#93C5FD]">
                  <span>Collection Savings</span>
                  <span className="font-mono-num">-{formatINR(cartDiscountInr)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#A1AAB8]">
                <span>Express Shipping</span>
                <span className="font-mono-num">
                  {shippingInr === 0 ? 'Complimentary' : formatINR(shippingInr)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-white/10">
                <span>Total (INR)</span>
                <span className="font-mono-num">{formatINR(cartTotalInr)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCartOpen(false);
                navigate({ page: 'checkout' });
              }}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
