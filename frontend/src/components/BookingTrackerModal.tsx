import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchBookings,
  transitionBookingStatus,
  fetchQuotes,
  respondToQuote,
  fetchBookingPayment,
  recordCashCollection,
  confirmCashPayment,
  disputeCashPayment,
  fetchBookingReceipt,
} from '../services/api.js';
import type {
  Booking,
  BookingStatus,
  Quote,
  CashPayment,
  CashReceipt,
} from '../types/index.js';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  Loader2,
  RefreshCw,
  Receipt,
  Banknote,
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
  const [payment, setPayment] = useState<CashPayment | null>(null);
  const [receipt, setReceipt] = useState<CashReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [cashAmountInput, setCashAmountInput] = useState<number>(0);
  const [cashNotesInput, setCashNotesInput] = useState<string>('');

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

      fetchBookingPayment(selectedBooking._id)
        .then((res) => {
          setPayment(res.payment);
          setCashAmountInput(res.payment.amountExpected || selectedBooking.finalPrice || selectedBooking.basePrice);
        })
        .catch(() => setPayment(null));
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
      // Refresh payment record
      fetchBookingPayment(updated._id)
        .then((res) => setPayment(res.payment))
        .catch(() => {});
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
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordCashCollection = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updatedPayment = await recordCashCollection(
        selectedBooking._id,
        cashAmountInput || selectedBooking.finalPrice || selectedBooking.basePrice,
        cashNotesInput
      );
      setPayment(updatedPayment);
      setSuccessMsg(
        language === 'bn'
          ? 'ক্যাশ সংগ্রহ সফলভাবে রেকর্ড করা হয়েছে'
          : 'Cash collection recorded successfully'
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

  const handleConfirmCashHandover = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await confirmCashPayment(selectedBooking._id);
      setPayment(result.payment);
      setSelectedBooking((prev) => (prev ? { ...prev, isPaid: true } : null));
      setBookings((prev) =>
        prev.map((b) => (b._id === selectedBooking._id ? { ...b, isPaid: true } : b))
      );
      setSuccessMsg(
        language === 'bn'
          ? 'ক্যাশ পেমেন্ট নিশ্চিত করা হয়েছে এবং রসিদ ইস্যু করা হয়েছে'
          : 'Cash payment confirmed and official receipt issued'
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

  const handleDisputePayment = async () => {
    if (!selectedBooking) return;
    const reason = prompt(
      language === 'bn'
        ? 'পেমেন্ট বিরোধ বা সমস্যার কারণ লিখুন:'
        : 'State the reason for payment dispute:'
    );
    if (!reason) return;

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await disputeCashPayment(selectedBooking._id, reason);
      setPayment(updated);
      setSuccessMsg(
        language === 'bn'
          ? 'পেমেন্ট বিরোধ নথিভুক্ত করা হয়েছে'
          : 'Payment dispute registered'
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

  const handleViewReceipt = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const r = await fetchBookingReceipt(selectedBooking._id);
      setReceipt(r);
      setShowReceiptModal(true);
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
  const isProvider =
    user?.role === 'INDIVIDUAL_PROVIDER' ||
    user?.role === 'TECHNICIAN' ||
    user?.role === 'COMPANY_OWNER';

  return (
    <>
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
                    ? 'আপনার সার্ভিস বুকিং, অগ্রগতি ও ক্যাশ পেমেন্ট পর্যালোচনা করুন'
                    : 'Track live service progress, quotations, and cash payments'}
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
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-gray-900">
                          {b.bookingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : b.status === 'CANCELLED' || b.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-gray-800 truncate">
                        {b.service?.name?.[language] || b.service?.name?.en || 'Service'}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                        <span>{b.serviceAddress?.area}</span>
                        <span className="font-bold text-gray-700">
                          ৳{(b.finalPrice || b.basePrice).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: Selected Booking Details */}
            <div className="md:col-span-2 p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {selectedBooking ? (
                <>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">
                          {selectedBooking.service?.name?.[language] ||
                            selectedBooking.service?.name?.en ||
                            'Service Request'}
                        </h3>
                        <span className="font-mono text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-semibold">
                          {selectedBooking.bookingNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(selectedBooking.scheduledDate).toLocaleDateString()}{' '}
                        • {selectedBooking.preferredTimeSlot}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          selectedBooking.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedBooking.status === 'CANCELLED' ||
                              selectedBooking.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>

                  {/* Lifecycle Tracker */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      {language === 'bn' ? 'অগ্রগতি ট্র্যাকার' : 'Service Progress'}
                    </h4>
                    <div className="grid grid-cols-6 gap-1">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx && currentStep !== -1;
                        const isCurrent = currentStep === idx;
                        return (
                          <div key={step.status} className="flex flex-col items-center text-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-brand-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-400'
                              } ${isCurrent ? 'ring-2 ring-brand-300 ring-offset-2' : ''}`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1 font-medium ${
                                isDone ? 'text-gray-900 font-bold' : 'text-gray-400'
                              }`}
                            >
                              {step[language]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">
                        {language === 'bn' ? 'সার্ভিস ঠিকানা' : 'Address'}:
                      </span>
                      <p className="font-semibold text-gray-800">
                        {selectedBooking.serviceAddress?.addressLine},{' '}
                        {selectedBooking.serviceAddress?.area}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {selectedBooking.serviceAddress?.contactName} (
                        {selectedBooking.serviceAddress?.contactPhone})
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 block mb-0.5">
                        {language === 'bn' ? 'মূল্য ও পেমেন্ট পদ্ধতি' : 'Price & Payment'}:
                      </span>
                      <p className="font-bold text-brand-700 text-sm">
                        ৳{(selectedBooking.finalPrice || selectedBooking.basePrice).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {language === 'bn'
                          ? 'ক্যাশ অন সার্ভিস (সার্ভিস সমাপ্তির পর নগদ)'
                          : 'Cash after service only'}
                      </p>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-gray-200/60">
                      <span className="text-gray-400 block mb-0.5">
                        {language === 'bn' ? 'সমস্যার বিবরণ' : 'Problem Description'}:
                      </span>
                      <p className="text-gray-700">{selectedBooking.problemDescription}</p>
                    </div>
                  </div>

                  {/* Quotations Section */}
                  {quotes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {language === 'bn' ? 'প্রদত্ত কোটেশন' : 'Quotations'} ({quotes.length})
                      </h4>
                      {quotes.map((q) => (
                        <div
                          key={q._id}
                          className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/30 text-xs space-y-2"
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

                  {/* Phase 6: Cash Payment & Receipt Section */}
                  {['COMPLETED', 'IN_PROGRESS'].includes(selectedBooking.status) && (
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                          <h4 className="font-bold text-gray-900">
                            {language === 'bn'
                              ? 'ক্যাশ আফটার সার্ভিস পেমেন্ট'
                              : 'Cash-After-Service Payment'}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            payment?.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : payment?.status === 'COLLECTED_BY_PROVIDER'
                              ? 'bg-blue-100 text-blue-800'
                              : payment?.status === 'DISPUTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {payment?.status === 'CONFIRMED'
                            ? language === 'bn'
                              ? 'পরিশোধিত (ক্যাশ)'
                              : 'Paid (Cash)'
                            : payment?.status === 'COLLECTED_BY_PROVIDER'
                            ? language === 'bn'
                              ? 'প্রোভাইডারের হাতে হস্তান্তরিত'
                              : 'Collected by Provider'
                            : payment?.status === 'DISPUTED'
                            ? language === 'bn'
                              ? 'বিরোধপূর্ণ'
                              : 'Disputed'
                            : language === 'bn'
                            ? 'পরিশোধ অপেক্ষমাণ'
                            : 'Payment Pending'}
                        </span>
                      </div>

                      {/* Payment Status Message & Actions */}
                      {payment?.status === 'CONFIRMED' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="text-gray-600">
                            {language === 'bn'
                              ? `গ্রাহক দ্বারা নগদ ৳${payment.amountCollected.toLocaleString()} পরিশোধ নিশ্চিত করা হয়েছে।`
                              : `Cash payment of ৳${payment.amountCollected.toLocaleString()} confirmed by customer.`}
                          </div>
                          <button
                            type="button"
                            onClick={handleViewReceipt}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'রসিদ দেখুন' : 'View Receipt'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          {/* Provider cash recording form */}
                          {isProvider && payment?.status === 'PENDING' && (
                            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2">
                              <span className="font-semibold text-gray-800 block">
                                {language === 'bn'
                                  ? 'গ্রাহকের নিকট থেকে সংগৃহীত ক্যাশ রেকর্ড করুন:'
                                  : 'Record cash collected from customer:'}
                              </span>
                              <div className="flex items-start gap-2">
                                <div className="space-y-1.5 flex-1">
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-400 font-bold">
                                      ৳
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={cashAmountInput}
                                      onChange={(e) => setCashAmountInput(Number(e.target.value))}
                                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder={language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}
                                    value={cashNotesInput}
                                    onChange={(e) => setCashNotesInput(e.target.value)}
                                    className="w-full px-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={handleRecordCashCollection}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm self-start mt-0.5"
                                >
                                  {language === 'bn' ? 'সংগ্রহ রেকর্ড করুন' : 'Record Collection'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Customer Confirmation Button */}
                          {isCustomer && (
                            <div className="p-3 bg-white rounded-xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-gray-700 leading-tight">
                                <span className="font-bold block text-gray-900">
                                  {language === 'bn'
                                    ? 'ক্যাশ বুঝিয়ে দিয়েছেন?'
                                    : 'Handed over cash?'}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {language === 'bn'
                                    ? `প্রোভাইডারকে ৳${(payment?.amountCollected || selectedBooking.finalPrice || selectedBooking.basePrice).toLocaleString()} নগদ বুঝিয়ে দিয়ে নিশ্চিত বোতামে ক্লিক করুন।`
                                    : `Confirm handing over ৳${(payment?.amountCollected || selectedBooking.finalPrice || selectedBooking.basePrice).toLocaleString()} in cash to the provider.`}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmCashHandover}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                              >
                                {language === 'bn' ? 'ক্যাশ পরিশোধ নিশ্চিত করুন' : 'Confirm Cash Handover'}
                              </button>
                            </div>
                          )}

                          {/* Dispute option */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleDisputePayment}
                              className="text-[11px] text-red-600 hover:underline font-semibold"
                            >
                              {language === 'bn' ? 'পেমেন্ট সমস্যা জানান' : 'Report Payment Dispute'}
                            </button>
                          </div>
                        </div>
                      )}
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

      {/* Official Receipt Modal */}
      {showReceiptModal && receipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {language === 'bn' ? 'অফিসিয়াল ক্যাশ রসিদ' : 'Official Cash Receipt'}
                </h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'রসিদ নম্বর' : 'Receipt No'}:
                </span>
                <span className="font-mono font-bold text-brand-700">
                  {receipt.receiptNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'বুকিং নম্বর' : 'Booking No'}:
                </span>
                <span className="font-mono font-semibold text-gray-800">
                  {receipt.bookingNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'সার্ভিস' : 'Service'}:
                </span>
                <span className="font-semibold text-gray-800">
                  {receipt.service.name?.[language] || receipt.service.name?.en}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'গ্রাহক' : 'Customer'}:
                </span>
                <span className="text-gray-800">{receipt.customer.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'প্রোভাইডার' : 'Provider'}:
                </span>
                <span className="text-gray-800">{receipt.provider.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {language === 'bn' ? 'পরিশোধ পদ্ধতি' : 'Payment Method'}:
                </span>
                <span className="text-emerald-700 font-medium">
                  {language === 'bn' ? 'ক্যাশ অন ডেলিভারি (নগদ)' : 'Cash After Service'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-900">
                  {language === 'bn' ? 'পরিশোধিত মোট' : 'Total Paid'}:
                </span>
                <span className="text-emerald-700 font-black text-base">
                  ৳{receipt.amountCollected.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                {language === 'bn' ? 'রসিদ প্রিন্ট / সংরক্ষণ' : 'Print / Save Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
