import React, { useState } from 'react';
import { ShieldCheck, UserCheck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    signInWithGoogle,
    signInDemoCustomer,
    firebaseReady,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!authModalOpen) return null;

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInDemoCustomer(name || email.split('@')[0] || 'Customer', email, phone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-[#111318] border border-white/15 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#93C5FD] mb-1">SOLEVERSE Account</p>
            <h2 className="font-display text-2xl font-semibold text-white">
              {mode === 'login' ? 'Sign in to your account' : 'Create customer profile'}
            </h2>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-2 text-[#A1AAB8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Sign-In (Firebase Auth) */}
        {firebaseReady && (
          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 px-4 bg-white hover:bg-[#E2E8F0] text-[#090A0D] text-sm font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Continue with Google (Firebase Auth)</span>
            </button>
            <p className="text-xs text-[#A1AAB8] text-center">
              Syncs your bag, wishlist, and real-time order tracking across devices.
            </p>
          </div>
        )}

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-white/10" />
          <span className="shrink mx-3 text-xs text-[#64748B]">or Local Demo Mode</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Local Demo Registration / Login */}
        <form onSubmit={handleDemoSubmit} className="space-y-3.5">
          <div className="flex gap-2 p-1 bg-[#090A0D] border border-white/10 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                mode === 'login' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8]'
              }`}
            >
              Demo Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                mode === 'register' ? 'bg-[#2563EB] text-white' : 'text-[#A1AAB8]'
              }`}
            >
              Demo Register
            </button>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Mehta"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#A1AAB8] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collector@example.com"
              className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-[#A1AAB8] mb-1">Phone Number (India)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full px-3.5 py-2.5 bg-[#090A0D] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#171A22] hover:bg-[#1E2330] border border-white/15 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-[#93C5FD]" />
            <span>{mode === 'login' ? 'Enter Demo Customer Session' : 'Create Demo Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
