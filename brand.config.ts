import { ProductCategory, StoreSettings } from '../types';

/**
 * SOLEVERSE White-Label Brand Configuration
 * Edit this module (or update live via Admin Dashboard -> Store Settings)
 * to rebrand the entire storefront for any future footwear client.
 */
export interface BrandConfig {
  brandName: string;
  tagline: string;
  logoText: string;
  colors: {
    background: string;
    surface: string;
    metallicSilver: string;
    white: string;
    accentBlue: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  contact: {
    email: string;
    supportHours: string;
    phone: string;
    whatsappNumber: string;
    studioAddress: string;
    socials: {
      instagram: string;
      x: string;
      youtube: string;
    };
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    atelierImage: string;
  };
  about: {
    manifesto: string;
    secondaryStory: string;
    pillars: { title: string; detail: string }[];
  };
  shipping: {
    freeThresholdInr: number;
    standardFeeInr: number;
    codFeeInr: number;
  };
  categories: ProductCategory[];
  legal: {
    copyright: string;
    privacy: string[];
    terms: string[];
    returns: string[];
  };
}

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: 'SOLEVERSE',
  tagline: 'BEYOND EVERY STEP.',
  logoText: 'SOLEVERSE',
  colors: {
    background: '#090A0D',
    surface: '#111318',
    metallicSilver: '#A1AAB8',
    white: '#F4F6FA',
    accentBlue: '#2563EB',
  },
  fonts: {
    display: 'Outfit',
    body: 'Plus Jakarta Sans',
    mono: 'JetBrains Mono',
  },
  contact: {
    email: 'concierge@soleverse.in',
    supportHours: 'Mon – Sat · 09:00 – 20:00 IST',
    phone: '+91 22 4890 7720',
    whatsappNumber: '919820012345',
    studioAddress: 'Level 4, Obsidian Design House, Lower Parel, Mumbai 400013',
    socials: {
      instagram: 'https://instagram.com',
      x: 'https://x.com',
      youtube: 'https://youtube.com',
    },
  },
  hero: {
    kicker: 'FUTURISTIC LUXURY STUDIO',
    title: 'BEYOND EVERY STEP.',
    subtitle: 'Engineered for movement. Designed to stand out.',
    primaryCta: 'Shop Now',
    secondaryCta: 'Explore Collection',
    atelierImage: '/images/brand_atelier_hero_1795428857556.jpg',
  },
  about: {
    manifesto:
      'SOLEVERSE was created for people who believe footwear is more than fashion. Every step represents individuality, innovation and limitless possibilities.',
    secondaryStory:
      'Born inside an independent industrial footwear studio, SOLEVERSE merges biomechanical propulsion with minimalist luxury craftsmanship. Each silhouette is drafted on bespoke ergonomic lasts before being assembled with ballistic weaves, brushed metals, and high-rebound elastomers.',
    pillars: [
      {
        title: '01. Architectural Lasting',
        detail:
          'Every outsole geometry and metallic heel stabilizer is tension-tested before tooling, balancing ultra-lightweight responsiveness with sculptural presence.',
      },
      {
        title: '02. Tactile Material Craft',
        detail:
          'We pair carbon-weave technical knits, Italian calfskin accents, and brushed metallic hardware for longevity across high-mileage runs and city concrete.',
      },
      {
        title: '03. Bespoke Expression',
        detail:
          'Through our Bespoke Studio configurator, wearers tailor material finishes and chromatic zones so every pair reflects individual intent.',
      },
    ],
  },
  shipping: {
    freeThresholdInr: 12000,
    standardFeeInr: 499,
    codFeeInr: 0,
  },
  categories: [
    'New Arrivals',
    'Best Sellers',
    'Running Shoes',
    'Sports Shoes',
    'Streetwear',
    'Luxury Collection',
    'Limited Edition',
  ],
  legal: {
    copyright: '© 2026 SOLEVERSE Footwear Studio Pvt. Ltd. All rights reserved.',
    privacy: [
      'SOLEVERSE collects only the customer information necessary to process orders, persist your saved bag and wishlist, and provide order tracking and delivery notifications.',
      'Personal contact details, phone numbers, and delivery addresses are isolated per authenticated account and are never sold or shared with third-party advertisers.',
      'Payment verification is handled exclusively through configured server-side payment gateways (Razorpay) or Cash on Delivery without storing raw card credentials on SOLEVERSE servers.',
    ],
    terms: [
      'All prices on SOLEVERSE are listed in Indian Rupees (INR) inclusive of applicable GST unless explicitly noted at checkout.',
      'Customised 3D footwear configurations are built to order and ship within 5–7 business days from our Mumbai atelier.',
      'Order cancellations are permitted directly from your Order History while the order remains in the PLACED status prior to dispatch.',
    ],
    returns: [
      'Unworn standard-collection footwear in original packaging with intact tags may be returned or exchanged for another UK size within 14 days of delivery.',
      'Complimentary reverse pickup is available across major Indian metro pin codes. Refunds for prepaid orders settle to the original payment method within 5–7 business days.',
      'Bespoke 3D Customiser pairs are eligible for size exchange or manufacturing defect replacement only.',
    ],
  },
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  brandName: DEFAULT_BRAND_CONFIG.brandName,
  tagline: DEFAULT_BRAND_CONFIG.tagline,
  accentColor: DEFAULT_BRAND_CONFIG.colors.accentBlue,
  contactEmail: DEFAULT_BRAND_CONFIG.contact.email,
  contactPhone: DEFAULT_BRAND_CONFIG.contact.phone,
  whatsappNumber: DEFAULT_BRAND_CONFIG.contact.whatsappNumber,
  heroTitle: DEFAULT_BRAND_CONFIG.hero.title,
  heroSubtitle: DEFAULT_BRAND_CONFIG.hero.subtitle,
  freeShippingThresholdInr: DEFAULT_BRAND_CONFIG.shipping.freeThresholdInr,
};
