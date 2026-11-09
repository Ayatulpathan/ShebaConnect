import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchBookings,
  transitionBookingStatus,
  fetchQuotes,
  respondToQuote,
} from '../services/api.js';
import type { Booking, BookingStatus, Quote } from '../types/index.js';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  DollarSign,
  Calendar,
  MapPin,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialBookingId?: string;
}

const LIFECYCLE_STEPS: { status: BookingStatus; en: string; bn: string }[] = [
  { status: 'REQUESTED', en: 'Requested', bn: 'অনুরোধকৃত' },
  { status: 'ACCEPTED', en: 'Accepted', bn: 'গৃহীত' },
  { status: 'SCHEDULED', en: 'Scheduled', bn: 'নির্ধারিত' },
  { status: 'ON_THE_WAY', en: 'On The Way', bn: 'রওনা হয়েছেন' },
  { status: 'IN_PROGRESS', en: 'In Progress', bn: 'কাজ চলছে' },
  { status: 'COMPLETED', en: 'Completed', bn: 'সম্পন্ন' },
];

export const BookingTrackerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialBookingId,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchBookings({ limit: 20 });
      setBookings(data.bookings);

      if (initialBookingId) {
        const found = data.bookings.find((b) => b._id === initialBookingId);
        if (found) setSelectedBooking(found);
      } else if (data.bookings.length > 0 && !selectedBooking) {
        setSelectedBooking(data.bookings[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBookings();
    }
  }, [isOpen, initialBookingId]);

  useEffect(() => {
    if (selectedBooking) {
      fetchQuotes(selectedBooking._id)
        .then((q) => setQuotes(q))
        .catch(() => setQuotes([]));
    }
  }, [selectedBooking]);

  if (!isOpen) return null;

  const handleTransition = async (newStatus: BookingStatus, reason?: string) => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await transitionBookingStatus(selectedBooking._id, {
        status: newStatus,
        reason,
      });
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      setSuccessMsg(
        language === 'bn'
          ? `বুকিং স্ট্যাটাস সফলভাবে '${newStatus}'-এ পরিবর্তিত হয়েছে`
          : `Booking transitioned to ${newStatus}`
      );
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuoteResponse = async (quoteId: string, action: 'ACCEPT' | 'REJECT') => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await respondToQuote(quoteId, action);
      if (res.booking) {
        setSelectedBooking(res.booking);
        setBookings((prev) =>
          prev.map((b) => (b._id === res.booking?._id ? res.booking! : b))
        );
      }
      setQuotes((prev) =>
        prev.map((q) => (q._id === quoteId ? res.quote : q))
      );
      setSuccessMsg(
        language === 'bn'
          ? action === 'ACCEPT'
            ? 'কোটেশন গ্রহণ করা হয়েছে এবং বুকিং নির্ধারিত হয়েছে'
            : 'কোটেশন বাতিল করা হয়েছে'
          : `Quotation ${action === 'ACCEPT' ? 'accepted' : 'rejected'}`
      );
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStepIndex = (status: BookingStatus) => {
    switch (status) {
      case 'REQUESTED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'SCHEDULED':
      case 'PROVIDER_ASSIGNED':
        return 2;
      case 'ON_THE_WAY':
        return 3;
      case 'IN_PROGRESS':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return -1;
    }
  };

  const currentStep = selectedBooking ? getStatusStepIndex(selectedBooking.status) : 0;
  const isCustomer = user?.role === 'CUSTOMER';
  const isProvider = user?.role === 'INDIVIDUAL_PROVIDER' || user?.role === 'TECHNICIAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {language === 'bn' ? 'বুকিং ট্র্যাকার ও ব্যবস্থাপনা' : 'Booking Tracker & Operations'}
              </h2>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'আপনার সার্ভিস বুকিং, অগ্রগতি ও কোটেশন পর্যালোচনা করুন'
                  : 'Track live service progress, quotations, and assignments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadBookings}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Left: Bookings List */}
          <div className="p-4 space-y-2 overflow-y-auto max-h-[70vh]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {language === 'bn' ? 'আমার বুকিংসহ তালিকা' : 'Bookings List'} ({bookings.length})
            </h3>

            {loading && bookings.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                {language === 'bn' ? 'কোনো বুকিং পাওয়া যায়নি' : 'No bookings found'}
              </p>
            ) : (
              bookings.map((b) => {
                const isSelected = selectedBooking?._id === b._id;
                return (
                  <button
                    key={b._id}
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-brand-50/70 border-brand-300 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{b.bookingNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-gray-200 text-gray-700">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate font-medium">
                      {b.service?.name?.bn || b.service?.name?.en || 'Service'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>{b.serviceAddress?.area}</span>
                      <span className="font-bold text-gray-800">৳{b.finalPrice}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Booking Detail & Progress Tracker */}
          <div className="md:col-span-2 p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {selectedBooking ? (
              <>
                {/* Status Bar */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 block uppercase">
                        {selectedBooking.bookingNumber}
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {selectedBooking.service?.name?.bn ||
                          selectedBooking.service?.name?.en ||
                          'Service'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">
                        {language === 'bn' ? 'পরিশোধযোগ্য ক্যাশ:' : 'Payable Cash:'}
                      </span>
                      <span className="text-lg font-black text-brand-700">
                        ৳{selectedBooking.finalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Lifecycle Steps */}
                  {selectedBooking.status !== 'CANCELLED' &&
                  selectedBooking.status !== 'REJECTED' &&
                  selectedBooking.status !== 'DISPUTED' ? (
                    <div className="grid grid-cols-6 gap-1 pt-2">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx;
                        const isCurrent = currentStep === idx;
                        return (
                          <div key={step.status} className="flex flex-col items-center text-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all mb-1 ${
                                isCurrent
                                  ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md scale-105'
                                  : isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {isDone && !isCurrent ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-[10px] leading-tight font-medium ${
                                isCurrent
                                  ? 'text-brand-700 font-bold'
                                  : isDone
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {language === 'bn' ? step.bn : step.en}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{selectedBooking.status}</span>
                      {selectedBooking.cancellationReason && (
                        <span className="font-normal text-[11px] block text-red-600 ml-2">
                          ({selectedBooking.cancellationReason})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      {language === 'bn' ? 'সার্ভিস ঠিকানা' : 'Service Address'}
                    </span>
                    <p className="font-bold text-gray-800">
                      {selectedBooking.serviceAddress?.addressLine}
                    </p>
                    <p className="text-gray-500">
                      {selectedBooking.serviceAddress?.area} •{' '}
                      {selectedBooking.serviceAddress?.contactPhone}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {language === 'bn' ? 'সময়সূচী' : 'Schedule'}
                    </span>
                    <p className="font-bold text-gray-800">
                      {new Date(selectedBooking.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500">{selectedBooking.preferredTimeSlot}</p>
                  </div>
                </div>

                {/* Quotations Section (if any) */}
                {quotes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-brand-600" />
                      <span>{language === 'bn' ? 'প্রদত্ত কোটেশনসমূহ' : 'Quotations'}</span>
                    </h4>

                    {quotes.map((q) => (
                      <div
                        key={q._id}
                        className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900 text-sm">
                            ৳{q.amount.toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-purple-200 text-purple-700">
                            {q.status}
                          </span>
                        </div>
                        {q.notes && <p className="text-gray-600">{q.notes}</p>}

                        {/* Customer Accept / Reject buttons */}
                        {isCustomer && q.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleQuoteResponse(q._id, 'REJECT')}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-semibold"
                            >
                              {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleQuoteResponse(q._id, 'ACCEPT')}
                              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
                            >
                              {language === 'bn' ? 'কোটেশন গ্রহণ করুন' : 'Accept Quote'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Role Actions */}
                <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                  {/* Customer Cancel Option */}
                  {isCustomer &&
                    ['REQUESTED', 'ACCEPTED', 'SCHEDULED'].includes(selectedBooking.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          const reason = prompt(
                            language === 'bn'
                              ? 'বাতিল করার কারণ লিখুন:'
                              : 'Reason for cancellation:'
                          );
                          if (reason) handleTransition('CANCELLED', reason);
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
                      >
                        {language === 'bn' ? 'বুকিং বাতিল করুন' : 'Cancel Booking'}
                      </button>
                    )}

                  {/* Provider Actions */}
                  {isProvider && (
                    <div className="flex items-center gap-2 ml-auto">
                      {selectedBooking.status === 'REQUESTED' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleTransition('ACCEPTED')}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          {language === 'bn' ? 'বুকিং গ্রহণ করুন' : 'Accept Booking'}
                        </button>
                      )}

                      {['SCHEDULED', 'PROVIDER_ASSIGNED'].includes(selectedBooking.status) && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleTransition('ON_THE_WAY')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'রওনা হয়েছি' : 'On The Way'}</span>
                        </button>
                      )}

                      {selectedBooking.status === 'ON_THE_WAY' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleTransition('IN_PROGRESS')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'কাজ শুরু করুন' : 'Start Service'}</span>
                        </button>
                      )}

                      {selectedBooking.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleTransition('COMPLETED')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'কাজ সম্পন্ন হয়েছে' : 'Complete Service'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">
                {language === 'bn'
                  ? 'বিস্তারিত দেখতে বাঁপাশ থেকে একটি বুকিং নির্বাচন করুন'
                  : 'Select a booking on the left to track progress'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
