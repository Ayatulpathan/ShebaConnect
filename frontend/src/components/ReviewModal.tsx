import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { createReview } from '../services/api.js';
import type { Review, ReviewCategories } from '../types/index.js';

interface ReviewModalProps {
  bookingId: string;
  serviceTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: Review) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  bookingId,
  serviceTitle,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { language } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [categories, setCategories] = useState<ReviewCategories>({
    punctuality: 5,
    quality: 5,
    behavior: 5,
    costTransparency: 5,
  });

  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (key: keyof ReviewCategories, val: number) => {
    setCategories((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে কমপক্ষে ৫ অক্ষরের মন্তব্য লিখুন'
          : 'Please write a review comment of at least 5 characters'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const review = await createReview({
        bookingId,
        rating,
        categories,
        comment: comment.trim(),
      });

      setSuccessMsg(
        language === 'bn'
          ? 'আপনার মূল্যবান মতামতের জন্য ধন্যবাদ!'
          : 'Thank you for your valuable feedback!'
      );

      setTimeout(() => {
        onReviewSubmitted(review);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabels: Record<keyof ReviewCategories, { en: string; bn: string }> = {
    punctuality: { en: 'Punctuality & Timing', bn: 'সময়ানুবর্তিতা' },
    quality: { en: 'Service Quality', bn: 'কাজের মান' },
    behavior: { en: 'Professional Behavior', bn: 'পেশাদার আচরণ' },
    costTransparency: { en: 'Cost Transparency', bn: 'খরচের স্বচ্ছতা' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in perspective-1000">
      <div className="modal-3d-enter preserve-3d relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-3d-emerald border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/40 dark:bg-emerald-950/20">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{language === 'bn' ? 'সেবার রিভিউ ও রেটিং দিন' : 'Rate & Review Service'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-100 text-amber-800 font-extrabold uppercase">3D Star</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {serviceTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 text-sm bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-sm bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Overall Rating Stars with 3D Physics */}
          <div className="glass-3d-card text-center py-4 bg-gradient-to-b from-amber-50/50 to-white dark:bg-slate-800/50 rounded-2xl border border-amber-100/80 dark:border-slate-800 shadow-sm">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              {language === 'bn' ? 'সার্বিক সন্তুষ্টি রেটিং' : 'Overall Satisfaction'}
            </label>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  aria-label={`Rate ${star} star`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="star-3d p-1.5 focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      (hoverRating !== null ? hoverRating >= star : rating >= star)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
              {rating === 5 && (language === 'bn' ? 'অসাধারণ (৫/৫)' : 'Excellent (5/5)')}
              {rating === 4 && (language === 'bn' ? 'খুব ভালো (৪/৫)' : 'Very Good (4/5)')}
              {rating === 3 && (language === 'bn' ? 'সন্তোষজনক (৩/৫)' : 'Satisfactory (3/5)')}
              {rating === 2 && (language === 'bn' ? 'উন্নতি প্রয়োজন (২/৫)' : 'Needs Improvement (2/5)')}
              {rating === 1 && (language === 'bn' ? 'অসন্তোষজনক (১/৫)' : 'Poor (1/5)')}
            </p>
          </div>

          {/* Detailed Category Ratings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'বিস্তারিত মানদণ্ড' : 'Detailed Criteria'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(categoryLabels) as Array<keyof ReviewCategories>).map((key) => (
                <div
                  key={key}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? categoryLabels[key].bn : categoryLabels[key].en}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        type="button"
                        key={val}
                        aria-label={`Set ${key} to ${val}`}
                        onClick={() => handleCategoryChange(key, val)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-colors ${
                            categories[key] >= val
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'আপনার অভিজ্ঞতা ও মন্তব্য' : 'Your Review & Comments'}
              </label>
              <span className="text-[11px] text-slate-400">
                {comment.length}/1000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'টেকনিশিয়ানের কাজের মান, ব্যবহার বা সার্ভিস নিয়ে বিস্তারিত লিখুন...'
                  : 'Describe technician work quality, punctuality, or helpful tips...'
              }
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-3d px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-3d-emerald transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {language === 'bn' ? 'রিভিউ জমা দিন' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
