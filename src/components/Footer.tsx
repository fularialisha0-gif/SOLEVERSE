import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_BRAND_CONFIG } from '../config/brand.config';
import { AppRoute } from '../types';

interface FooterProps {
  navigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { storeSettings, categories, subscribeNewsletter } = useStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#090A0D] border-t border-white/10 pt-16 pb-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="font-display text-2xl font-bold tracking-[0.2em] text-white cursor-pointer"
            >
              {storeSettings.brandName}
            </button>
            <p className="text-xs tracking-[0.22em] text-[#A1AAB8] font-medium">
              {storeSettings.tagline}
            </p>
            <p className="text-sm text-[#A1AAB8] leading-relaxed max-w-sm">
              Futuristic footwear atelier uniting precision carbon propulsion, brushed metallic hardware, and minimalist luxury craftsmanship.
            </p>
            <div className="text-xs text-[#A1AAB8] space-y-1 pt-2">
              <p>{storeSettings.contactEmail}</p>
              <p>{storeSettings.contactPhone}</p>
            </div>
          </div>

          {/* Collections */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Collections</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigate({ page: 'collections', category: cat.name })}
                    className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Studio & Legal */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Company</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate({ page: 'about' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'support' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'customiser' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  Bespoke Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'legal', doc: 'privacy' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'legal', doc: 'terms' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'legal', doc: 'returns' })}
                  className="text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
                >
                  Return Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Private Releases</h3>
            <p className="text-sm text-[#A1AAB8]">
              Receive early access to numbered drops and bespoke 3D studio editions.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-[#111318] border border-white/10 rounded-lg text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-3.5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>{DEFAULT_BRAND_CONFIG.legal.copyright}</p>
          <div className="flex items-center gap-6">
            <a
              href={DEFAULT_BRAND_CONFIG.contact.socials.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href={DEFAULT_BRAND_CONFIG.contact.socials.x}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              X / Twitter
            </a>
            <a
              href={DEFAULT_BRAND_CONFIG.contact.socials.youtube}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
