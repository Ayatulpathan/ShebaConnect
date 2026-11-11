import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import { createBooking } from '../services/api.js';
import { DHAKA_AREAS } from '../constants/areas.js';
import type { Service, Booking } from '../types/index.js';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react';

interface Props {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
  onRequireAuth?: () => void;
}

const TIME_SLOTS = [
  { id: 'morning', en: 'Morning (09:00 AM - 12:00 PM)', bn: 'সকাল (০৯:০০ - ১২:০০)' },
  { id: 'afternoon', en: 'Afternoon (01:00 PM - 04:00 PM)', bn: 'দুপুর (০১:০০ - ০৪:০০)' },
  { id: 'evening', en: 'Evening (04:00 PM - 07:00 PM)', bn: 'বিকাল (০৪:০০ - ০৭:০০)' },
  { id: 'night', en: 'Night (07:00 PM - 09:00 PM)', bn: 'রাত (০৭:০০ - ০৯:০০)' },
];

export const BookingModal: React.FC<Props> = ({
  service,
  isOpen,
  onClose,
  onBookingSuccess,
  onRequireAuth,
}) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  const [problemDescription, setProblemDescription] = useState('');
  const [selectedArea, setSelectedArea] = useState('mirpur');
  const [addressLine, setAddressLine] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0].en);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync contact details when user logs in while modal is open
  useEffect(() => {
    if (user?.name && !contactName) {
      setContactName(user.name);
    }
    if (user?.phone && !contactPhone) {
      setContactPhone(user.phone);
    }
  }, [user]);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    if (problemDescription.trim().length < 10) {
      setErrorMsg(
        language === 'bn'
          ? 'সমস্যার বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে'
          : 'Problem description must be at least 10 characters'
      );
      return;
    }

    if (!contactName.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে যোগাযোগের নাম প্রদান করুন'
          : 'Please provide contact name'
      );
      return;
    }

    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!contactPhone.trim() || !bdPhoneRegex.test(contactPhone.trim())) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমনঃ 01712345678 বা +8801712345678)'
          : 'Please enter a valid Bangladeshi mobile number (e.g. 01712345678 or +8801712345678)'
      );
      return;
    }

    if (!addressLine.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে বিস্তারিত ঠিকানা প্রদান করুন (বাড়ি/রোড/ফ্ল্যাট)'
          : 'Please enter full house/road/flat address details'
      );
      return;
    }

    setLoading(true);
    try {
      const booking = await createBooking({
        serviceId: service._id,
        problemDescription: problemDescription.trim(),
        serviceAddress: {
          area: selectedArea,
          addressLine: addressLine.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
        },
        scheduledDate: new Date(scheduledDate).toISOString(),
        preferredTimeSlot: timeSlot,
      });

      onBookingSuccess?.(booking);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to create booking'
      );
    } finally {
      setLoading(false);
    }
  };

  const serviceTitle = language === 'bn' ? service.name.bn : service.name.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-600 uppercase">
              {language === 'bn' ? 'সার্ভিস বুকিং' : 'Service Booking'}
            </span>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {serviceTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'bn'
                    ? 'বুকিং করতে অনুগ্রহ করে লগইন করুন'
                    : 'Please log in to book this service'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {language === 'bn'
                    ? 'বুকিং ট্র্যাকিং এবং টেকনিশিয়ান যোগাযোগের জন্য অ্যাকাউন্ট প্রয়োজন।'
                    : 'An account is required for tracking booking progress and technician communication.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                {language === 'bn' ? 'লগইন / নিবন্ধন করুন' : 'Log In / Register'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Problem Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn'
                    ? 'সমস্যা বা চাহিদার বিবরণ (কমপক্ষে ১০ অক্ষর)'
                    : 'Describe the problem / requirements (min 10 chars)'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'উদাঃ এসির ইনডোর ইউনিট থেকে পানি পড়ছে এবং ঠাণ্ডা বাতাস কম আসছে...'
                      : 'e.g., Water is dripping from indoor AC unit and cooling is weak...'
                  }
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Service Address */}
              <div className="space-y-3 p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>{language === 'bn' ? 'সার্ভিস ঠিকানা (ঢাকা)' : 'Service Address (Dhaka)'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      {language === 'bn' ? 'এলাকা' : 'Dhaka Zone'}
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {DHAKA_AREAS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {language === 'bn' ? a.bn : a.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      {language === 'bn' ? 'নাম' : 'Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Rahim"
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      {language === 'bn' ? 'ফোন নম্বর' : 'Phone'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    {language === 'bn' ? 'বাড়ি, রোড ও ফ্ল্যাট নম্বর' : 'House, Road & Flat Details'}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="House 14, Road 5, Block B"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Preferred Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{language === 'bn' ? 'পছন্দের তারিখ' : 'Preferred Date'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{language === 'bn' ? 'সময়সূচী' : 'Time Slot'}</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.en}>
                        {language === 'bn' ? slot.bn : slot.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zero-Cost Cash Policy Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {language === 'bn'
                      ? 'ক্যাশ অন সার্ভিস (পরিশোধ কাজ শেষের পর)'
                      : 'Cash After Service Only'}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {language === 'bn'
                      ? 'কোনো অগ্রিম পেমেন্ট বা অনলাইন চার্জ নেই। সার্ভিস সফলভাবে সম্পন্ন হওয়ার পর টেকনিশিয়ানকে সরাসরি ক্যাশে পরিশোধ করুন।'
                      : 'No prepayment or card required. Pay the technician directly in cash only after the work is satisfactorily completed.'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">
                    {language === 'bn' ? 'মূল্য:' : 'Estimated Price:'}
                  </span>
                  <span className="text-base font-extrabold text-gray-900">
                    ৳{service.basePrice.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {language === 'bn' ? 'বুকিং নিশ্চিত করুন' : 'Confirm Request'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
