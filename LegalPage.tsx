import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_BRAND_CONFIG } from '../config/brand.config';
import { AppRoute } from '../types';

interface LegalPageProps {
  doc: 'privacy' | 'terms' | 'returns';
  navigate: (route: AppRoute) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ doc, navigate }) => {
  const titleMap = {
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    returns: 'Return & Exchange Policy',
  };

  const paragraphs = DEFAULT_BRAND_CONFIG.legal[doc];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 space-y-8">
      <button
        onClick={() => navigate({ page: 'home' })}
        className="inline-flex items-center gap-2 text-sm text-[#A1AAB8] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="bg-[#111318] border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD] mb-1">
            {DEFAULT_BRAND_CONFIG.brandName} Legal
          </p>
          <h1 className="font-display text-3xl font-bold text-white">{titleMap[doc]}</h1>
        </div>

        <div className="space-y-4 text-sm text-[#A1AAB8] leading-relaxed">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
