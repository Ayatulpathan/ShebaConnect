import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../context/LanguageContext.js';
import { fetchCategories, searchServices } from '../services/api.js';
import { ServiceCard } from '../components/ServiceCard.js';
import { BookingModal } from '../components/BookingModal.js';
import { BookingTrackerModal } from '../components/BookingTrackerModal.js';
import { AuthModal } from '../components/AuthModal.js';
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
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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

          {/* Popular Search Chips */}
          <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
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
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors font-medium ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 hover:border-brand-400 shadow-2xs'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

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

      {/* Categories Bar */}
      <section id="categories" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.popularCategories}</h2>
            <p className="mt-1 text-xs text-gray-500">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories && categories.length > 0
            ? categories.map((cat) => {
                const isSelected = activeCategory === cat._id;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCategory(isSelected ? null : cat._id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-500'
                        : 'border-gray-200 bg-white hover:border-brand-500 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-snug">
                        {language === 'bn' ? cat.name.bn : cat.name.en}
                      </h3>
                    </div>
                  </button>
                );
              })
            : FALLBACK_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 leading-snug">
                      {language === 'bn' ? cat.bn : cat.en}
                    </h3>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Services Grid (Live Search Results) */}
      <section id="services" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {language === 'bn' ? 'উপলব্ধ সেবাসমূহ' : 'Available Services'}
              {searchResults?.pagination?.total !== undefined && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({searchResults.pagination.total} {language === 'bn' ? 'টি সেবা' : 'services'})
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'অন-ডিমান্ড ও ভেরিফায়েড হোম সার্ভিস (ক্যাশ অন সার্ভিস)'
                : 'On-demand verified services with 100% cash after delivery'}
            </p>
          </div>

          {(searchTerm || selectedArea || activeCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedArea('');
                setActiveCategory(null);
              }}
              className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* Active Filter Pills */}
        {(debouncedSearchTerm || selectedArea || activeCategory) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-500 font-semibold mr-1">
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
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-800">
              {language === 'bn' ? 'সেবাসমূহ লোড হচ্ছে...' : 'Loading verified services...'}
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {language === 'bn'
                ? 'রেন্ডার ফ্রি ক্লাউড ব্যাকএন্ড সক্রিয় হতে সামান্য সময় লাগতে পারে।'
                : 'Connecting to free cloud backend. This may take a moment if waking up from sleep.'}
            </p>
          </div>
        )}

        {/* Error State */}
        {!isServicesLoading && isServicesError && (
          <div className="text-center py-12 bg-red-50/70 rounded-2xl border border-red-200 p-8 max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-900">
              {language === 'bn' ? 'সার্ভিস লোড করতে সমস্যা হয়েছে' : 'Failed to connect to service backend'}
            </h4>
            <p className="text-xs text-gray-600 mt-1 mb-4">
              {language === 'bn'
                ? 'ব্যাকএন্ড সার্ভার জাগ্রত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় চেষ্টা করুন।'
                : 'Server might still be waking up. Please click retry.'}
            </p>
            <button
              onClick={() => refetchServices()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Connection'}</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isServicesLoading && !isServicesError && searchResults?.services && searchResults.services.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 max-w-xl mx-auto p-8 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              {language === 'bn' ? 'কোনো সেবা পাওয়া যায়নি' : 'No Matching Services Found'}
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {language === 'bn'
                ? 'আপনার বর্তমান ফিল্টারের সাথে মিলে এমন কোনো সেবা নেই। ফিল্টার পরিবর্তন বা রিসেট করুন।'
                : 'No services match your current search terms, category, or selected area.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedArea('');
                setActiveCategory(null);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}</span>
            </button>
          </div>
        )}

        {/* Results Grid */}
        {!isServicesLoading && !isServicesError && searchResults?.services && searchResults.services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.services.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                onBook={handleBookService}
              />
            ))}
          </div>
        )}
      </section>

      {/* Booking Modals */}
      <BookingModal
        isOpen={bookingModalOpen}
        service={selectedServiceForBooking}
        onClose={() => setBookingModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
        onRequireAuth={() => {
          setBookingModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      <BookingTrackerModal
        isOpen={trackerModalOpen}
        initialBookingId={activeBookingId}
        onClose={() => setTrackerModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};
