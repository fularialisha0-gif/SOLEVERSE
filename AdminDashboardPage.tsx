import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Database,
  Edit3,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ADMIN_EMAIL } from '../lib/firebase';
import { formatINR, getDiscountedPrice } from '../data/catalog';
import { OrderStatus, Product, ProductCategory, StoreSettings } from '../types';

const ALL_CATEGORIES: ProductCategory[] = [
  'New Arrivals',
  'Best Sellers',
  'Running Shoes',
  'Sports Shoes',
  'Streetwear',
  'Luxury Collection',
  'Limited Edition',
];

const STUDIO_IMAGES = [
  '/images/sneaker_angle_side_1795430677489.jpg',
  '/images/sneaker_aero_obsidian_1795428854450.jpg',
  '/images/sneaker_kinetic_cobalt_1795428853895.jpg',
  '/images/sneaker_monolith_platinum_1795428855570.jpg',
  '/images/sneaker_apex_street_1795428855915.jpg',
  '/images/sneaker_court_obsidian_side_1795431337453.jpg',
  '/images/sneaker_eclipse_limited_1795428858131.jpg',
  '/images/sneaker_strata_sand_1795428857635.jpg',
];

function createBlankProduct(): Product {
  const uid = `sv-prod-${Date.now().toString(36)}`;
  return {
    id: uid,
    name: '',
    slug: uid,
    category: 'New Arrivals',
    categories: ['New Arrivals'],
    priceInr: 14999,
    discountPercent: 0,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: ['Obsidian / Silver'],
    images: [
      STUDIO_IMAGES[0],
      '/images/sneaker_angle_front_1795430677840.jpg',
      '/images/sneaker_angle_back_1795430677102.jpg',
      '/images/sneaker_angle_top_1795430677173.jpg',
    ],
    description: '',
    specs: {
      upper: 'Engineered technical knit',
      midsole: 'Nitrogen-infused PEBA foam',
      outsole: 'High-abrasion carbon rubber',
      weight: '240 g (UK 8)',
      drop: '8 mm',
      origin: 'SOLEVERSE Studio',
    },
    stock: 20,
    rating: 4.8,
    reviewCount: 0,
    featured: false,
    has3DPreview: true,
    shoePalette: {
      upper: '#14171f',
      midsole: '#262b36',
      cage: '#cbd5e1',
      outsole: '#2563eb',
      laces: '#111318',
      finish: 'metallic',
    },
  };
}

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    demoMode,
    products,
    allOrders,
    contactMessages,
    storeSettings,
    integrations,
    signInWithGoogle,
    signInDemoAdmin,
    adminUpdateOrderStatus,
    adminUpsertProduct,
    adminDeleteProduct,
    adminSaveSettings,
    adminSeedCatalog,
    showToast,
  } = useStore();

  const [tab, setTab] = useState<'analytics' | 'products' | 'orders' | 'settings'>('analytics');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<StoreSettings>(storeSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const analytics = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalSalesInr = allOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalInr, 0);
    const pendingOrders = allOrders.filter(
      (o) => o.status === 'PLACED' || o.status === 'CONFIRMED' || o.status === 'SHIPPED'
    ).length;
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED').length;
    const availableStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    return { totalOrders, totalSalesInr, pendingOrders, completedOrders, availableStock };
  }, [allOrders, products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Secure Admin Authentication Gate
  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="bg-[#111318] border border-white/15 rounded-2xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#93C5FD] mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD]">Protected Console</p>
            <h1 className="font-display text-2xl font-bold text-white">
              Administrator Access Required
            </h1>
            <p className="text-sm text-[#A1AAB8]">
              Live Firestore product, order, and store-setting controls are restricted exclusively to verified administrator accounts ({ADMIN_EMAIL}).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Sign In with Admin Google Account
            </button>

            <button
              onClick={signInDemoAdmin}
              className="w-full py-3 px-4 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-[#A1AAB8] hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Preview Admin Dashboard in Demo Mode (Local Browser Storage Only)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setEditingProduct((prev) =>
            prev ? { ...prev, images: [dataUrl, ...prev.images.slice(0, 4)] } : prev
          );
          showToast('Image compressed and added to product gallery.', 'success');
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }
    await adminUpsertProduct({
      ...editingProduct,
      slug: editingProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
    setEditingProduct(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminSaveSettings(settingsDraft);
    } finally {
      setSavingSettings(false);
    }
  };

  const buildOrderWhatsAppLink = (orderId: string) => {
    const o = allOrders.find((ord) => ord.id === orderId);
    if (!o) return '#';
    const text = [
      `SOLEVERSE ORDER #${o.id}`,
      `Customer: ${o.customerName} (${o.customerPhone})`,
      `Status: ${o.status}`,
      `Total: ${formatINR(o.totalInr)} (${o.paymentMethod})`,
      `Items: ${o.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join(', ')}`,
      `Address: ${o.deliveryAddress.line1}, ${o.deliveryAddress.city} ${o.deliveryAddress.postalCode}`,
    ].join('\n');
    const digits = storeSettings.whatsappNumber.replace(/[^\d]/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD] mb-1">
            {demoMode ? 'Demo Admin Mode (Local Storage)' : 'Live Firestore Admin Console'}
          </p>
          <h1 className="font-display text-3xl font-bold text-white">SOLEVERSE Store Operations</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!demoMode && (
            <button
              onClick={adminSeedCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111318] hover:bg-white/5 border border-white/15 text-xs font-medium text-[#93C5FD] rounded-lg cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync Default Catalog to Firestore</span>
            </button>
          )}
          <button
            onClick={() => {
              setTab('products');
              setEditingProduct(createBlankProduct());
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'products', label: `Products (${products.length})`, icon: ShoppingBag },
          { id: 'orders', label: `Orders (${allOrders.length})`, icon: Package },
          { id: 'settings', label: 'Store & White-Label Settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tab === item.id
                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                  : 'bg-[#111318] border-white/10 text-[#A1AAB8] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {tab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { label: 'Total Orders', value: String(analytics.totalOrders) },
              { label: 'Total Sales (INR)', value: formatINR(analytics.totalSalesInr) },
              { label: 'Pending / Active Orders', value: String(analytics.pendingOrders) },
              { label: 'Completed Orders', value: String(analytics.completedOrders) },
              { label: 'Available Stock Units', value: String(analytics.availableStock) },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-1.5"
              >
                <p className="text-xs text-[#A1AAB8]">{kpi.label}</p>
                <p className="font-mono-num text-2xl font-bold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-8 bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-white">Recent Orders</h2>
                <button
                  onClick={() => setTab('orders')}
                  className="text-xs text-[#93C5FD] hover:text-white cursor-pointer"
                >
                  Manage All
                </button>
              </div>
              {allOrders.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#A1AAB8]">
                  No orders recorded yet. Place a test order from checkout to see live order analytics.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090A0D] text-[#A1AAB8] border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3 font-medium">Order ID</th>
                        <th className="px-5 py-3 font-medium">Customer</th>
                        <th className="px-5 py-3 font-medium">Payment</th>
                        <th className="px-5 py-3 font-medium">Total</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allOrders.slice(0, 6).map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5 font-mono-num text-white">{o.id}</td>
                          <td className="px-5 py-3.5 text-[#F4F6FA]">{o.customerName}</td>
                          <td className="px-5 py-3.5 text-[#A1AAB8]">{o.paymentMethod}</td>
                          <td className="px-5 py-3.5 font-mono-num text-white">
                            {formatINR(o.totalInr)}
                          </td>
                          <td className="px-5 py-3.5 text-[#93C5FD] font-medium">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Customer Inquiries */}
            <div className="lg:col-span-4 bg-[#111318] border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-white">
                Support Inquiries ({contactMessages.length})
              </h2>
              {contactMessages.length === 0 ? (
                <p className="text-xs text-[#A1AAB8]">No customer support messages yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {contactMessages.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-[#090A0D] border border-white/10 rounded-lg space-y-1 text-xs"
                    >
                      <p className="font-semibold text-white">{m.subject}</p>
                      <p className="text-[#93C5FD]">
                        {m.name} · {m.email}
                      </p>
                      <p className="text-[#A1AAB8] line-clamp-2">{m.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Filter products by name or category..."
              className="px-4 py-2.5 bg-[#111318] border border-white/10 rounded-lg text-sm text-white w-full sm:w-80 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="bg-[#111318] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090A0D] text-[#A1AAB8] border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Footwear</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">MRP (INR)</th>
                  <th className="px-5 py-3.5 font-medium">Discount</th>
                  <th className="px-5 py-3.5 font-medium">Net Price</th>
                  <th className="px-5 py-3.5 font-medium">Stock</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-9 object-cover rounded bg-[#090A0D] shrink-0"
                        />
                        <span className="font-medium text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#A1AAB8]">{p.category}</td>
                    <td className="px-5 py-3.5 font-mono-num text-[#A1AAB8]">
                      {formatINR(p.priceInr)}
                    </td>
                    <td className="px-5 py-3.5 font-mono-num text-[#93C5FD]">
                      {p.discountPercent}%
                    </td>
                    <td className="px-5 py-3.5 font-mono-num text-white font-semibold">
                      {formatINR(getDiscountedPrice(p.priceInr, p.discountPercent))}
                    </td>
                    <td className="px-5 py-3.5 font-mono-num text-white">{p.stock}</td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#090A0D] hover:bg-white/10 border border-white/10 rounded text-[#F4F6FA] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => adminDeleteProduct(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER MANAGEMENT */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {allOrders.length === 0 ? (
            <div className="bg-[#111318] border border-white/10 rounded-xl p-12 text-center text-sm text-[#A1AAB8]">
              No customer orders have been placed yet.
            </div>
          ) : (
            allOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#111318] border border-white/10 rounded-xl p-6 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono-num text-base font-bold text-white">Order #{order.id}</p>
                    <p className="text-xs text-[#A1AAB8] mt-0.5">
                      {order.customerName} · {order.customerPhone} · {order.customerEmail}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-num text-base font-bold text-white mr-2">
                      {formatINR(order.totalInr)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        adminUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="px-3 py-1.5 bg-[#090A0D] border border-white/15 rounded-lg text-xs font-medium text-white cursor-pointer"
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                    <a
                      href={buildOrderWhatsAppLink(order.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#090A0D] hover:bg-white/5 border border-white/15 rounded-lg text-xs text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                  <div className="lg:col-span-7 space-y-2">
                    <p className="text-[#A1AAB8] uppercase tracking-wider font-semibold">Ordered Items</p>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white">
                          {item.name} ({item.size} · {item.color}) × {item.quantity}
                        </span>
                        <span className="font-mono-num text-[#A1AAB8]">
                          {formatINR(item.unitPriceInr * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 space-y-1 text-[#A1AAB8]">
                    <p className="text-white uppercase tracking-wider font-semibold">Delivery & Payment</p>
                    <p>
                      {order.deliveryAddress.line1}, {order.deliveryAddress.city},{' '}
                      {order.deliveryAddress.state} {order.deliveryAddress.postalCode}
                    </p>
                    <p>
                      Payment: {order.paymentMethod} ({order.paymentStatus})
                    </p>
                    <p>Tracking: {order.trackingCode}</p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => adminUpdateOrderStatus(order.id, 'CONFIRMED')}
                          className="px-3 py-1.5 bg-[#2563EB] text-white rounded-md cursor-pointer"
                        >
                          Confirm Order
                        </button>
                      )}
                      {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => adminUpdateOrderStatus(order.id, 'SHIPPED')}
                          className="px-3 py-1.5 bg-[#171A22] border border-white/15 text-white rounded-md cursor-pointer"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          onClick={() => adminUpdateOrderStatus(order.id, 'DELIVERED')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md cursor-pointer"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: STORE SETTINGS & INTEGRATIONS */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-7 bg-[#111318] border border-white/10 rounded-xl p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-display text-lg font-semibold text-white">
              White-Label Brand Customisation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={settingsDraft.brandName}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, brandName: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Brand Tagline</label>
                <input
                  type="text"
                  required
                  value={settingsDraft.tagline}
                  onChange={(e) => setSettingsDraft((s) => ({ ...s, tagline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={settingsDraft.contactEmail}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, contactEmail: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">WhatsApp Owner Number</label>
                <input
                  type="text"
                  required
                  value={settingsDraft.whatsappNumber}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({ ...s, whatsappNumber: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Free Shipping (INR)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={settingsDraft.freeShippingThresholdInr}
                  onChange={(e) =>
                    setSettingsDraft((s) => ({
                      ...s,
                      freeShippingThresholdInr: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1">Homepage Hero Title</label>
              <input
                type="text"
                value={settingsDraft.heroTitle}
                onChange={(e) => setSettingsDraft((s) => ({ ...s, heroTitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1">Homepage Hero Subtitle</label>
              <textarea
                rows={3}
                value={settingsDraft.heroSubtitle}
                onChange={(e) =>
                  setSettingsDraft((s) => ({ ...s, heroSubtitle: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Store Configuration'}
            </button>
          </form>

          {/* Server Integration Status */}
          <div className="lg:col-span-5 bg-[#111318] border border-white/10 rounded-xl p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold text-white">
              Gateway & API Configuration
            </h2>

            <div className="p-4 bg-[#090A0D] border border-white/10 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Razorpay Payments</span>
                <span className={integrations.razorpayConfigured ? 'text-emerald-400' : 'text-amber-300'}>
                  {integrations.razorpayConfigured ? 'Configured' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[#A1AAB8]">
                Set <code className="font-mono">RAZORPAY_KEY_ID</code> and{' '}
                <code className="font-mono">RAZORPAY_KEY_SECRET</code> in server Secrets to enable live UPI/card checkout.
              </p>
            </div>

            <div className="p-4 bg-[#090A0D] border border-white/10 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">WhatsApp Business Cloud API</span>
                <span className={integrations.whatsappConfigured ? 'text-emerald-400' : 'text-amber-300'}>
                  {integrations.whatsappConfigured ? 'Configured' : 'Unconfigured (Click-to-WhatsApp Active)'}
                </span>
              </div>
              <p className="text-[#A1AAB8]">
                Set <code className="font-mono">WHATSAPP_CLOUD_ACCESS_TOKEN</code>,{' '}
                <code className="font-mono">WHATSAPP_PHONE_NUMBER_ID</code>, and{' '}
                <code className="font-mono">WHATSAPP_OWNER_NUMBER</code> in server Secrets for automated order alerts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-2xl bg-[#111318] border border-white/15 rounded-2xl p-6 sm:p-8 space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-bold text-white">
                {products.some((p) => p.id === editingProduct.id) ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 text-[#A1AAB8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct((p) => (p ? { ...p, name: e.target.value } : p))
                  }
                  placeholder="Aero-X2 Titanium"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Primary Category</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => {
                    const cat = e.target.value as ProductCategory;
                    setEditingProduct((p) =>
                      p
                        ? {
                            ...p,
                            category: cat,
                            categories: Array.from(new Set([cat, ...p.categories])).slice(0, 7),
                          }
                        : p
                    );
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Price (INR) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={editingProduct.priceInr}
                  onChange={(e) =>
                    setEditingProduct((p) => (p ? { ...p, priceInr: Number(e.target.value) } : p))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={editingProduct.discountPercent}
                  onChange={(e) =>
                    setEditingProduct((p) =>
                      p ? { ...p, discountPercent: Number(e.target.value) } : p
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct((p) => (p ? { ...p, stock: Number(e.target.value) } : p))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Sizes (comma separated)</label>
                <input
                  type="text"
                  value={editingProduct.sizes.join(', ')}
                  onChange={(e) =>
                    setEditingProduct((p) =>
                      p
                        ? {
                            ...p,
                            sizes: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : p
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1">Colors (comma separated)</label>
                <input
                  type="text"
                  value={editingProduct.colors.join(', ')}
                  onChange={(e) =>
                    setEditingProduct((p) =>
                      p
                        ? {
                            ...p,
                            colors: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : p
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            {/* Image Upload & Studio Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#A1AAB8]">Product Images</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#090A0D] hover:bg-white/5 border border-white/15 rounded-lg text-xs text-[#93C5FD] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STUDIO_IMAGES.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() =>
                      setEditingProduct((p) =>
                        p ? { ...p, images: [imgUrl, ...p.images.filter((i) => i !== imgUrl)].slice(0, 4) } : p
                      )
                    }
                    className={`w-16 h-12 rounded-md overflow-hidden border shrink-0 cursor-pointer ${
                      editingProduct.images[0] === imgUrl ? 'border-[#2563EB]' : 'border-white/10 opacity-60'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1">Description *</label>
              <textarea
                required
                minLength={5}
                rows={3}
                value={editingProduct.description}
                onChange={(e) =>
                  setEditingProduct((p) => (p ? { ...p, description: e.target.value } : p))
                }
                placeholder="Describe materials, cushioning, and silhouette..."
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#A1AAB8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.featured}
                  onChange={(e) =>
                    setEditingProduct((p) => (p ? { ...p, featured: e.target.checked } : p))
                  }
                  className="accent-[#2563EB]"
                />
                <span>Feature on Homepage</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-[#090A0D] border border-white/15 rounded-lg text-xs text-[#A1AAB8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
