import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Check, Sliders, Star } from 'lucide-react';
import { StudioBackdrop3D } from '../components/StudioBackdrop3D';
import { ShowroomHeroStage } from '../components/ShowroomHeroStage';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { DEFAULT_BRAND_CONFIG } from '../config/brand.config';
import {
  formatINR,
  getDiscountedPrice,
  IMG_AERO,
  IMG_APEX,
  IMG_COURT_SIDE,
  IMG_ECLIPSE,
  IMG_FEATURED_TRIPTYCH,
  IMG_KINETIC,
  IMG_LIMITED_VAULT,
  IMG_MONOLITH,
  IMG_RUNNING_BANNER,
  IMG_STRATA,
} from '../data/catalog';
import { AppRoute, Product, ProductCategory } from '../types';

interface HomePageProps {
  navigate: (route: AppRoute) => void;
}

const COLLECTION_GATEWAY_IMAGES: Record<ProductCategory, string> = {
  'New Arrivals': IMG_AERO,
  'Best Sellers': IMG_KINETIC,
  'Running Shoes': IMG_RUNNING_BANNER,
  'Sports Shoes': IMG_COURT_SIDE,
  Streetwear: IMG_APEX,
  'Luxury Collection': IMG_MONOLITH,
  'Limited Edition': IMG_ECLIPSE,
};

const CUSTOMER_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Aarav Kulkarni',
    city: 'Mumbai',
    model: 'Aero-X1 Obsidian Carbon',
    rating: 5.0,
    quote:
      'Ran a 10K coastal tempo in the Aero-X1 Obsidian. Forefoot carbon rebound stays crisp through wet tarmac and the brushed silver heel cage draws attention immediately.',
  },
  {
    id: 'rev-2',
    name: 'Meera Nair',
    city: 'Bengaluru',
    model: 'Kinetic Pulse Cobalt Pro',
    rating: 4.9,
    quote:
      'Packaging, knit breathability, and underfoot cobalt cushioning feel genuinely bespoke. Zero break-in soreness straight out of the studio box.',
  },
  {
    id: 'rev-3',
    name: 'Kabir Malhotra',
    city: 'New Delhi',
    model: 'Monolith 01 Platinum',
    rating: 5.0,
    quote:
      'Minimalist leather tailoring with architectural precision. Easily rivals European designer sneakers twice the price while staying comfortable for twelve-hour gallery days.',
  },
  {
    id: 'rev-4',
    name: 'Rohan Deshmukh',
    city: 'Pune',
    model: 'Volta XV Carbon Court',
    rating: 4.8,
    quote:
      'Hard lateral cuts on indoor hardwood feel completely locked in. The electric-blue herringbone sole grips without squeak or heel slip.',
  },
];

function selectCategorySlice(
  products: Product[],
  category: ProductCategory,
  count = 4,
  preferPrimaryCategory = true
): Product[] {
  const primary = products.filter((p) => p.category === category);
  const secondary = products.filter(
    (p) => p.category !== category && p.categories.includes(category)
  );
  const ordered = preferPrimaryCategory ? [...primary, ...secondary] : [...secondary, ...primary];
  return ordered.slice(0, count);
}

