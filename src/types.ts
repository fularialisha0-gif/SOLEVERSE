export type ProductCategory =
  | 'New Arrivals'
  | 'Best Sellers'
  | 'Running Shoes'
  | 'Sports Shoes'
  | 'Streetwear'
  | 'Luxury Collection'
  | 'Limited Edition';

export interface ShoePalette {
  upper: string;
  midsole: string;
  cage: string;
  outsole: string;
  laces: string;
  finish?: 'matte' | 'metallic' | 'suede' | 'chrome';
}

export interface ProductSpecs {
  upper: string;
  midsole: string;
  outsole: string;
  weight: string;
  drop: string;
  origin: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  categories: ProductCategory[];
  priceInr: number;
  discountPercent: number;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  specs?: ProductSpecs;
  stock: number;
  rating: number;
  reviewCount?: number;
  featured: boolean;
  has3DPreview?: boolean;
  shoePalette?: ShoePalette;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CategoryRecord {
  id: string;
  name: ProductCategory;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  priceInr: number;
  discountPercent: number;
  size: string;
  color: string;
  quantity: number;
  customPalette?: ShoePalette;
  isCustom?: boolean;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'COD_DUE' | 'FAILED';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPriceInr: number;
  customPalette?: ShoePalette;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
  subtotalInr: number;
  discountInr: number;
  shippingInr: number;
  totalInr: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  trackingCode?: string;
  notes?: string;
  createdAt: string | unknown;
  updatedAt: string | unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'customer';
  defaultAddress?: DeliveryAddress;
  isAdmin?: boolean;
  authMode: 'firebase' | 'demo';
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  heroTitle: string;
  heroSubtitle: string;
  freeShippingThresholdInr: number;
  updatedAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
  createdAt: string | unknown;
}

export type AppRoute =
  | { page: 'home' }
  | { page: 'collections'; category?: string; query?: string }
  | { page: 'product'; productId: string }
  | { page: 'customiser'; productId?: string }
  | { page: 'checkout' }
  | { page: 'orders'; highlightOrderId?: string }
  | { page: 'about' }
  | { page: 'support' }
  | { page: 'admin' }
  | { page: 'legal'; doc: 'privacy' | 'terms' | 'returns' };
