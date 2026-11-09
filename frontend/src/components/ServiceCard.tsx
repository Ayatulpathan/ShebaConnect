import React from 'react';
import type { Service, PricingType } from '../types/index.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onBook?: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook }) => {
  const { language } = useLanguage();

  const getPricingTypeLabel = (type: PricingType) => {
    if (language === 'bn') {
      switch (type) {
        case 'FIXED_PRICE':
          return 'নির্দিষ্ট মূল্য';
        case 'STARTING_PRICE':
          return 'শুরু';
        case 'HOURLY_PRICE':
          return 'প্রতি ঘণ্টা';
        case 'INSPECTION_REQUIRED':
          return 'পরিদর্শন সাপেক্ষে';
        case 'CUSTOM_QUOTATION':
          return 'কাস্টম কোটেশন';
      }
    }
    switch (type) {
      case 'FIXED_PRICE':
        return 'Fixed Price';
      case 'STARTING_PRICE':
        return 'Starting from';
      case 'HOURLY_PRICE':
        return 'Per Hour';
      case 'INSPECTION_REQUIRED':
        return 'Inspection Required';
      case 'CUSTOM_QUOTATION':
        return 'Custom Quotation';
    }
  };

  const formatPrice = (amount: number) => {
    if (language === 'bn') {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const formatted = amount.toLocaleString('en-US');
      return `৳${formatted.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] || d)}`;
    }
    return `৳${amount.toLocaleString()}`;
  };

  const categoryName =
    typeof service.category === 'object' && service.category !== null
      ? language === 'bn'
        ? service.category.name.bn
        : service.category.name.en
      : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Category & Pricing Badge */}
        <div className="flex justify-between items-center mb-3">
          {categoryName && (
            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              {categoryName}
            </span>
          )}
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {getPricingTypeLabel(service.pricingType)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-600 transition-colors leading-snug">
          {language === 'bn' ? service.name.bn : service.name.en}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
          {language === 'bn' ? service.description.bn : service.description.en}
        </p>

        {/* Service Attributes */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {language === 'bn'
                ? `আনুমানিক ${service.estimatedDurationMinutes} মিনিট`
                : `~${service.estimatedDurationMinutes} mins`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Booking Action */}
      <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-400 block font-medium">
            {getPricingTypeLabel(service.pricingType)}
          </span>
          <span className="text-base font-extrabold text-gray-900 tracking-tight">
            {formatPrice(service.basePrice)}
          </span>
        </div>

        <button
          onClick={() => onBook?.(service)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
        >
          <span>{language === 'bn' ? 'বুকিং করুন' : 'Book Now'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
