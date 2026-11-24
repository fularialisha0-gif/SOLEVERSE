import React, { useState } from 'react';
import { Check, LogOut, Package, ShoppingBag, Truck, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../data/catalog';
import { ProductCard } from '../components/ProductCard';
import { AppRoute, OrderStatus } from '../types';

interface OrdersPageProps {
  highlightOrderId?: string;
  navigate: (route: AppRoute) => void;
}

const TRACKING_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PLACED', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export const OrdersPage: React.FC<OrdersPageProps> = ({ highlightOrderId, navigate }) => {
  const { user, demoMode, orders, wishlist, products, setAuthModalOpen, signOut, cancelOrder } =
    useStore();
  const [tab, setTab] = useState<'orders' | 'wishlist'>('orders');

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'CANCELLED') return -1;
    return TRACKING_STEPS.findIndex((s) => s.status === status);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      {/* Account Summary Header */}
      <div className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#93C5FD]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#93C5FD] uppercase tracking-wider">
              {user ? (demoMode ? 'Demo Customer Session' : 'Verified Google Account') : 'Guest Session'}
            </p>
            <h1 className="font-display text-2xl font-bold text-white">
              {user ? user.displayName : 'Your Orders & Wishlist'}
            </h1>
            {user && <p className="text-xs text-[#A1AAB8]">{user.email}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-xs font-medium text-[#A1AAB8] hover:text-white rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#111318] border border-white/10 rounded-lg w-fit">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'orders' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8] hover:text-white'
          }`}
        >
          Order History & Tracking ({orders.length})
        </button>
        <button
          onClick={() => setTab('wishlist')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'wishlist' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8] hover:text-white'
          }`}
        >
          Saved Wishlist ({savedProducts.length})
        </button>
      </div>

      {tab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-[#111318] border border-white/10 rounded-2xl p-14 text-center space-y-4">
            <Package className="w-10 h-10 text-[#64748B] mx-auto" />
            <h2 className="font-display text-xl font-semibold text-white">No orders placed yet</h2>
            <p className="text-sm text-[#A1AAB8] max-w-md mx-auto">
              Once you place an order, real-time shipping progress and tracking numbers will appear here.
            </p>
            <button
              onClick={() => navigate({ page: 'collections' })}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Browse Footwear
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const stepIdx = getStepIndex(order.status);
              const isHighlighted = highlightOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className={`bg-[#111318] border rounded-2xl p-6 space-y-6 ${
                    isHighlighted ? 'border-[#2563EB]' : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-mono-num text-sm font-semibold text-white">
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-[#A1AAB8] mt-0.5">
                        Tracking: <span className="font-mono-num text-white">{order.trackingCode || 'Pending'}</span> ·{' '}
                        {order.paymentMethod} ({order.paymentStatus})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-base font-bold text-white">
                        {formatINR(order.totalInr)}
                      </span>
                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  {order.status === 'CANCELLED' ? (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-200">
                      This order has been cancelled.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TRACKING_STEPS.map((step, idx) => {
                        const completed = idx <= stepIdx;
                        return (
                          <div
                            key={step.status}
                            className={`p-3 rounded-xl border ${
                              completed
                                ? 'bg-[#2563EB]/15 border-[#2563EB] text-white'
                                : 'bg-[#090A0D] border-white/10 text-[#64748B]'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-medium">
                              {completed ? (
                                <Check className="w-3.5 h-3.5 text-[#93C5FD]" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                              <span>{step.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Items & Delivery */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-12 object-cover rounded-lg bg-[#090A0D] border border-white/10 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{item.name}</p>
                            <p className="text-xs text-[#A1AAB8]">
                              {item.size} · {item.color} · Qty {item.quantity}
                            </p>
                          </div>
                          <span className="font-mono-num text-sm text-white">
                            {formatINR(item.unitPriceInr * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-4 p-4 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-[#A1AAB8] space-y-1">
                      <p className="text-white font-semibold mb-1">Ship To</p>
                      <p>{order.customerName}</p>
                      <p>{order.deliveryAddress.line1}</p>
                      <p>
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                        {order.deliveryAddress.postalCode}
                      </p>
                      <p>{order.customerPhone}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : savedProducts.length === 0 ? (
        <div className="bg-[#111318] border border-white/10 rounded-2xl p-14 text-center space-y-4">
          <ShoppingBag className="w-10 h-10 text-[#64748B] mx-auto" />
          <p className="font-display text-xl font-semibold text-white">Your wishlist is empty</p>
          <button
            onClick={() => navigate({ page: 'collections' })}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Discover Silhouettes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {savedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
