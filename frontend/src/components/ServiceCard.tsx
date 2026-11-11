import React from 'react';
import type { Service, PricingType } from '../types/index.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Card3D } from './Card3D.js';

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
    <Card3D intensity={12} glare={true} className="h-full">
      <div className="glass-3d-card rounded-2xl flex flex-col justify-between h-full overflow-hidden group hover:border-brand-400 transition-all duration-300 preserve-3d">
        <div className="p-5 relative preserve-3d">
          {/* Category & Pricing Badge */}
          <div className="flex justify-between items-center mb-3">
            {categoryName && (
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full shadow-2xs translate-z-10 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>{categoryName}</span>
              </span>
            )}
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md translate-z-10">
              {getPricingTypeLabel(service.pricingType)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-600 transition-colors leading-snug translate-z-20">
            {language === 'bn' ? service.name.bn : service.name.en}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {language === 'bn' ? service.description.bn : service.description.en}
          </p>

          {/* Service Attributes */}
          <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
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
        <div className="bg-slate-50/90 px-5 py-3.5 border-t border-gray-100 flex items-center justify-between preserve-3d">
          <div className="translate-z-10">
            <span className="text-[10px] text-gray-400 block font-medium">
              {getPricingTypeLabel(service.pricingType)}
            </span>
            <span className="text-base font-extrabold text-brand-800 tracking-tight">
              {formatPrice(service.basePrice)}
            </span>
          </div>

          <button
            onClick={() => onBook?.(service)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 translate-z-20"
          >
            <span>{language === 'bn' ? 'বুকিং করুন' : 'Book Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card3D>
  );
};
