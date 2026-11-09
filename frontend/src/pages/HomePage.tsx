import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Search,
  MapPin,
  CheckCircle2,
  Sparkles,
  Zap,
  Droplets,
  Wind,
  Brush,
  Bug,
  Hammer,
  Tv,
  ArrowRight,
} from 'lucide-react';

const DHAKA_AREAS = [
  { id: 'mirpur', en: 'Mirpur', bn: 'মিরপুর' },
  { id: 'dhanmondi', en: 'Dhanmondi', bn: 'ধানমন্ডি' },
  { id: 'gulshan', en: 'Gulshan', bn: 'গুলশান' },
  { id: 'banani', en: 'Banani', bn: 'বনানী' },
  { id: 'uttara', en: 'Uttara', bn: 'উত্তরা' },
  { id: 'mohammadpur', en: 'Mohammadpur', bn: 'মোহাম্মদপুর' },
  { id: 'badda', en: 'Badda', bn: 'বাড্ডা' },
  { id: 'motijheel', en: 'Motijheel', bn: 'মতিঝিল' },
  { id: 'old-dhaka', en: 'Old Dhaka', bn: 'পুরান ঢাকা' },
];

const INITIAL_CATEGORIES = [
  { id: 'ac-repair', icon: Wind, en: 'AC Servicing & Repair', bn: 'এসি সার্ভিসিং ও মেরামত' },
  { id: 'electrical', icon: Zap, en: 'Electrical Services', bn: 'ইলেকট্রিক্যাল সার্ভিস' },
  { id: 'plumbing', icon: Droplets, en: 'Plumbing', bn: 'প্লাম্বিং সার্ভিস' },
  { id: 'cleaning', icon: Sparkles, en: 'Home Cleaning', bn: 'বাড়ি পরিষ্কার পরিচ্ছন্নতা' },
  { id: 'appliances', icon: Tv, en: 'Appliance Repair', bn: 'হোম অ্যাপ্লায়েন্স মেরামত' },
  { id: 'carpentry', icon: Hammer, en: 'Carpentry', bn: 'কাঠের কাজ (কার্পেন্ট্রি)' },
  { id: 'painting', icon: Brush, en: 'Painting', bn: 'রং মিস্ত্রির কাজ' },
  { id: 'pest-control', icon: Bug, en: 'Pest Control', bn: 'পোকামাকড় দমন' },
];

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      language === 'bn'
        ? `অনুসন্ধান: "${searchTerm || 'সকল সেবা'}", এলাকা: ${selectedArea || 'সমগ্র ঢাকা'}`
        : `Searching: "${searchTerm || 'All services'}" in ${selectedArea || 'All Dhaka'}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-50 via-white to-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            {t.badges.zeroCostNotice}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-tight">
            {t.hero.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>

          {/* Search Box with Predefined Dhaka Areas */}
          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white p-2.5 rounded-2xl shadow-xl border border-gray-200 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto"
          >
            {/* Service Input */}
            <div className="flex-1 flex items-center px-3 py-2 border-b sm:border-b-0 sm:border-r border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                className="w-full text-sm outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              />
            </div>

            {/* Area Dropdown (Zero-Cost Local Geocoding) */}
            <div className="sm:w-56 flex items-center px-3 py-2">
              <MapPin className="w-5 h-5 text-brand-600 mr-2 flex-shrink-0" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full text-sm outline-none text-gray-700 bg-transparent cursor-pointer"
              >
                <option value="">{t.hero.areaPlaceholder}</option>
                {DHAKA_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {language === 'bn' ? area.bn : area.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>{t.hero.searchButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Key Value Badges */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t.badges.cashOnly}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t.badges.verifiedPros}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t.badges.coverage}
            </span>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section id="categories" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.popularCategories}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {language === 'bn'
              ? 'আমাদের অনুমোদিত অভিজ্ঞ পেশাদারদের সেবাসমূহ'
              : 'Reliable on-demand maintenance by verified experts'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {INITIAL_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                  {language === 'bn' ? cat.bn : cat.en}
                </h3>
                <span className="text-xs text-gray-400 mt-1">
                  {language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash after service'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
