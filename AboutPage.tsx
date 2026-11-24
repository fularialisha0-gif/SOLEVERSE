import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_BRAND_CONFIG } from '../config/brand.config';
import { AppRoute } from '../types';

interface AboutPageProps {
  navigate: (route: AppRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 lg:py-20 space-y-16">
      {/* Manifesto Hero */}
      <section className="max-w-4xl space-y-6">
        <p className="text-xs tracking-[0.24em] uppercase text-[#93C5FD]">Our Story · {DEFAULT_BRAND_CONFIG.brandName}</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white leading-[1.12] text-balance">
          "{DEFAULT_BRAND_CONFIG.about.manifesto}"
        </h1>
        <p className="text-base sm:text-lg text-[#A1AAB8] leading-relaxed max-w-3xl">
          {DEFAULT_BRAND_CONFIG.about.secondaryStory}
        </p>
      </section>

      {/* Studio Visual */}
      <section className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] max-h-[540px]">
        <img
          src={DEFAULT_BRAND_CONFIG.hero.atelierImage}
          alt="SOLEVERSE Footwear Design Studio"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
        />
        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#93C5FD]">Design & Prototyping Lab</p>
          <p className="font-display text-xl sm:text-2xl font-semibold text-white mt-1">
            {DEFAULT_BRAND_CONFIG.contact.studioAddress}
          </p>
        </div>
      </section>

      {/* Engineering Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {DEFAULT_BRAND_CONFIG.about.pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="bg-[#111318] border border-white/10 rounded-2xl p-7 space-y-3"
          >
            <h2 className="font-display text-lg font-semibold text-white">{pillar.title}</h2>
            <p className="text-sm text-[#A1AAB8] leading-relaxed">{pillar.detail}</p>
          </div>
        ))}
      </section>

      {/* Call to Action */}
      <section className="bg-[#111318] border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-white">SOLEVERSE Bespoke Studio</h2>
          <p className="text-sm text-[#A1AAB8]">
            Inspect studio finishes and tailor your own upper, metallic cage, and sole accents.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate({ page: 'customiser' })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>Open Bespoke Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate({ page: 'collections' })}
            className="px-5 py-3 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Explore Collections
          </button>
        </div>
      </section>
    </div>
  );
};
