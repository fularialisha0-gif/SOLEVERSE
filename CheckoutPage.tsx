import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Lock,
  MessageCircle,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR, getDiscountedPrice } from '../data/catalog';
import { AppRoute, Order, PaymentMethod } from '../types';

interface CheckoutPageProps {
  navigate: (route: AppRoute) => void;
}

interface RazorpayConfigResponse {
  razorpayConfigured: boolean;
  keyId: string | null;
  mode: string;
}

interface WhatsAppNotifyResult {
  sent: boolean;
  configured: boolean;
  message?: string;
  error?: string;
  fallbackUrl: string;
  formattedMessage: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ navigate }) => {
  const {
    cart,
    user,
    demoMode,
    storeSettings,
    cartSubtotalInr,
    cartDiscountInr,
    shippingInr,
    cartTotalInr,
    placeOrder,
    setAuthModalOpen,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [line1, setLine1] = useState(user?.defaultAddress?.line1 || '');
  const [line2, setLine2] = useState(user?.defaultAddress?.line2 || '');
  const [city, setCity] = useState(user?.defaultAddress?.city || '');
  const [state, setState] = useState(user?.defaultAddress?.state || '');
  const [postalCode, setPostalCode] = useState(user?.defaultAddress?.postalCode || '');
  const [country, setCountry] = useState(user?.defaultAddress?.country || 'India');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const [rzpConfig, setRzpConfig] = useState<RazorpayConfigResponse>({
    razorpayConfigured: false,
    keyId: null,
    mode: 'unconfigured',
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [whatsappResult, setWhatsappResult] = useState<WhatsAppNotifyResult | null>(null);

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRzpConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.displayName);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user, customerName, customerEmail, customerPhone]);

  const notifyOwnerWhatsApp = async (order: Order) => {
    try {
      const resp = await fetch('/api/whatsapp/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          paymentMethod: order.paymentMethod,
          totalInr: order.totalInr,
          ownerWhatsappNumber: storeSettings.whatsappNumber,
          deliveryAddress: order.deliveryAddress,
          items: order.items.map((item) => ({
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            priceInr: item.unitPriceInr,
          })),
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as WhatsAppNotifyResult;
        setWhatsappResult(data);
      }
    } catch {
      // Fallback link still constructible locally if offline
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'RAZORPAY' && !rzpConfig.razorpayConfigured) {
      showToast(
        'Razorpay credentials are not configured on the server. Select Cash on Delivery to proceed.',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      let razorpayOrderId: string | undefined;
      let razorpayPaymentId: string | undefined;

      if (paymentMethod === 'RAZORPAY' && rzpConfig.razorpayConfigured) {
        const rzpRes = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountInr: cartTotalInr,
            receipt: `sv_${Date.now()}`,
          }),
        });
        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) {
          throw new Error(rzpData.error || 'Unable to initialize Razorpay checkout.');
        }
        razorpayOrderId = rzpData.orderId;
        // Note: In a full production browser session with Razorpay checkout.js loaded,
        // the modal collects razorpay_payment_id & signature and verifies via /api/payments/razorpay/verify.
        // Without client checkout script, keep paymentStatus as PENDING until verified.
      }

      const order = await placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress: {
          line1,
          line2: line2 || undefined,
          city,
          state,
          postalCode,
          country,
        },
        paymentMethod,
        notes: notes || undefined,
        razorpayOrderId,
        razorpayPaymentId,
      });

      setConfirmedOrder(order);
      showToast(`Order ${order.id} placed successfully.`, 'success');
      await notifyOwnerWhatsApp(order);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to place order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 space-y-8">
        <div className="bg-[#111318] border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-9 h-9 text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[#93C5FD]">Order Confirmed</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Order #{confirmedOrder.id}
              </h1>
              <p className="text-sm text-[#A1AAB8]">
                Thank you, {confirmedOrder.customerName}. Your pair is queued at our Mumbai studio.
                Tracking ID: <span className="font-mono-num text-white">{confirmedOrder.trackingCode}</span>
              </p>
            </div>
          </div>

          {/* Itemized Summary */}
          <div className="border border-white/10 rounded-xl bg-[#090A0D] divide-y divide-white/5">
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-[#A1AAB8]">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                </div>
                <span className="font-mono-num text-white font-semibold">
                  {formatINR(item.unitPriceInr * item.quantity)}
                </span>
              </div>
            ))}
            <div className="p-4 flex items-center justify-between text-base font-semibold text-white">
              <span>Total ({confirmedOrder.paymentMethod})</span>
              <span className="font-mono-num">{formatINR(confirmedOrder.totalInr)}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#A1AAB8]">
            <div className="p-4 bg-[#090A0D] border border-white/10 rounded-xl space-y-1">
              <p className="text-white font-semibold uppercase tracking-wider mb-1">Delivery Address</p>
              <p>{confirmedOrder.customerName}</p>
              <p>{confirmedOrder.deliveryAddress.line1}</p>
              <p>
                {confirmedOrder.deliveryAddress.city}, {confirmedOrder.deliveryAddress.state}{' '}
                {confirmedOrder.deliveryAddress.postalCode}
              </p>
              <p>{confirmedOrder.customerPhone}</p>
            </div>
            <div className="p-4 bg-[#090A0D] border border-white/10 rounded-xl space-y-1">
              <p className="text-white font-semibold uppercase tracking-wider mb-1">Payment Status</p>
              <p>Method: {confirmedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay Online'}</p>
              <p>Status: {confirmedOrder.paymentStatus}</p>
              <p>Order State: {confirmedOrder.status}</p>
            </div>
          </div>

          {/* WhatsApp Owner Alert Section */}
          <div className="p-5 bg-[#090A0D] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp Owner Notification</span>
              </div>
              <span className="text-xs text-[#A1AAB8]">
                {whatsappResult?.sent ? 'Cloud API Delivered' : 'Manual / Demo Fallback'}
              </span>
            </div>

            {whatsappResult?.sent ? (
              <p className="text-xs text-[#A1AAB8]">
                Automatic order alert sent to the store owner via WhatsApp Business Cloud API.
              </p>
            ) : (
              <p className="text-xs text-[#A1AAB8]">
                {whatsappResult?.message ||
                  'WhatsApp Business Cloud API credentials are not configured on the server, so automatic notifications are paused. Use the Click-to-WhatsApp button below to send this order alert directly to the shop owner.'}
              </p>
            )}

            {whatsappResult?.fallbackUrl && (
              <a
                href={whatsappResult.fallbackUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#171A22] hover:bg-[#1E2330] border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Send Order Alert via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#A1AAB8]" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigate({ page: 'orders', highlightOrderId: confirmedOrder.id })}
              className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Track Order Status
            </button>
            <button
              onClick={() => navigate({ page: 'collections' })}
              className="px-5 py-3 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <ShoppingBag className="w-12 h-12 text-[#64748B] mx-auto" />
        <h1 className="font-display text-2xl font-bold text-white">Your shopping bag is empty</h1>
        <p className="text-sm text-[#A1AAB8]">
          Select a silhouette from our collections or design a custom pair in the 3D Studio before checking out.
        </p>
        <button
          onClick={() => navigate({ page: 'collections' })}
          className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Explore Collections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD] mb-1">Checkout</p>
          <h1 className="font-display text-3xl font-bold text-white">Delivery & Payment (INR)</h1>
        </div>
        {!user && (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="text-xs text-[#93C5FD] hover:text-white underline self-start sm:self-auto cursor-pointer"
          >
            Sign in with Google or Demo Account to sync order history
          </button>
        )}
      </div>

      {demoMode && (
        <div className="p-4 bg-[#111318] border border-[#2563EB]/40 rounded-xl flex items-start gap-3 text-xs text-[#A1AAB8]">
          <AlertCircle className="w-4 h-4 text-[#93C5FD] shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Demo Mode Active:</strong> Orders placed without a verified Firebase Google session are saved locally in your browser so you can test the full checkout and tracking workflow.
          </span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Delivery & Payment Form */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-semibold text-white">1. Contact & Delivery Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Rohan Kulkarni"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="rohan@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  minLength={7}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1.5">Address Line 1 *</label>
              <input
                type="text"
                required
                minLength={3}
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Flat 402, Meridian Towers, Worli Sea Face"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1.5">Landmark / Line 2 (Optional)</label>
              <input
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Near Coastal Promenade"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1AAB8] mb-1.5">PIN Code *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="400018"
                  className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm font-mono-num text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1.5">Order Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Call upon arrival at gate"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-semibold text-white">2. Payment Method (INR)</h2>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={`block p-4 rounded-xl border transition-colors cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'bg-[#2563EB]/15 border-[#2563EB]'
                    : 'bg-[#090A0D] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                        <Truck className="w-4 h-4 text-[#93C5FD]" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="font-mono-num text-xs text-[#93C5FD]">No COD surcharge</span>
                    </div>
                    <p className="text-xs text-[#A1AAB8] mt-1">
                      Pay <strong className="text-white font-mono-num">{formatINR(cartTotalInr)}</strong> via cash or UPI to the courier upon delivery.
                    </p>
                  </div>
                </div>
              </label>

              {/* Razorpay Online Payment */}
              <label
                className={`block p-4 rounded-xl border transition-colors cursor-pointer ${
                  paymentMethod === 'RAZORPAY'
                    ? 'bg-[#2563EB]/15 border-[#2563EB]'
                    : 'bg-[#090A0D] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                        <CreditCard className="w-4 h-4 text-[#93C5FD]" />
                        Online Payment (Razorpay UPI / Cards / NetBanking)
                      </span>
                      <span className="text-xs text-[#A1AAB8]">
                        {rzpConfig.razorpayConfigured ? 'Configured' : 'Requires Credentials'}
                      </span>
                    </div>

                    {rzpConfig.razorpayConfigured ? (
                      <p className="text-xs text-[#A1AAB8] mt-1">
                        Razorpay gateway is configured on the server. Click Place Order to initiate secure INR checkout.
                      </p>
                    ) : (
                      <p className="text-xs text-amber-300/90 mt-1.5 leading-relaxed">
                        Razorpay API credentials (<code className="font-mono">RAZORPAY_KEY_ID</code> and <code className="font-mono">RAZORPAY_KEY_SECRET</code>) are not configured in server Secrets. Real online payments are disabled until valid credentials are supplied — select Cash on Delivery above to complete your order.
                      </p>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-white">Order Summary</h2>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => {
              const unit = getDiscountedPrice(item.priceInr, item.discountPercent);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-14 object-cover rounded-lg bg-[#090A0D] border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-[#A1AAB8]">
                      {item.size} · {item.color} · x{item.quantity}
                    </p>
                  </div>
                  <span className="font-mono-num text-sm font-semibold text-white shrink-0">
                    {formatINR(unit * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pt-4 border-t border-white/10 text-sm">
            <div className="flex justify-between text-[#A1AAB8]">
              <span>Subtotal</span>
              <span className="font-mono-num">{formatINR(cartSubtotalInr)}</span>
            </div>
            {cartDiscountInr > 0 && (
              <div className="flex justify-between text-[#93C5FD]">
                <span>Discount Savings</span>
                <span className="font-mono-num">-{formatINR(cartDiscountInr)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#A1AAB8]">
              <span>Shipping</span>
              <span className="font-mono-num">
                {shippingInr === 0 ? 'Complimentary' : formatINR(shippingInr)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/10">
              <span>Payable Total</span>
              <span className="font-mono-num">{formatINR(cartTotalInr)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || (paymentMethod === 'RAZORPAY' && !rzpConfig.razorpayConfigured)}
            className="w-full py-3.5 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {submitting
                ? 'Confirming Order...'
                : paymentMethod === 'COD'
                  ? `Place COD Order · ${formatINR(cartTotalInr)}`
                  : `Pay with Razorpay · ${formatINR(cartTotalInr)}`}
            </span>
          </button>
        </aside>
      </form>
    </div>
  );
};
