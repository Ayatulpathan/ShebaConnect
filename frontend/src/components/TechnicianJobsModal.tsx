import React, { useState, useEffect } from 'react';
import {
  Wrench,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Loader2,
  X,
  MessageSquare,
  Banknote,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import {
  fetchTechnicianJobs,
  transitionBookingStatus,
  recordCashCollection,
} from '../services/api.js';
import { BookingChatDrawer } from './BookingChatDrawer.js';
import type { Booking, BookingStatus } from '../types/index.js';

interface TechnicianJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicianJobsModal: React.FC<TechnicianJobsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();

  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Chat drawer state
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchTechnicianJobs();
      setJobs(data);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load assigned jobs'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (bookingId: string, nextStatus: BookingStatus) => {
    setActionLoading(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await transitionBookingStatus(bookingId, {
        status: nextStatus,
      });
      setJobs((prev) => prev.map((j) => (j._id === bookingId ? updated : j)));
      setSuccessMsg(
        language === 'bn'
          ? `কাজের স্ট্যাটাস সফলভাবে '${nextStatus}'-এ পরিবর্তিত হয়েছে`
          : `Job status transitioned to ${nextStatus}`
      );
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCollectCash = async (booking: Booking) => {
    const amount = booking.finalPrice || booking.basePrice;
    if (
      !confirm(
        language === 'bn'
          ? `গ্রাহকের নিকট থেকে ৳${amount.toLocaleString()} নগদ ক্যাশ বুঝে পেয়েছেন?`
          : `Confirm collecting ৳${amount.toLocaleString()} cash from customer?`
      )
    ) {
      return;
    }

    setActionLoading(booking._id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await recordCashCollection(booking._id, amount);
      setSuccessMsg(
        language === 'bn'
          ? 'ক্যাশ সংগ্রহ সফলভাবে রেকর্ড করা হয়েছে'
          : 'Cash collection recorded successfully'
      );
      loadJobs();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {language === 'bn' ? 'আমার বরাদ্দকৃত কাজসমূহ' : 'My Assigned Jobs'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'টেকনিশিয়ান টাস্ক ড্যাশবোর্ড' : 'Technician Field Execution Dashboard'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{language === 'bn' ? 'কাজসমূহ লোড হচ্ছে...' : 'Loading assigned jobs...'}</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Wrench className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? 'কোনো কাজ নির্ধারিত নেই' : 'No jobs currently assigned'}
              </p>
              <p className="text-xs">
                {language === 'bn'
                  ? 'আপনার প্রতিষ্ঠান কোনো কাজ বরাদ্দ করলে এখানে দৃশ্যমান হবে।'
                  : 'Assigned jobs dispatched by your company will appear here.'}
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const isWorking = actionLoading === job._id;
              return (
                <div
                  key={job._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        #{job.bookingNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
                        {job.status}
                      </span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ৳{(job.finalPrice || job.basePrice).toLocaleString()}
                    </span>
                  </div>

                  {/* Customer and Address Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">{language === 'bn' ? 'গ্রাহক তথ্য' : 'Customer Info'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {(job.customer as any)?.name}
                      </p>
                      <a
                        href={`tel:${(job.customer as any)?.phone || job.serviceAddress?.contactPhone}`}
                        className="text-blue-600 font-semibold flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {(job.customer as any)?.phone || job.serviceAddress?.contactPhone}
                      </a>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">{language === 'bn' ? 'সার্ভিস ঠিকানা' : 'Service Address'}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <span>{job.serviceAddress?.addressLine}, {job.serviceAddress?.area}</span>
                      </p>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5">{language === 'bn' ? 'সমস্যার বিবরণ' : 'Problem Description'}</span>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{job.problemDescription}"
                      </p>
                    </div>
                  </div>

                  {/* Actions & Lifecycle Progress */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setChatBooking(job)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      {language === 'bn' ? 'গ্রাহকের সাথে চ্যাট' : 'Chat with Customer'}
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      {job.status === 'PROVIDER_ASSIGNED' && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleUpdateStatus(job._id, 'ON_THE_WAY')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                          {language === 'bn' ? 'রওনা হোন' : 'On The Way'}
                        </button>
                      )}

                      {job.status === 'ON_THE_WAY' && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleUpdateStatus(job._id, 'IN_PROGRESS')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                          {language === 'bn' ? 'কাজ শুরু করুন' : 'Start Service'}
                        </button>
                      )}

                      {job.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleUpdateStatus(job._id, 'COMPLETED')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {language === 'bn' ? 'কাজ সমাপ্ত করুন' : 'Complete Service'}
                        </button>
                      )}

                      {job.status === 'COMPLETED' && !job.isPaid && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleCollectCash(job)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
                          {language === 'bn' ? 'ক্যাশ গ্রহণ রেকর্ড করুন' : 'Record Cash Received'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Real-time Customer Chat Drawer */}
      {chatBooking && (
        <BookingChatDrawer
          isOpen={!!chatBooking}
          onClose={() => setChatBooking(null)}
          bookingId={chatBooking._id}
          bookingNumber={chatBooking.bookingNumber}
          partnerName={(chatBooking.customer as any)?.name || 'Customer'}
        />
      )}
    </div>
  );
};
