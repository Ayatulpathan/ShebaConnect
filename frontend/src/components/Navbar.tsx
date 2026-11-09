import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { HealthStatusBadge } from './HealthStatusBadge.js';
import { Globe, Menu, X, Wrench } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md group-hover:bg-brand-700 transition-colors">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 tracking-tight leading-tight">
                  {t.brandName}
                </span>
                <span className="text-[10px] text-brand-700 font-medium tracking-wide">
                  {language === 'bn' ? 'ঢাকা মেট্রো' : 'DHAKA'}
                </span>
              </div>
            </a>
            <div className="hidden sm:block ml-2">
              <HealthStatusBadge />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
            <a href="#services" className="hover:text-brand-600 transition-colors">
              {t.nav.services}
            </a>
            <a href="#categories" className="hover:text-brand-600 transition-colors">
              {t.nav.categories}
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">
              {t.nav.howItWorks}
            </a>
          </div>

          {/* Right Actions: Language Switcher, Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition-all"
              title="Change Language / ভাষা পরিবর্তন"
            >
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Auth Buttons */}
            <button className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              {t.nav.login}
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors">
              {t.nav.register}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-bold rounded border border-gray-300 text-gray-700"
            >
              {language === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="py-1">
            <HealthStatusBadge />
          </div>
          <div className="space-y-1">
            <a
              href="#services"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.nav.services}
            </a>
            <a
              href="#categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.nav.categories}
            </a>
            <a
              href="#how-it-works"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.nav.howItWorks}
            </a>
          </div>
          <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
            <button className="w-full py-2 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg">
              {t.nav.login}
            </button>
            <button className="w-full py-2 text-center text-sm font-semibold text-white bg-brand-600 rounded-lg shadow-sm">
              {t.nav.register}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
