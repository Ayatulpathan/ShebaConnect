import React, { useState } from 'react';
import { Star, MessageSquare, Send, CornerDownRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { replyToReview } from '../services/api.js';
import type { Review } from '../types/index.js';

interface ReviewDisplayCardProps {
  review: Review;
  onReplyUpdated?: (updated: Review) => void;
}

export const ReviewDisplayCard: React.FC<ReviewDisplayCardProps> = ({
  review,
  onReplyUpdated,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [currentReview, setCurrentReview] = useState<Review>(review);

  // Check if current user is the provider or technician or admin
  const canReply =
    user &&
    !currentReview.providerReply &&
    (user.role === 'INDIVIDUAL_PROVIDER' ||
      user.role === 'COMPANY_OWNER' ||
      user.role === 'TECHNICIAN' ||
      user.role === 'ADMIN');

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim().length < 2) return;

    setSubmittingReply(true);
    try {
      const updated = await replyToReview(currentReview._id, replyText.trim());
      setCurrentReview(updated);
      setIsReplying(false);
      setReplyText('');
      onReplyUpdated?.(updated);
    } catch (err) {
      console.error('Failed to submit reply', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      {/* Reviewer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shadow-inner">
            {currentReview.customer?.name?.[0] || 'C'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {currentReview.customer?.name || (language === 'bn' ? 'সম্মানিত গ্রাহক' : 'Customer')}
            </h4>
            <span className="text-[11px] text-slate-400">
              {formatDate(currentReview.createdAt)}
            </span>
          </div>
        </div>

        {/* Star Rating Badge */}
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
            {currentReview.rating}.0
          </span>
        </div>
      </div>

      {/* Category Ratings Pills */}
      {currentReview.categories && (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>{language === 'bn' ? 'সময়ানুবর্তিতা:' : 'Punctuality:'}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              ★{currentReview.categories.punctuality}
            </span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>{language === 'bn' ? 'কাজের মান:' : 'Quality:'}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              ★{currentReview.categories.quality}
            </span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>{language === 'bn' ? 'আচরণ:' : 'Behavior:'}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              ★{currentReview.categories.behavior}
            </span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <span>{language === 'bn' ? 'খরচের স্বচ্ছতা:' : 'Cost:'}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              ★{currentReview.categories.costTransparency}
            </span>
          </span>
        </div>
      )}

      {/* Comment */}
      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        "{currentReview.comment}"
      </p>

      {/* Provider Reply Display */}
      {currentReview.providerReply && (
        <div className="mt-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'bn' ? 'সার্ভিস প্রদানকারীর উত্তর' : 'Provider Reply'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 ml-auto">
              {formatDate(currentReview.repliedAt)}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 pl-5 whitespace-pre-line italic">
            "{currentReview.providerReply}"
          </p>
        </div>
      )}

      {/* Provider Reply Input Toggle */}
      {canReply && !isReplying && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            {language === 'bn' ? 'রিভিউয়ের উত্তর দিন' : 'Reply to Review'}
          </button>
        </div>
      )}

      {/* Reply Input Form */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="pt-2 space-y-2">
          <textarea
            rows={2}
            maxLength={500}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'সম্মানিত গ্রাহককে ধন্যবাদ জানিয়ে মন্তব্য লিখুন...'
                : 'Write a polite response to the customer...'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              disabled={submittingReply}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submittingReply ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              {language === 'bn' ? 'পাঠান' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
