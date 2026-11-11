import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { HealthStatusBadge } from './HealthStatusBadge.js';
import { UserMenu } from './UserMenu.js';
import { NotificationBell } from './NotificationBell.js';
import { Globe, Menu, X, Wrench, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* 3D Logo & Brand */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-emerald-500 flex items-center justify-center text-white shadow-3d-emerald group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
                <Wrench className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-tight flex items-center gap-1">
                  <span>{t.brandName}</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
                </span>
                <span className="text-[10px] text-brand-700 font-bold tracking-wider uppercase">
                  {language === 'bn' ? 'ঢাকা মেট্রো • ৩ডি সার্ভিস' : 'Dhaka Metro • 3D Platform'}
                </span>
              </div>
            </a>
            <div className="hidden sm:block ml-2">
              <HealthStatusBadge />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <a
              href="#services"
              className="hover:text-brand-600 transition-colors py-1 hover:-translate-y-0.5 transition-transform inline-block"
            >
              {t.nav.services}
            </a>
            <a
              href="#categories"
              className="hover:text-brand-600 transition-colors py-1 hover:-translate-y-0.5 transition-transform inline-block"
            >
              {t.nav.categories}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-brand-600 transition-colors py-1 hover:-translate-y-0.5 transition-transform inline-block"
            >
              {t.nav.howItWorks}
            </a>
          </div>

          {/* Right Actions: Language Switcher, Notifications, User Menu */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* 3D Tactile Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-slate-700 shadow-2xs hover:shadow-sm btn-3d"
              title="Change Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* In-App Notifications */}
            <NotificationBell />

            {/* Auth / User Menu */}
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 bg-white shadow-2xs"
            >
              {language === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <div className="py-1">
            <HealthStatusBadge />
          </div>
          <div className="space-y-1">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              {t.nav.services}
            </a>
            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              {t.nav.categories}
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              {t.nav.howItWorks}
            </a>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  );
};