interface SectionHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentClass?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  kicker,
  title,
  subtitle,
  actionLabel,
  onAction,
  accentClass = 'text-[#60A5FA]',
}) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
    <div className="space-y-1.5 max-w-2xl">
      <p className={`text-xs font-medium tracking-[0.22em] uppercase ${accentClass}`}>{kicker}</p>
      <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">{subtitle}</p>}
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#93C5FD] hover:text-white transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { products, categories, storeSettings, subscribeNewsletter } = useStore();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [trendingCat, setTrendingCat] = useState<string>('All');
  const [exploreTab, setExploreTab] = useState<number>(0);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);
  const [newsletterBusy, setNewsletterBusy] = useState<boolean>(false);

  const heroPrimary = useMemo(
    () => products.find((p) => p.id === 'sv-aero-x1-obsidian') || products[0],
    [products]
  );
  const heroSecondary = useMemo(
    () => products.find((p) => p.id === 'sv-kinetic-cobalt-pro') || products[1] || products[0],
    [products]
  );

  // Curated 4-item slices (2 per row mobile, 4 per row desktop)
  const trendingProducts = useMemo(() => {
    const base =
      trendingCat === 'All'
        ? products.filter((p) => p.featured || p.categories.includes('Best Sellers'))
        : products.filter(
            (p) => p.category === trendingCat || p.categories.includes(trendingCat as ProductCategory)
          );
    return base.slice(0, 4);
  }, [products, trendingCat]);

  const newArrivalsProducts = useMemo(
    () => selectCategorySlice(products, 'New Arrivals', 4),
    [products]
  );
  const bestSellersProducts = useMemo(
    () =>
      [...products]
        .filter((p) => p.categories.includes('Best Sellers'))
        .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        .slice(0, 4),
    [products]
  );
  const runningProducts = useMemo(
    () => selectCategorySlice(products, 'Running Shoes', 4),
    [products]
  );
  const sportsProducts = useMemo(
    () => selectCategorySlice(products, 'Sports Shoes', 4),
    [products]
  );
  const luxuryProducts = useMemo(
    () => selectCategorySlice(products, 'Luxury Collection', 4),
    [products]
  );
  const streetwearProducts = useMemo(
    () => selectCategorySlice(products, 'Streetwear', 4),
    [products]
  );
  const limitedProducts = useMemo(
    () => selectCategorySlice(products, 'Limited Edition', 4),
    [products]
  );
  const specialOffersProducts = useMemo(
    () =>
      [...products]
        .filter((p) => p.discountPercent > 0)
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, 4),
    [products]
  );
  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.featured)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4),
    [products]
  );

  const featuredStageRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: featuredScroll } = useScroll({
    target: featuredStageRef,
    offset: ['start end', 'end start'],
  });
  const featuredScale = useTransform(featuredScroll, [0, 0.5, 1], [1.06, 1, 1.04]);
  const featuredTiltX = useTransform(featuredScroll, [0, 0.5, 1], [4, 0, -2]);

  const storyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: storyScroll } = useScroll({
    target: storyRef,
    offset: ['start end', 'end start'],
  });
  const storyParallaxY = useTransform(storyScroll, [0, 1], [20, -20]);

  const exploreTabs = [
    {
      title: 'Obsidian Carbon System',
      detail:
        'Forked full-length carbon fiber propulsion plates encased in dual-density supercritical PEBA foam.',
      image: IMG_FEATURED_TRIPTYCH,
      targetCategory: 'Running Shoes' as ProductCategory,
    },
    {
      title: 'Liquid Chrome Metallurgy',
      detail:
        'Vacuum-plated articulated exoskeleton cages paired with smoked cryo-translucent nitrogen air pods.',
      image: IMG_LIMITED_VAULT,
      targetCategory: 'Limited Edition' as ProductCategory,
    },
    {
      title: 'Tactile Atelier Calfskin',
      detail:
        'LWG-certified brushed stone suede and full-grain leather lasted in quiet monochromatic proportions.',
      image: IMG_STRATA,
      targetCategory: 'Luxury Collection' as ProductCategory,
    },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterBusy(true);
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail('');
      setNewsletterSubscribed(true);
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <div className="bg-[#06070B] text-[#F4F6FA] overflow-x-clip">
      {/* ====================================================================
          1. PREMIUM HOMEPAGE HERO — TWIN-SNEAKER 3D FUTURISTIC STUDIO CAMPAIGN
      ==================================================================== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center border-b border-white/10 overflow-hidden bg-[#06070B]">
        {/* Architectural Luxury Studio 3D WebGL + Atmospheric Lighting Layer */}
        <StudioBackdrop3D pointerRef={pointerRef} prefersReducedMotion={prefersReducedMotion} />

        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center relative z-10">
          {/* LEFT EDITORIAL COLUMN */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-7 order-2 lg:order-1"
          >
            <p className="text-xs font-semibold tracking-[0.26em] uppercase text-[#60A5FA]">
              {storeSettings.brandName} · Twin-Silhouette Flagship Campaign
            </p>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-6xl xl:text-[4.5rem] font-bold tracking-tight text-white leading-[0.96] text-balance">
                BEYOND EVERY{' '}
                <span className="bg-gradient-to-r from-[#F8FAFC] via-[#CBD5E1] to-[#3B82F6] bg-clip-text text-transparent">
                  STEP.
                </span>
              </h1>
              <p className="font-display text-lg sm:text-xl font-medium text-[#CBD5E1] tracking-wide">
                Engineered for movement. Designed to stand out.
              </p>
              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-md">
                Dual-architecture footwear sculpted in matte obsidian carbon weave, brushed titanium
                hardware, and pressurized electric-blue nitrogen cushioning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => navigate({ page: 'collections' })}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#0891B2] hover:from-[#1D4ED8] hover:to-[#06B6D4] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg transition-all shadow-lg shadow-[#2563EB]/25 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('shop-collection');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else navigate({ page: 'collections' });
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#0E1118]/95 hover:bg-[#171C28] border border-white/15 hover:border-[#60A5FA]/50 text-[#F4F6FA] text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explore Collection</span>
              </button>
            </div>

            {/* Clean Material & Spec Index (No pills, no status dots) */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-mono-num text-[#64748B] block">01</span>
                <span className="text-white font-medium mt-1 block">Carbon Mono-Mesh</span>
              </div>
              <div>
                <span className="font-mono-num text-[#64748B] block">02</span>
                <span className="text-white font-medium mt-1 block">Titanium Heel Cage</span>
              </div>
              <div>
                <span className="font-mono-num text-[#64748B] block">03</span>
                <span className="text-[#60A5FA] font-medium mt-1 block">Nitrogen Air Core</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT 3D TWIN-SNEAKER STUDIO STAGE */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
            className="lg:col-span-7 order-1 lg:order-2"
          >
            <ShowroomHeroStage
              primarySneaker={{
                id: heroPrimary.id,
                name: heroPrimary.name,
                subtitle: 'Edition 01 · Obsidian',
                priceFormatted: formatINR(
                  getDiscountedPrice(heroPrimary.priceInr, heroPrimary.discountPercent)
                ),
              }}
              secondarySneaker={{
                id: heroSecondary.id,
                name: heroSecondary.name,
                subtitle: 'Edition 02 · Alabaster',
                priceFormatted: formatINR(
                  getDiscountedPrice(heroSecondary.priceInr, heroSecondary.discountPercent)
                ),
              }}
              onInspect={(productId) => navigate({ page: 'product', productId })}
              onPointerShift={(x, y) => {
                pointerRef.current = { x, y };
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          2. SHOP COLLECTION — ARCHITECTURAL CATEGORY GATEWAY
      ==================================================================== */}
      <section
        id="shop-collection"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-8"
      >
        <SectionHeader
          kicker="Shop Collection"
          title="Seven Architectural Footwear Lines"
          subtitle="Select a discipline below to inspect full-angle silhouettes engineered for running, court torque, streetwear utility, and luxury tailoring."
          actionLabel="View Full Catalog"
          onAction={() => navigate({ page: 'collections' })}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.category === cat.name || p.categories.includes(cat.name)
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() => navigate({ page: 'collections', category: cat.name })}
                className="group bg-[#0E1118] border border-white/10 hover:border-[#2563EB]/60 rounded-xl overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#07080D] overflow-hidden relative">
                  <img
                    src={COLLECTION_GATEWAY_IMAGES[cat.name] || IMG_AERO}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-300"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#0E1118] via-transparent to-transparent"
                  />
                </div>
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-1.5">
                  <h3 className="font-display text-xs sm:text-sm font-semibold text-white group-hover:text-[#93C5FD] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] font-mono-num text-[#64748B]">{count} models</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          3. EXPLORE MORE — INTERACTIVE MATERIAL & ATELIER HUB
      ==================================================================== */}
      <section className="border-y border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-8">
          <SectionHeader
            kicker="Explore More"
            title="Engineering & Studio Perspectives"
            subtitle="Switch architectural studies to explore how propulsion, metallurgy, and bespoke craftsmanship shape each pair."
            actionLabel="Open Bespoke Studio"
            onAction={() => navigate({ page: 'customiser' })}
            accentClass="text-[#22D3EE]"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 relative aspect-[16/10] bg-[#07080D] border border-white/10 rounded-2xl overflow-hidden">
              <img
                src={exploreTabs[exploreTab].image}
                alt={exploreTabs[exploreTab].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
              />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1 max-w-lg">
                  <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#60A5FA]">
                    Study 0{exploreTab + 1}
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-bold text-white">
                    {exploreTabs[exploreTab].title}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate({
                      page: 'collections',
                      category: exploreTabs[exploreTab].targetCategory,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Explore {exploreTabs[exploreTab].targetCategory}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                {exploreTabs.map((tab, idx) => (
                  <button
                    key={tab.title}
                    onClick={() => setExploreTab(idx)}
                    className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer ${
                      exploreTab === idx
                        ? 'bg-[#121622] border-[#2563EB]'
                        : 'bg-[#0E1118] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono-num text-xs text-[#60A5FA]">0{idx + 1}</span>
                      <span className="text-[11px] text-[#64748B]">{tab.targetCategory}</span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-white mt-1.5">
                      {tab.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 leading-relaxed">
                      {tab.detail}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate({ page: 'customiser' })}
                className="w-full py-3.5 px-5 bg-[#0E1118] hover:bg-[#171C28] border border-white/15 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-[#60A5FA]" />
                <span>Configure Custom Colorway in Bespoke Studio</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. TRENDING NOW — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section
        id="trending-now"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#60A5FA]">
              Most Coveted Right Now
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">Trending Now</h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'Running Shoes', 'Sports Shoes', 'Streetwear', 'Luxury Collection'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setTrendingCat(cat)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    trendingCat === cat
                      ? 'bg-[#2563EB] border-[#2563EB] text-white'
                      : 'bg-[#0E1118] border-white/10 text-[#A1AAB8] hover:text-white'
                  }`}
                >
                  {cat === 'All' ? 'All Trending' : cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {trendingProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          5. NEW ARRIVALS — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section className="border-y border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
          <SectionHeader
            kicker="Seasonal Drops"
            title="New Arrivals"
            subtitle="Fresh releases straight from our prototyping atelier."
            actionLabel="Shop New Arrivals"
            onAction={() => navigate({ page: 'collections', category: 'New Arrivals' })}
            accentClass="text-[#22D3EE]"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {newArrivalsProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(productId) => navigate({ page: 'product', productId })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. BEST SELLERS — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
        <SectionHeader
          kicker="Highest Rated Rotation"
          title="Best Sellers"
          subtitle="Proven icons backed by runner and collector reviews across India."
          actionLabel="View All Best Sellers"
          onAction={() => navigate({ page: 'collections', category: 'Best Sellers' })}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {bestSellersProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          7. RUNNING SHOES — PERFORMANCE CAMPAIGN + 2x2 MOBILE / 4x1 DESKTOP
      ==================================================================== */}
      <section className="border-y border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#0E1118] border border-white/10 rounded-2xl overflow-hidden">
            <div className="lg:col-span-6 aspect-[16/9] lg:h-full bg-[#07080D] overflow-hidden">
              <img
                src={IMG_RUNNING_BANNER}
                alt="SOLEVERSE Carbon Running Footwear Campaign"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-4">
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#60A5FA]">
                Carbon Propulsion Series
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">
                Running Shoes
              </h2>
              <p className="text-sm text-[#A1AAB8] leading-relaxed">
                Supercritical PEBAX nitrogen foams and forked carbon plates engineered for wet road
                grip and marathon energy return.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-mono-num text-[#CBD5E1]">
                <span>198 g Ultra-Light</span>
                <span>·</span>
                <span>8 mm Offset</span>
                <span>·</span>
                <span>Wet-Grip Silica</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate({ page: 'collections', category: 'Running Shoes' })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Shop Running Shoes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {runningProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(productId) => navigate({ page: 'product', productId })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. SPORTS SHOES — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
        <SectionHeader
          kicker="Court & Agility"
          title="Sports Shoes"
          subtitle="Lateral torsion shanks and electric-blue herringbone outsoles built for high-torque containment."
          actionLabel="Shop Sports Shoes"
          onAction={() => navigate({ page: 'collections', category: 'Sports Shoes' })}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {sportsProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          9. LUXURY COLLECTION — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section className="border-y border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
          <SectionHeader
            kicker="Quiet Sartorial Tailoring"
            title="Luxury Collection"
            subtitle="Hand-lasted Italian calfskin, brushed platinum finishes, and monolithic stitched cupsoles."
            actionLabel="Explore Luxury Collection"
            onAction={() => navigate({ page: 'collections', category: 'Luxury Collection' })}
            accentClass="text-[#CBD5E1]"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {luxuryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(productId) => navigate({ page: 'product', productId })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. STREETWEAR COLLECTION — 2 PER ROW MOBILE / 4 PER ROW DESKTOP
      ==================================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
        <SectionHeader
          kicker="Urban Architecture"
          title="Streetwear Collection"
          subtitle="Tactical high-collar utility, matte slate nubuck overlays, and articulated deep-lug treads."
          actionLabel="Shop Streetwear"
          onAction={() => navigate({ page: 'collections', category: 'Streetwear' })}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {streetwearProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          11. EXCLUSIVE LIMITED EDITIONS — VAULT CAMPAIGN + 2/4 GRID
      ==================================================================== */}
      <section className="border-y border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#0E1118] border border-white/10 rounded-2xl overflow-hidden">
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-4 order-2 lg:order-1">
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#60A5FA]">
                Numbered Collector Series
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white">
                Exclusive Limited Editions
              </h2>
              <p className="text-sm text-[#A1AAB8] leading-relaxed">
                Micro-batch sculptural silhouettes crafted with liquid-chrome hardware, serialized
                heel plates, and smoked cryo air chambers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate({ page: 'collections', category: 'Limited Edition' })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Enter Collector Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 aspect-[16/9] lg:h-full bg-[#07080D] overflow-hidden order-1 lg:order-2">
              <img
                src={IMG_LIMITED_VAULT}
                alt="SOLEVERSE Exclusive Limited Edition Liquid Chrome Vault"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {limitedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(productId) => navigate({ page: 'product', productId })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. SPECIAL OFFERS — PRIVILEGE ARCHIVE MARKDOWNS
      ==================================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-7">
        <SectionHeader
          kicker="Seasonal Privilege"
          title="Special Offers"
          subtitle="Direct studio savings up to 20% off select technical and streetwear footwear models."
          actionLabel="View All Offers"
          onAction={() => navigate({ page: 'collections' })}
          accentClass="text-[#22D3EE]"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {specialOffersProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(productId) => navigate({ page: 'product', productId })}
            />
          ))}
        </div>
      </section>

      {/* ====================================================================
          13. FEATURED PRODUCTS — 3D SCROLL-TILT STAGE + 4 FLAGSHIP SILHOUETTES
      ==================================================================== */}
      <section
        ref={featuredStageRef}
        className="border-y border-white/10 bg-[#0A0C12] py-14 lg:py-20"
        style={{ perspective: '1400px' }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
          <SectionHeader
            kicker="Flagship Signatures"
            title="Featured Products"
            subtitle="Our defining silhouettes combining proprietary propulsion plates with brushed silver and obsidian finishes."
            actionLabel="Inspect Full Lineup"
            onAction={() => navigate({ page: 'collections' })}
          />

          <motion.div
            style={{
              rotateX: prefersReducedMotion ? 0 : featuredTiltX,
              transformStyle: 'preserve-3d',
            }}
            className="rounded-2xl overflow-hidden border border-white/10 bg-[#07080D] relative aspect-[21/9] min-h-[200px]"
          >
            <motion.img
              style={{ scale: prefersReducedMotion ? 1 : featuredScale }}
              src={IMG_FEATURED_TRIPTYCH}
              alt="SOLEVERSE Featured Flagship Trio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
            />
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#CBD5E1]">
              <span>SOLEVERSE Flagship Lineup · Obsidian, Titanium & Electric Blue</span>
              <span className="font-mono-num text-[#60A5FA]">04 Featured Silhouettes</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(productId) => navigate({ page: 'product', productId })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          14. BRAND STORY — ATELIER MANIFESTO & ENGINEERING PILLARS
      ==================================================================== */}
      <section ref={storyRef} className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/10 min-h-[340px] bg-[#07080B]">
            <motion.img
              style={{ y: prefersReducedMotion ? 0 : storyParallaxY, scale: 1.07 }}
              src={DEFAULT_BRAND_CONFIG.hero.atelierImage}
              alt="SOLEVERSE Footwear Design Studio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
            />
            <div className="absolute bottom-6 left-6 right-6 space-y-1">
              <p className="text-xs tracking-[0.2em] uppercase text-[#22D3EE]">
                {DEFAULT_BRAND_CONFIG.contact.studioAddress}
              </p>
              <p className="font-display text-xl sm:text-2xl font-semibold text-white">
                Where ergonomic engineering meets luxury craft.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#0E1118] border border-white/10 rounded-2xl p-7 sm:p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#94A3B8]">
                Brand Story
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight text-balance">
                "{DEFAULT_BRAND_CONFIG.about.manifesto}"
              </h2>
              <p className="text-sm text-[#A1AAB8] leading-relaxed">
                {DEFAULT_BRAND_CONFIG.about.secondaryStory}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5 border-t border-white/10">
                {DEFAULT_BRAND_CONFIG.about.pillars.map((pillar) => (
                  <div key={pillar.title} className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-white">{pillar.title}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{pillar.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate({ page: 'about' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Read Brand Story</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate({ page: 'customiser' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <span>Bespoke Studio</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          15. CUSTOMER REVIEWS — VERIFIED COLLECTOR TESTIMONIALS
      ==================================================================== */}
      <section className="border-t border-white/10 bg-[#0A0C12]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-8">
          <SectionHeader
            kicker="Verified Collectors & Athletes"
            title="Customer Reviews"
            subtitle="4.85 average rating across 1,000+ delivered pairs nationwide."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CUSTOMER_REVIEWS.map((rev) => (
              <article
                key={rev.id}
                className="bg-[#0E1118] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="inline-flex items-center gap-1 text-[#3B82F6]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#3B82F6] text-[#3B82F6]" />
                      ))}
                    </div>
                    <span className="font-mono-num text-white">{rev.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">"{rev.quote}"</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-white">
                    {rev.name} · <span className="font-normal text-[#94A3B8]">{rev.city}</span>
                  </p>
                  <p className="text-[11px] text-[#60A5FA] mt-0.5">{rev.model}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          16. NEWSLETTER SUBSCRIPTION & FINAL STUDIO DISPATCH BANNER
      ==================================================================== */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#06070B]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 22% 50%, rgba(37, 99, 235, 0.2), transparent 48%), radial-gradient(circle at 78% 50%, rgba(34, 211, 238, 0.12), transparent 45%)',
          }}
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 lg:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-3">
            <p className="text-xs font-semibold tracking-[0.26em] uppercase text-[#60A5FA]">
              Newsletter Subscription
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight text-balance">
              Receive private access to numbered collector releases.
            </h2>
            <p className="text-sm text-[#A1AAB8] max-w-xl">
              Join the SOLEVERSE dispatch for early vault allocations, bespoke material drops, and
              atelier previews. Complimentary express shipping across India above ₹12,000.
            </p>
          </div>

          <div className="lg:col-span-6 bg-[#0E1118]/90 border border-white/15 rounded-2xl p-6 sm:p-7 space-y-4">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  setNewsletterSubscribed(false);
                }}
                placeholder="Enter your email address..."
                className="flex-1 min-w-0 px-4 py-3 bg-[#080A0F] border border-white/15 rounded-lg text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={newsletterBusy}
                className="px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#0891B2] hover:from-[#1D4ED8] hover:to-[#06B6D4] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {newsletterBusy ? 'Joining...' : 'Subscribe'}
              </button>
            </form>

            {newsletterSubscribed ? (
              <p className="text-xs text-[#22D3EE] inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>You are registered for upcoming SOLEVERSE studio dispatches.</span>
              </p>
            ) : (
              <p className="text-xs text-[#64748B]">
                Monthly atelier editions only. Unsubscribe cleanly anytime.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
