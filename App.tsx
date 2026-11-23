import React, { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { SearchOverlay } from './components/SearchOverlay';
import { HomePage } from './pages/HomePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CustomiserPage } from './pages/CustomiserPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { AboutPage } from './pages/AboutPage';
import { SupportPage } from './pages/SupportPage';
import { LegalPage } from './pages/LegalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AppRoute } from './types';

function routeToHash(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '#/';
    case 'collections':
      return route.category
        ? `#/collections?category=${encodeURIComponent(route.category)}`
        : '#/collections';
    case 'product':
      return `#/product/${encodeURIComponent(route.productId)}`;
    case 'customiser':
      return route.productId
        ? `#/customiser?product=${encodeURIComponent(route.productId)}`
        : '#/customiser';
    case 'checkout':
      return '#/checkout';
    case 'orders':
      return '#/orders';
    case 'about':
      return '#/about';
    case 'support':
      return '#/support';
    case 'admin':
      return '#/admin';
    case 'legal':
      return `#/legal/${route.doc}`;
  }
}

function hashToRoute(hash: string): AppRoute {
  const clean = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = clean.split('?');
  const params = new URLSearchParams(queryPart || '');

  if (pathPart === '/' || pathPart === '') return { page: 'home' };
  if (pathPart === '/collections') {
    return {
      page: 'collections',
      category: params.get('category') || undefined,
      query: params.get('q') || undefined,
    };
  }
  if (pathPart.startsWith('/product/')) {
    return { page: 'product', productId: decodeURIComponent(pathPart.replace('/product/', '')) };
  }
  if (pathPart === '/customiser') {
    return { page: 'customiser', productId: params.get('product') || undefined };
  }
  if (pathPart === '/checkout') return { page: 'checkout' };
  if (pathPart === '/orders') return { page: 'orders' };
  if (pathPart === '/about') return { page: 'about' };
  if (pathPart === '/support') return { page: 'support' };
  if (pathPart === '/admin') return { page: 'admin' };
  if (pathPart.startsWith('/legal/')) {
    const doc = pathPart.replace('/legal/', '') as 'privacy' | 'terms' | 'returns';
    if (doc === 'privacy' || doc === 'terms' || doc === 'returns') {
      return { page: 'legal', doc };
    }
  }
  return { page: 'home' };
}

const SoleverseShell: React.FC = () => {
  const { toast, demoMode, storeSettings, setAuthModalOpen } = useStore();
  const [route, setRoute] = useState<AppRoute>(() => hashToRoute(window.location.hash));

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const nextHash = routeToHash(nextRoute);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(hashToRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${storeSettings.brandName} — ${storeSettings.tagline}`;
  }, [storeSettings.brandName, storeSettings.tagline]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0D] text-[#F4F6FA]">
      {/* Slim Demo / Account Notice Bar when in Demo Mode */}
      {demoMode && (
        <div className="bg-[#111318] border-b border-white/10 px-4 py-1.5 text-[11px] text-[#A1AAB8] flex items-center justify-center gap-3">
          <span>
            Demo Mode Active — cart, wishlist, and demo orders persist locally.
          </span>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="text-[#93C5FD] hover:text-white underline cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
      )}

      <Navbar currentRoute={route} navigate={navigate} />

      <main className="flex-1">
        {route.page === 'home' && <HomePage navigate={navigate} />}
        {route.page === 'collections' && (
          <CollectionsPage
            initialCategory={route.category}
            initialQuery={route.query}
            navigate={navigate}
          />
        )}
        {route.page === 'product' && (
          <ProductDetailPage productId={route.productId} navigate={navigate} />
        )}
        {route.page === 'customiser' && (
          <CustomiserPage initialProductId={route.productId} />
        )}
        {route.page === 'checkout' && <CheckoutPage navigate={navigate} />}
        {route.page === 'orders' && (
          <OrdersPage highlightOrderId={route.highlightOrderId} navigate={navigate} />
        )}
        {route.page === 'about' && <AboutPage navigate={navigate} />}
        {route.page === 'support' && <SupportPage />}
        {route.page === 'admin' && <AdminDashboardPage />}
        {route.page === 'legal' && <LegalPage doc={route.doc} navigate={navigate} />}
      </main>

      <Footer navigate={navigate} />

      <CartDrawer navigate={navigate} />
      <AuthModal />
      <SearchOverlay navigate={navigate} />

      {/* Accessible Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-medium shadow-xl max-w-sm ${
            toast.tone === 'error'
              ? 'bg-[#1f1215] border-red-500/40 text-red-200'
              : toast.tone === 'success'
                ? 'bg-[#111827] border-[#2563EB]/60 text-white'
                : 'bg-[#111318] border-white/15 text-[#F4F6FA]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <SoleverseShell />
      </StoreProvider>
    </ErrorBoundary>
  );
}
