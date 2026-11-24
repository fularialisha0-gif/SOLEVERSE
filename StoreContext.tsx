import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  CartItem,
  CategoryRecord,
  ContactMessage,
  DeliveryAddress,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ShoePalette,
  StoreSettings,
  UserProfile,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, getDiscountedPrice } from '../data/catalog';
import { DEFAULT_BRAND_CONFIG, DEFAULT_STORE_SETTINGS } from '../config/brand.config';

const LS_KEYS = {
  CART: 'soleverse_cart_v1',
  WISHLIST: 'soleverse_wishlist_v1',
  DEMO_USER: 'soleverse_demo_user_v1',
  DEMO_ORDERS: 'soleverse_demo_orders_v1',
  DEMO_PRODUCTS: 'soleverse_demo_products_v1',
  DEMO_SETTINGS: 'soleverse_demo_settings_v1',
  DEMO_MESSAGES: 'soleverse_demo_messages_v1',
};

interface ToastState {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface IntegrationHealth {
  razorpayConfigured: boolean;
  whatsappConfigured: boolean;
}

interface PlaceOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

interface StoreContextValue {
  products: Product[];
  categories: CategoryRecord[];
  storeSettings: StoreSettings;
  user: UserProfile | null;
  authReady: boolean;
  firebaseReady: boolean;
  demoMode: boolean;
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  allOrders: Order[];
  contactMessages: ContactMessage[];
  cartCount: number;
  cartSubtotalInr: number;
  cartDiscountInr: number;
  shippingInr: number;
  cartTotalInr: number;
  cartOpen: boolean;
  authModalOpen: boolean;
  searchOpen: boolean;
  toast: ToastState | null;
  integrations: IntegrationHealth;
  setCartOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  showToast: (message: string, tone?: 'info' | 'success' | 'error') => void;
  signInWithGoogle: () => Promise<void>;
  signInDemoCustomer: (name: string, email: string, phone?: string) => void;
  signInDemoAdmin: () => void;
  signOut: () => Promise<void>;
  addToCart: (
    product: Product,
    size: string,
    color: string,
    quantity?: number,
    customPalette?: ShoePalette
  ) => void;
  updateCartQty: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  placeOrder: (payload: PlaceOrderPayload) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  adminUpdateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => Promise<void>;
  adminUpsertProduct: (product: Product) => Promise<void>;
  adminDeleteProduct: (productId: string) => Promise<void>;
  adminSaveSettings: (settings: StoreSettings) => Promise<void>;
  adminSeedCatalog: () => Promise<void>;
  submitContactMessage: (msg: { name: string; email: string; subject: string; message: string }) => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function safeReadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

function hydrateInitialProducts(): Product[] {
  const cached = safeReadLS<Product[] | null>(LS_KEYS.DEMO_PRODUCTS, null);
  if (!cached || !Array.isArray(cached) || cached.length === 0) {
    return INITIAL_PRODUCTS;
  }
  const seedMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
  const normalized = cached.map((item) => {
    const seed = seedMap.get(item.id);
    if (!seed) return item;
    const hasLegacyOrIncomplete =
      !item.images ||
      item.images.length < 4 ||
      item.images.some((img) => img.includes('sneaker_velocity_crimson'));
    return hasLegacyOrIncomplete ? { ...item, images: seed.images } : item;
  });
  const cachedIds = new Set(normalized.map((p) => p.id));
  const missingSeeds = INITIAL_PRODUCTS.filter((p) => !cachedIds.has(p.id));
  return missingSeeds.length > 0 ? [...normalized, ...missingSeeds] : normalized;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseReady, setFirebaseReady] = useState(isFirebaseConfigured);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>(hydrateInitialProducts);
  const [categories] = useState<CategoryRecord[]>(INITIAL_CATEGORIES);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() =>
    safeReadLS<StoreSettings>(LS_KEYS.DEMO_SETTINGS, DEFAULT_STORE_SETTINGS)
  );
  const [cart, setCart] = useState<CartItem[]>(() => safeReadLS<CartItem[]>(LS_KEYS.CART, []));
  const [wishlist, setWishlist] = useState<string[]>(() => safeReadLS<string[]>(LS_KEYS.WISHLIST, []));
  const [orders, setOrders] = useState<Order[]>(() => safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []));
  const [allOrders, setAllOrders] = useState<Order[]>(() => safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []));
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() =>
    safeReadLS<ContactMessage[]>(LS_KEYS.DEMO_MESSAGES, [])
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationHealth>({
    razorpayConfigured: false,
    whatsappConfigured: false,
  });

  const demoMode = !firebaseReady || user?.authMode === 'demo' || !user;

  const showToast = useCallback((message: string, tone: 'info' | 'success' | 'error' = 'info') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  // Check server integration health + Firestore connectivity
  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.integrations) {
          setIntegrations(data.integrations);
        }
      })
      .catch(() => {
        // Non-blocking
      });

    if (isFirebaseConfigured) {
      testConnection().then((ok) => setFirebaseReady(ok));
    }
  }, []);

  // Load public catalog & storeSettings from Firestore when available
  useEffect(() => {
    if (!db || !firebaseReady) return;

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Product);
          setProducts(list);
        }
      },
      (err) => {
        console.warn('Products listener fallback to local catalog:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'storeSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          setStoreSettings(snap.data() as StoreSettings);
        }
      },
      () => {
        // Keep default settings
      }
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, [firebaseReady]);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth || !db || !isFirebaseConfigured) {
      const savedDemo = safeReadLS<UserProfile | null>(LS_KEYS.DEMO_USER, null);
      if (savedDemo) setUser(savedDemo);
      setAuthReady(true);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        const savedDemo = safeReadLS<UserProfile | null>(LS_KEYS.DEMO_USER, null);
        setUser(savedDemo);
        setAuthReady(true);
        return;
      }

      // Clear any demo user when Firebase session is active
      localStorage.removeItem(LS_KEYS.DEMO_USER);
      const isAdminEmail =
        fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && fbUser.emailVerified;

      let isAdminDoc = false;
      if (db && !isAdminEmail) {
        try {
          const admSnap = await getDoc(doc(db, 'admins', fbUser.uid));
          isAdminDoc = admSnap.exists();
        } catch {
          isAdminDoc = false;
        }
      }

      const profile: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'SOLEVERSE Member',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        role: 'customer',
        isAdmin: isAdminEmail || isAdminDoc,
        authMode: 'firebase',
      };

      setUser(profile);
      setAuthReady(true);

      // Ensure user profile exists in Firestore
      if (db && fbUser.emailVerified) {
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          const existingSnap = await getDoc(userRef);
          if (!existingSnap.exists()) {
            await setDoc(userRef, {
              uid: fbUser.uid,
              displayName: profile.displayName.slice(0, 100),
              email: profile.email.slice(0, 160),
              photoURL: (profile.photoURL || '').slice(0, 500),
              role: 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const data = existingSnap.data();
            if (data.defaultAddress || data.phone) {
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      phone: data.phone,
                      defaultAddress: data.defaultAddress,
                    }
                  : prev
              );
            }
          }
        } catch (err) {
          console.warn('User profile sync note:', err);
        }
      }
    });

    return () => unsub();
  }, []);

  // Sync User Cart, Wishlist, and Orders when authenticated via Firebase
  useEffect(() => {
    if (!db || !user || user.authMode !== 'firebase') {
      const localOrders = safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []);
      if (user) {
        setOrders(localOrders.filter((o) => o.userId === user.uid));
        setAllOrders(user.isAdmin ? localOrders : []);
      } else {
        setOrders([]);
        setAllOrders([]);
      }
      return;
    }

    const firestore = db;

    const cartPath = `carts/${user.uid}`;
    const unsubCart = onSnapshot(
      doc(firestore, 'carts', user.uid),
      (snap) => {
        if (snap.exists()) {
          const items = (snap.data().items || []) as CartItem[];
          setCart(items);
          safeWriteLS(LS_KEYS.CART, items);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, cartPath);
      }
    );

    const wishPath = `wishlists/${user.uid}`;
    const unsubWish = onSnapshot(
      doc(firestore, 'wishlists', user.uid),
      (snap) => {
        if (snap.exists()) {
          const ids = (snap.data().productIds || []) as string[];
          setWishlist(ids);
          safeWriteLS(LS_KEYS.WISHLIST, ids);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, wishPath);
      }
    );

    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(snap.docs.map((d) => d.data() as Order));
      },
      () => {
        // Fallback query without composite index if index is still building
        const simpleQ = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
        getDocs(simpleQ)
          .then((s) => setOrders(s.docs.map((d) => d.data() as Order)))
          .catch((e) => handleFirestoreError(e, OperationType.LIST, 'orders'));
      }
    );

    let unsubAllOrders: (() => void) | undefined;
    let unsubMessages: (() => void) | undefined;

    if (user.isAdmin) {
      unsubAllOrders = onSnapshot(
        collection(firestore, 'orders'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Order);
          list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
          setAllOrders(list);
        },
        (err) => {
          console.warn('Admin orders listener error:', err.message);
        }
      );

      unsubMessages = onSnapshot(
        collection(firestore, 'contactMessages'),
        (snap) => {
          setContactMessages(snap.docs.map((d) => d.data() as ContactMessage));
        },
        () => {}
      );
    }

    return () => {
      unsubCart();
      unsubWish();
      unsubOrders();
      unsubAllOrders?.();
      unsubMessages?.();
    };
  }, [user]);

  const persistCart = useCallback(
    async (nextCart: CartItem[]) => {
      setCart(nextCart);
      safeWriteLS(LS_KEYS.CART, nextCart);
      if (db && user?.authMode === 'firebase') {
        const path = `carts/${user.uid}`;
        try {
          await setDoc(doc(db, 'carts', user.uid), {
            userId: user.uid,
            items: nextCart.slice(0, 50),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    },
    [user]
  );

  const persistWishlist = useCallback(
    async (nextIds: string[]) => {
      setWishlist(nextIds);
      safeWriteLS(LS_KEYS.WISHLIST, nextIds);
      if (db && user?.authMode === 'firebase') {
        const path = `wishlists/${user.uid}`;
        try {
          await setDoc(doc(db, 'wishlists', user.uid), {
            userId: user.uid,
            productIds: nextIds.slice(0, 100),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    },
    [user]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      showToast('Firebase configuration unavailable. Use Demo Mode sign-in below.', 'error');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
      showToast('Signed in with Google.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In cancelled';
      showToast(msg, 'error');
    }
  }, [showToast]);

  const signInDemoCustomer = useCallback(
    (name: string, email: string, phone?: string) => {
      const cleanId = `demo_${email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)}`;
      const demoUser: UserProfile = {
        uid: cleanId,
        displayName: name.trim() || 'Guest Collector',
        email: email.trim() || 'guest@soleverse.demo',
        phone: phone?.trim(),
        role: 'customer',
        isAdmin: false,
        authMode: 'demo',
      };
      setUser(demoUser);
      safeWriteLS(LS_KEYS.DEMO_USER, demoUser);
      setAuthModalOpen(false);
      showToast(`Signed in to Demo Mode as ${demoUser.displayName}.`, 'success');
    },
    [showToast]
  );

  const signInDemoAdmin = useCallback(() => {
    const demoAdmin: UserProfile = {
      uid: 'demo_admin_owner',
      displayName: 'SOLEVERSE Studio Admin (Demo)',
      email: 'admin@soleverse.demo',
      role: 'customer',
      isAdmin: true,
      authMode: 'demo',
    };
    setUser(demoAdmin);
    safeWriteLS(LS_KEYS.DEMO_USER, demoAdmin);
    setAuthModalOpen(false);
    showToast('Demo Admin preview enabled (local browser storage only).', 'info');
  }, [showToast]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(LS_KEYS.DEMO_USER);
    if (auth?.currentUser) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    showToast('Signed out.', 'info');
  }, [showToast]);

  const addToCart = useCallback(
    (
      product: Product,
      size: string,
      color: string,
      quantity = 1,
      customPalette?: ShoePalette
    ) => {
      const customKey = customPalette ? JSON.stringify(customPalette) : '';
      const itemId = `${product.id}__${size}__${color}__${customKey}`;
      const existingIdx = cart.findIndex((c) => c.id === itemId);

      let nextCart: CartItem[];
      if (existingIdx >= 0) {
        nextCart = cart.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item
        );
      } else {
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          name: customPalette ? `${product.name} (3D Bespoke)` : product.name,
          image: product.images[0],
          priceInr: product.priceInr,
          discountPercent: product.discountPercent,
          size,
          color,
          quantity,
          customPalette,
          isCustom: Boolean(customPalette),
        };
        nextCart = [...cart, newItem];
      }

      void persistCart(nextCart);
      showToast(`Added ${product.name} (${size}) to bag.`, 'success');
      setCartOpen(true);
    },
    [cart, persistCart, showToast]
  );

  const updateCartQty = useCallback(
    (itemId: string, quantity: number) => {
      const nextCart =
        quantity <= 0
          ? cart.filter((c) => c.id !== itemId)
          : cart.map((c) => (c.id === itemId ? { ...c, quantity: Math.min(10, quantity) } : c));
      void persistCart(nextCart);
    },
    [cart, persistCart]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      void persistCart(cart.filter((c) => c.id !== itemId));
      showToast('Removed item from bag.', 'info');
    },
    [cart, persistCart, showToast]
  );

  const clearCart = useCallback(() => {
    void persistCart([]);
  }, [persistCart]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const exists = wishlist.includes(productId);
      const next = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
      void persistWishlist(next);
      showToast(exists ? 'Removed from wishlist.' : 'Saved to wishlist.', 'info');
    },
    [wishlist, persistWishlist, showToast]
  );

  const { cartCount, cartSubtotalInr, cartDiscountInr, shippingInr, cartTotalInr } = useMemo(() => {
    let count = 0;
    let rawSubtotal = 0;
    let discountedSubtotal = 0;

    for (const item of cart) {
      count += item.quantity;
      rawSubtotal += item.priceInr * item.quantity;
      discountedSubtotal += getDiscountedPrice(item.priceInr, item.discountPercent) * item.quantity;
    }

    const discount = Math.max(0, rawSubtotal - discountedSubtotal);
    const threshold = storeSettings.freeShippingThresholdInr ?? DEFAULT_BRAND_CONFIG.shipping.freeThresholdInr;
    const shipping =
      discountedSubtotal === 0 || discountedSubtotal >= threshold
        ? 0
        : DEFAULT_BRAND_CONFIG.shipping.standardFeeInr;
    const total = discountedSubtotal + shipping;

    return {
      cartCount: count,
      cartSubtotalInr: rawSubtotal,
      cartDiscountInr: discount,
      shippingInr: shipping,
      cartTotalInr: total,
    };
  }, [cart, storeSettings.freeShippingThresholdInr]);

  const placeOrder = useCallback(
    async (payload: PlaceOrderPayload): Promise<Order> => {
      if (cart.length === 0) throw new Error('Your shopping bag is empty.');

      const orderId = `SV-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

      const items = cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        image: c.image,
        size: c.size,
        color: c.color,
        quantity: c.quantity,
        unitPriceInr: getDiscountedPrice(c.priceInr, c.discountPercent),
        ...(c.customPalette ? { customPalette: c.customPalette } : {}),
      }));

      const orderUid = user?.uid || 'guest_demo_customer';
      const nowIso = new Date().toISOString();

      const orderRecord: Order = {
        id: orderId,
        userId: orderUid,
        customerName: payload.customerName.trim(),
        customerEmail: payload.customerEmail.trim(),
        customerPhone: payload.customerPhone.trim(),
        deliveryAddress: {
          line1: payload.deliveryAddress.line1.trim(),
          ...(payload.deliveryAddress.line2 ? { line2: payload.deliveryAddress.line2.trim() } : {}),
          city: payload.deliveryAddress.city.trim(),
          state: payload.deliveryAddress.state.trim(),
          postalCode: payload.deliveryAddress.postalCode.trim(),
          country: payload.deliveryAddress.country.trim() || 'India',
        },
        items,
        subtotalInr: cartSubtotalInr,
        discountInr: cartDiscountInr,
        shippingInr,
        totalInr: cartTotalInr,
        paymentMethod: payload.paymentMethod,
        paymentStatus:
          payload.paymentMethod === 'COD'
            ? 'COD_DUE'
            : payload.razorpayPaymentId
              ? 'PAID'
              : 'PENDING',
        ...(payload.razorpayOrderId ? { razorpayOrderId: payload.razorpayOrderId } : {}),
        ...(payload.razorpayPaymentId ? { razorpayPaymentId: payload.razorpayPaymentId } : {}),
        status: 'PLACED',
        trackingCode: `TRK-${orderId.slice(3)}`,
        ...(payload.notes ? { notes: payload.notes.trim().slice(0, 500) } : {}),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (db && user?.authMode === 'firebase') {
        const orderPath = `orders/${orderId}`;
        try {
          await setDoc(doc(db, 'orders', orderId), {
            ...orderRecord,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, orderPath);
        }
      } else {
        const existing = safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []);
        const updated = [orderRecord, ...existing];
        safeWriteLS(LS_KEYS.DEMO_ORDERS, updated);
        setOrders(updated.filter((o) => o.userId === orderUid));
        if (user?.isAdmin) setAllOrders(updated);
      }

      clearCart();
      return orderRecord;
    },
    [cart, cartDiscountInr, cartSubtotalInr, cartTotalInr, clearCart, shippingInr, user]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (db && user?.authMode === 'firebase') {
        const path = `orders/${orderId}`;
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'CANCELLED',
            updatedAt: serverTimestamp(),
          });
          showToast('Order cancelled.', 'info');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const existing = safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []);
        const updated = existing.map((o) =>
          o.id === orderId ? { ...o, status: 'CANCELLED' as OrderStatus, updatedAt: new Date().toISOString() } : o
        );
        safeWriteLS(LS_KEYS.DEMO_ORDERS, updated);
        setOrders(updated.filter((o) => o.userId === (user?.uid || 'guest_demo_customer')));
        if (user?.isAdmin) setAllOrders(updated);
        showToast('Order cancelled (Demo Mode).', 'info');
      }
    },
    [showToast, user]
  );

  const adminUpdateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, trackingCode?: string) => {
      if (!user?.isAdmin) {
        showToast('Administrator privileges required.', 'error');
        return;
      }
      if (db && user.authMode === 'firebase') {
        const path = `orders/${orderId}`;
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status,
            ...(trackingCode ? { trackingCode } : {}),
            updatedAt: serverTimestamp(),
          });
          showToast(`Order ${orderId} updated to ${status}.`, 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const existing = safeReadLS<Order[]>(LS_KEYS.DEMO_ORDERS, []);
        const updated = existing.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                ...(trackingCode ? { trackingCode } : {}),
                updatedAt: new Date().toISOString(),
              }
            : o
        );
        safeWriteLS(LS_KEYS.DEMO_ORDERS, updated);
        setAllOrders(updated);
        setOrders(updated.filter((o) => o.userId === user.uid));
        showToast(`Order ${orderId} updated to ${status} (Demo Mode).`, 'success');
      }
    },
    [showToast, user]
  );

  const adminUpsertProduct = useCallback(
    async (product: Product) => {
      if (!user?.isAdmin) {
        showToast('Administrator privileges required.', 'error');
        return;
      }
      const cleanId = product.id.replace(/[^a-zA-Z0-9_-]/g, '-');
      const nowIso = new Date().toISOString();
      const record: Product = {
        ...product,
        id: cleanId,
        slug: product.slug || cleanId,
        updatedAt: nowIso,
        createdAt: product.createdAt || nowIso,
      };

      if (db && user.authMode === 'firebase') {
        const path = `products/${cleanId}`;
        try {
          const existingSnap = await getDoc(doc(db, 'products', cleanId));
          await setDoc(doc(db, 'products', cleanId), {
            ...record,
            createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          showToast(`Saved ${product.name} to Firestore.`, 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      } else {
        setProducts((prev) => {
          const exists = prev.some((p) => p.id === cleanId);
          const next = exists ? prev.map((p) => (p.id === cleanId ? record : p)) : [record, ...prev];
          safeWriteLS(LS_KEYS.DEMO_PRODUCTS, next);
          return next;
        });
        showToast(`Saved ${product.name} (Demo Mode).`, 'success');
      }
    },
    [showToast, user]
  );

  const adminDeleteProduct = useCallback(
    async (productId: string) => {
      if (!user?.isAdmin) {
        showToast('Administrator privileges required.', 'error');
        return;
      }
      if (db && user.authMode === 'firebase') {
        const path = `products/${productId}`;
        try {
          await deleteDoc(doc(db, 'products', productId));
          showToast('Product deleted from Firestore.', 'info');
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      } else {
        setProducts((prev) => {
          const next = prev.filter((p) => p.id !== productId);
          safeWriteLS(LS_KEYS.DEMO_PRODUCTS, next);
          return next;
        });
        showToast('Product removed (Demo Mode).', 'info');
      }
    },
    [showToast, user]
  );

  const adminSaveSettings = useCallback(
    async (settings: StoreSettings) => {
      if (!user?.isAdmin) {
        showToast('Administrator privileges required.', 'error');
        return;
      }
      if (db && user.authMode === 'firebase') {
        const path = 'storeSettings/main';
        try {
          await setDoc(doc(db, 'storeSettings', 'main'), {
            ...settings,
            updatedAt: serverTimestamp(),
          });
          setStoreSettings(settings);
          showToast('Store settings saved to Firestore.', 'success');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      } else {
        setStoreSettings(settings);
        safeWriteLS(LS_KEYS.DEMO_SETTINGS, settings);
        showToast('Store settings saved (Demo Mode).', 'success');
      }
    },
    [showToast, user]
  );

  const adminSeedCatalog = useCallback(async () => {
    if (!user?.isAdmin || user.authMode !== 'firebase' || !db) {
      showToast('Sign in with Firebase Admin Google account to seed Firestore.', 'error');
      return;
    }
    try {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await setDoc(doc(db, 'storeSettings', 'main'), {
        ...DEFAULT_STORE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      showToast('Seeded 16 products, 7 categories, and store settings to Firestore.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  }, [showToast, user]);

  const submitContactMessage = useCallback(
    async (msg: { name: string; email: string; subject: string; message: string }) => {
      const id = `msg_${Date.now()}`;
      const record: ContactMessage = {
        id,
        name: msg.name.trim(),
        email: msg.email.trim(),
        subject: msg.subject.trim(),
        message: msg.message.trim(),
        ...(user?.authMode === 'firebase' ? { userId: user.uid } : {}),
        createdAt: new Date().toISOString(),
      };

      if (db && firebaseReady) {
        try {
          await setDoc(doc(db, 'contactMessages', id), {
            ...record,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `contactMessages/${id}`);
        }
      } else {
        const prev = safeReadLS<ContactMessage[]>(LS_KEYS.DEMO_MESSAGES, []);
        const next = [record, ...prev];
        safeWriteLS(LS_KEYS.DEMO_MESSAGES, next);
        setContactMessages(next);
      }
      showToast('Support inquiry sent. Our concierge will respond shortly.', 'success');
    },
    [firebaseReady, showToast, user]
  );

  const subscribeNewsletter = useCallback(
    async (email: string) => {
      const id = `sub_${email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 48)}`;
      if (db && firebaseReady) {
        try {
          await setDoc(doc(db, 'newsletterSubscribers', id), {
            id,
            email: email.trim().toLowerCase(),
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `newsletterSubscribers/${id}`);
        }
      }
      showToast('Subscribed to SOLEVERSE release dispatches.', 'success');
    },
    [firebaseReady, showToast]
  );

  const value: StoreContextValue = {
    products,
    categories,
    storeSettings,
    user,
    authReady,
    firebaseReady,
    demoMode,
    cart,
    wishlist,
    orders,
    allOrders,
    contactMessages,
    cartCount,
    cartSubtotalInr,
    cartDiscountInr,
    shippingInr,
    cartTotalInr,
    cartOpen,
    authModalOpen,
    searchOpen,
    toast,
    integrations,
    setCartOpen,
    setAuthModalOpen,
    setSearchOpen,
    showToast,
    signInWithGoogle,
    signInDemoCustomer,
    signInDemoAdmin,
    signOut,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
    placeOrder,
    cancelOrder,
    adminUpdateOrderStatus,
    adminUpsertProduct,
    adminDeleteProduct,
    adminSaveSettings,
    adminSeedCatalog,
    submitContactMessage,
    subscribeNewsletter,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
