import React, { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_BRAND_CONFIG } from '../config/brand.config';

export const SupportPage: React.FC = () => {
  const { storeSettings, submitContactMessage, subscribeNewsletter, user } = useStore();

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentDone, setSentDone] = useState(false);

  const [newsEmail, setNewsEmail] = useState('');

  const cleanWa = storeSettings.whatsappNumber.replace(/[^\d]/g, '');
  const waHref = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `Hello ${storeSettings.brandName} Support, I have a question regarding your footwear collection.`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await submitContactMessage({ name, email, subject, message });
      setSubject('');
      setMessage('');
      setSentDone(true);
    } finally {
      setSending(false);
    }
  };

  const handleNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    await subscribeNewsletter(newsEmail);
    setNewsEmail('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 lg:py-16 space-y-12">
      <div className="space-y-2 border-b border-white/10 pb-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[#93C5FD]">Customer Concierge</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Contact & Support</h1>
        <p className="text-sm text-[#A1AAB8] max-w-xl">
          Sizing guidance, bespoke 3D studio inquiries, order assistance, or retail partnerships.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <h2 className="font-display text-xl font-semibold text-white">Send a Message</h2>

          {sentDone && (
            <div className="p-3.5 bg-[#2563EB]/15 border border-[#2563EB] rounded-lg text-xs text-white">
              Your message has been logged with our concierge team.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1.5">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#A1AAB8] mb-1.5">Subject *</label>
            <input
              type="text"
              required
              minLength={2}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="UK size inquiry for Eclipse 2049"
              className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#A1AAB8] mb-1.5">Message *</label>
            <textarea
              required
              minLength={5}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your question or order ID..."
              className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Submit Inquiry'}</span>
          </button>
        </form>

        {/* Direct Support Channels + Newsletter */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-semibold text-white">Direct Channels</h2>

            <div className="space-y-4 text-sm text-[#A1AAB8]">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#93C5FD] mt-1 shrink-0" />
                <div>
                  <p className="text-white font-medium">Email Support</p>
                  <p>{storeSettings.contactEmail}</p>
                  <p className="text-xs text-[#64748B]">{DEFAULT_BRAND_CONFIG.contact.supportHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#93C5FD] mt-1 shrink-0" />
                <div>
                  <p className="text-white font-medium">Atelier Desk</p>
                  <p>{storeSettings.contactPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#93C5FD] mt-1 shrink-0" />
                <div>
                  <p className="text-white font-medium">Flagship Studio</p>
                  <p>{DEFAULT_BRAND_CONFIG.contact.studioAddress}</p>
                </div>
              </div>
            </div>

            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 bg-[#090A0D] hover:bg-white/5 border border-white/15 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <div className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Newsletter Dispatches</h3>
            <p className="text-xs text-[#A1AAB8]">
              Join for numbered Limited Edition notifications and studio engineering notes.
            </p>
            <form onSubmit={handleNews} className="flex gap-2">
              <input
                type="email"
                required
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
