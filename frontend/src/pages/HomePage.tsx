import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../context/LanguageContext.js';
import { fetchCategories, searchServices } from '../services/api.js';
import { ServiceCard } from '../components/ServiceCard.js';
import { BookingModal } from '../components/BookingModal.js';
import { BookingTrackerModal } from '../components/BookingTrackerModal.js';
import { AuthModal } from '../components/AuthModal.js';
import { Hero3DScene } from '../components/Hero3DScene.js';
import { Card3D } from '../components/Card3D.js';
import type { Service, Booking } from '../types/index.js';
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
  Filter,
  Wrench,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Tag,
  Star,
  Users,
  Award,
} from 'lucide-react';
import { DHAKA_AREAS } from '../constants/areas.js';

const FALLBACK_CATEGORIES = [
  { id: 'ac-repair', icon: Wind, en: 'AC Servicing & Repair', bn: 'এসি সার্ভিসিং ও মেরামত' },
  { id: 'electrical', icon: Zap, en: 'Electrical Services', bn: 'ইলেকট্রিক্যাল সার্ভিস' },
  { id: 'plumbing', icon: Droplets, en: 'Plumbing', bn: 'প্লাম্বিং সার্ভিস' },
  { id: 'cleaning', icon: Sparkles, en: 'Home Cleaning', bn: 'বাড়ি পরিষ্কার পরিচ্ছন্নতা' },
  { id: 'appliances', icon: Tv, en: 'Appliance Repair', bn: 'হোম অ্যাপ্লায়েন্স মেরামত' },
  { id: 'carpentry', icon: Hammer, en: 'Carpentry', bn: 'কাঠের কাজ (কার্পেন্ট্রি)' },
  { id: 'painting', icon: Brush, en: 'Painting', bn: 'রং মিস্ত্রির কাজ' },
  { id: 'pest-control', icon: Bug, en: 'Pest Control', bn: 'পোকামাকড় দমন' },
];

