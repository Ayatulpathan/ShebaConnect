import React, { useState, useEffect } from 'react';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { fetchServiceReviews, fetchProviderReviews } from '../services/api.js';
import { ReviewDisplayCard } from './ReviewDisplayCard.js';
import type { ServiceReviewsResponse, ReviewBreakdown } from '../types/index.js';

interface ServiceReviewsSectionProps {
  serviceId?: string;
  providerId?: string;
  title?: string;
}

export const ServiceReviewsSection: React.FC<ServiceReviewsSectionProps> = ({
  serviceId,
  providerId,
  title,
}) => {
  const { language } = useLanguage();

  const [data, setData] = useState<ServiceReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const loadReviews = async () => {
    setLoading(true);
    try {
      if (serviceId) {
        const res = await fetchServiceReviews(serviceId, page, 5);
        setData(res);
      } else if (providerId) {
        const res = await fetchProviderReviews(providerId, page, 5);
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [serviceId, providerId, page]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{language === 'bn' ? 'রিভিউ লোড হচ্ছে...' : 'Loading reviews...'}</span>
      </div>
    );
  }

  const summary = data?.summary || {
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as ReviewBreakdown,
  };

  const reviews = data?.reviews || [];
  const total = summary.totalReviews;

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          {title || (language === 'bn' ? 'গ্রাহকদের রিভিউ ও রেটিং' : 'Customer Reviews & Ratings')}
        </h3>
        <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          {`${total} ${language === 'bn' ? 'টি রিভিউ' : 'reviews'}`}
        </span>
      </div>

      {/* Summary Score & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        {/* Score Box */}
        <div className="text-center md:border-r border-slate-100 dark:border-slate-800 md:pr-6 space-y-1">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '5.0'}
          </div>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  (summary.averageRating || 5) >= s ? 'fill-amber-400' : 'text-slate-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {language === 'bn'
              ? `${total} টি যাচাইকৃত মূল্যায়নের ভিত্তিতে`
              : `Based on ${total} verified ratings`}
          </p>
        </div>

        {/* 5-Star Breakdown Bars */}
        <div className="md:col-span-2 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.breakdown[star] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  {star} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-slate-400 text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {language === 'bn'
                ? 'এখনও কোনো রিভিউ দেওয়া হয়নি'
                : 'No reviews yet'}
            </p>
            <p className="text-xs">
              {language === 'bn'
                ? 'সার্ভিস সম্পন্ন করার পর প্রথম রিভিউটি প্রদান করুন!'
                : 'Be the first to review after completing your service!'}
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <ReviewDisplayCard
              key={rev._id}
              review={rev}
              onReplyUpdated={() => loadReviews()}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            {language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
          </button>
          <span className="text-xs text-slate-500">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            {language === 'bn' ? 'পরবর্তী' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};