const POPULAR_SEARCH_CHIPS = [
  { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
  { en: 'Electrician', bn: 'ইলেকট্রিশিয়ান' },
  { en: 'Plumbing', bn: 'প্লাম্বিং' },
  { en: 'Home Cleaning', bn: 'বাড়ি পরিষ্কার' },
  { en: 'Painting', bn: 'রং মিস্ত্রি' },
  { en: 'Appliance Repair', bn: 'অ্যাপ্লায়েন্স মেরামত' },
];

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Debounce search term to avoid redundant network requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch live categories from backend
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    retry: 3,
    retryDelay: 2500,
  });

  // Fetch services based on search, area, and selected category
  const {
    data: searchResults,
    isLoading: isServicesLoading,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['services', debouncedSearchTerm, selectedArea, activeCategory],
    queryFn: () =>
      searchServices({
        q: debouncedSearchTerm || undefined,
        area: selectedArea || undefined,
        category: activeCategory || undefined,
      }),
    retry: 3,
    retryDelay: 2500,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChipClick = (chipTerm: string) => {
    setSearchTerm(chipTerm);
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<Service | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleBookService = (service: Service) => {
    setSelectedServiceForBooking(service);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setBookingModalOpen(false);
    setActiveBookingId(booking._id);
    setTrackerModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 3D Immersive Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-brand-900/40">
        {/* Interactive Three.js 3D WebGL Background Scene */}
        <Hero3DScene className="absolute inset-0 z-0 opacity-75" />

        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Floating 3D Feature Badges (Desktop) */}
        <div className="absolute top-28 left-6 hidden xl:block z-10 animate-float-3d">
          <div className="glass-3d-elevated px-4 py-3 rounded-2xl flex items-center gap-3 text-slate-800 shadow-3d-emerald border border-white/80">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-base">
              ⚡
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">
                {language === 'bn' ? '১০ মিনিটে টেকনিশিয়ান' : '10-Min Fast Dispatch'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {language === 'bn' ? 'নিকটবর্তী যাচাইকৃত কারিগর' : 'Nearest verified pros'}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-28 right-8 hidden xl:block z-10 animate-float-reverse-3d">
          <div className="glass-3d-elevated px-4 py-3 rounded-2xl flex items-center gap-3 text-slate-800 shadow-3d-emerald border border-white/80">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-base">
              🛡️
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">
                {language === 'bn' ? 'জাতীয় পরিচয়পত্র যাচাইকৃত' : '100% NID Verified'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {language === 'bn' ? 'নিরাপদ বিশ্বস্ত সেবা' : 'Safe & trustworthy'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Zero Cost Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-6 shadow-inner backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.badges.zeroCostNotice}</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-tight text-white drop-shadow-md">
            {t.hero.title}
          </h1>

          <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* 3D Elevated Search Container */}
          <div className="mt-10 perspective-1000 max-w-3xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="glass-3d-elevated p-3 rounded-3xl shadow-3d-hero flex flex-col sm:flex-row gap-2 transition-all duration-300"
            >
              {/* Service Input */}
              <div className="flex-1 flex items-center px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-slate-200/80">
                <Search className="w-5 h-5 text-brand-600 mr-2.5 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Area Dropdown (Zero-Cost Local Geocoding) */}
              <div className="sm:w-60 flex items-center px-4 py-2.5">
                <MapPin className="w-5 h-5 text-emerald-600 mr-2.5 flex-shrink-0" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full text-sm outline-none text-slate-800 bg-transparent cursor-pointer font-medium"
                >
                  <option value="" className="text-slate-800">
                    {t.hero.areaPlaceholder}
                  </option>
                  {DHAKA_AREAS.map((area) => (
                    <option key={area.id} value={area.id} className="text-slate-800">
                      {language === 'bn' ? area.bn : area.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-sm px-7 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{t.hero.searchButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Popular Search Chips */}
          <div className="mt-5 flex flex-wrap justify-center items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Tag className="w-3 h-3" />
              <span>{language === 'bn' ? 'জনপ্রিয় সার্চ:' : 'Popular:'}</span>
            </span>
            {POPULAR_SEARCH_CHIPS.map((chip, idx) => {
              const label = language === 'bn' ? chip.bn : chip.en;
              const isSelected = searchTerm.toLowerCase() === label.toLowerCase();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(label)}
                  className={`px-3 py-1 rounded-full text-xs transition-all font-medium backdrop-blur-md ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-white/50'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Key Value Badges */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.badges.cashOnly}</span>
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.badges.verifiedPros}</span>
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.badges.coverage}</span>
            </span>
          </div>
        </div>

        {/* 3D Platform Metrics Bar */}
        <div className="max-w-5xl mx-auto mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
          <div className="glass-3d-card p-4 rounded-2xl text-center border border-white/10">
            <div className="flex justify-center mb-1 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">10,000+</p>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Happy Homes in Dhaka'}
            </p>
          </div>

          <div className="glass-3d-card p-4 rounded-2xl text-center border border-white/10">
            <div className="flex justify-center mb-1 text-amber-400">
              <Star className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">4.9 ★</p>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'bn' ? 'গড় গ্রাহক রেটিং' : 'Average Customer Rating'}
            </p>
          </div>

          <div className="glass-3d-card p-4 rounded-2xl text-center border border-white/10">
            <div className="flex justify-center mb-1 text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">15+ Zones</p>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'bn' ? 'ঢাকা মেট্রো কভারেজ' : 'Dhaka Metro Coverage'}
            </p>
          </div>

          <div className="glass-3d-card p-4 rounded-2xl text-center border border-white/10">
            <div className="flex justify-center mb-1 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">৳0 Advance</p>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'bn' ? 'কাজের পর মূল্য পরিশোধ' : 'Cash on Service Only'}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Bar with 3D Tilt Cards */}
      <section id="categories" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{language === 'bn' ? '৩ডি ক্যাটাগরি এক্সপ্লোরার' : '3D Category Explorer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.popularCategories}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {language === 'bn' ? 'সকল অনুমোদিত সেবা ক্যাটাগরি' : 'Explore verified categories across Dhaka'}
            </p>
          </div>

          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear Category Filter'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories && categories.length > 0
            ? categories.map((cat) => {
                const isSelected = activeCategory === cat._id;
                return (
                  <Card3D key={cat._id} intensity={14} glare={true} className="h-full">
                    <button
                      onClick={() => setActiveCategory(isSelected ? null : cat._id)}
                      className={`w-full h-full p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between preserve-3d ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 shadow-3d-emerald ring-2 ring-brand-500'
                          : 'glass-3d-card hover:border-brand-400'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center mb-4 shadow-md translate-z-20">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div className="translate-z-10">
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">
                          {language === 'bn' ? cat.name.bn : cat.name.en}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {language === 'bn' ? 'যাচাইকৃত কারিগর' : 'Verified Pros'}
                        </p>
                      </div>
                    </button>
                  </Card3D>
                );
              })
            : FALLBACK_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Card3D key={cat.id} intensity={14} glare={true} className="h-full">
                    <div className="glass-3d-card p-5 rounded-2xl border border-slate-200 flex flex-col justify-between h-full preserve-3d">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center mb-4 shadow-md translate-z-20">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug translate-z-10">
                        {language === 'bn' ? cat.bn : cat.en}
                      </h3>
                    </div>
                  </Card3D>
                );
              })}
        </div>
      </section>

      {/* Services Grid (Live Search Results with 3D Depth) */}
      <section id="services" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {language === 'bn' ? 'সকল সেবা' : 'All Available Services'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {searchResults?.pagination?.total
                ? language === 'bn'
                  ? `মোট ${searchResults.pagination.total} টি সেবা পাওয়া গেছে`
                  : `${searchResults.pagination.total} verified services ready`
                : language === 'bn'
                  ? 'ঢাকা মেট্রোর সেরা সেবা'
                  : 'Best verified home services in Dhaka'}
            </p>
          </div>

          {searchResults && searchResults.pagination.total > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              {language === 'bn'
                ? `৳০ অগ্রিম কমিশন`
                : `৳0 Advance Platform Fee`}
            </span>
          )}
        </div>

        {/* Active Filter Pills */}
        {(debouncedSearchTerm || selectedArea || activeCategory) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3.5 glass-3d-card rounded-2xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-bold mr-1">
              {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active Filters:'}
            </span>

            {debouncedSearchTerm && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-brand-200 text-brand-700 shadow-2xs">
                <Search className="w-3 h-3 text-brand-500" />
                <span>"{debouncedSearchTerm}"</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedArea && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-200 text-emerald-800 shadow-2xs">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>
                  {language === 'bn'
                    ? DHAKA_AREAS.find((a) => a.id === selectedArea)?.bn || selectedArea
                    : DHAKA_AREAS.find((a) => a.id === selectedArea)?.en || selectedArea}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedArea('')}
                  className="hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-800 shadow-2xs">
                <Tag className="w-3 h-3 text-purple-600" />
                <span>
                  {categories?.find((c) => c._id === activeCategory)?.name
                    ? language === 'bn'
                      ? categories?.find((c) => c._id === activeCategory)?.name.bn
                      : categories?.find((c) => c._id === activeCategory)?.name.en
                    : activeCategory}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedArea('');
                setActiveCategory(null);
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto hover:underline"
            >
              {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isServicesLoading && (
          <div className="text-center py-20 glass-3d-card rounded-3xl p-8">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              {language === 'bn' ? 'সেবাসমূহ লোড হচ্ছে...' : 'Loading services across Dhaka...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {isServicesError && (
          <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-200 p-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-red-800">
              {language === 'bn' ? 'সেবা লোড করতে সমস্যা হয়েছে' : 'Failed to fetch services'}
            </p>
            <button
              onClick={() => refetchServices()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Services 3D Grid */}
        {!isServicesLoading && !isServicesError && searchResults && (
          <>
            {searchResults.services.length === 0 ? (
              <div className="text-center py-20 glass-3d-card rounded-3xl p-8">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  {language === 'bn' ? 'কোন সেবা পাওয়া যায়নি' : 'No Services Found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {language === 'bn'
                    ? 'আপনার সার্চ ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                    : 'Try modifying your search keywords or Dhaka area selection.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.services.map((service) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    onBook={handleBookService}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Booking and Tracker Modals */}
      {selectedServiceForBooking && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          service={selectedServiceForBooking}
          onBookingSuccess={handleBookingSuccess}
          onRequireAuth={() => setAuthModalOpen(true)}
        />
      )}

      {trackerModalOpen && (
        <BookingTrackerModal
          isOpen={trackerModalOpen}
          onClose={() => setTrackerModalOpen(false)}
          initialBookingId={activeBookingId}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
