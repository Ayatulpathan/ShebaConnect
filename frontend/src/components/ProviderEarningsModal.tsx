import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { fetchProviderEarningsSummary } from '../services/api.js';
import type { ProviderEarningsSummary } from '../types/index.js';
import {
  X,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Coins,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderEarningsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [summary, setSummary] = useState<ProviderEarningsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProviderEarningsSummary();
      setSummary(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {language === 'bn' ? 'আয় ও প্ল্যাটফর্ম কমিশন লেজার' : 'Earnings & Platform Commission Ledger'}
              </h2>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'ক্যাশ অন সার্ভিস আয়, প্রোভাইডার নেট লাভ ও কমিশন হিসাব'
                  : 'Cash earnings, net provider payouts, and platform commission ledger'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSummary}
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

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && !summary ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs">
                {language === 'bn' ? 'আর্থিক তথ্য লোড হচ্ছে...' : 'Loading financial summary...'}
              </p>
            </div>
          ) : summary ? (
            <>
              {/* Top Financial Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Gross Revenue */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    {language === 'bn' ? 'মোট সংগৃহীত ক্যাশ' : 'Gross Cash Collected'}
                  </span>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    ৳{summary.totalGrossRevenue.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {summary.totalBookings} {language === 'bn' ? 'টি বুকিং' : 'completed jobs'}
                  </span>
                </div>

                {/* Net Earnings */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">
                    {language === 'bn' ? 'আপনার নেট আয় (৯০%)' : 'Net Earnings (90%)'}
                  </span>
                  <div className="text-xl font-black text-emerald-800 mt-1">
                    ৳{summary.totalNetEarnings.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600">
                    {language === 'bn' ? 'কমিশন বাদে নিজস্ব আয়' : 'After platform fee'}
                  </span>
                </div>

                {/* Pending Commission Due */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {language === 'bn' ? 'বকেয়া কমিশন (১০%)' : 'Commission Due (10%)'}
                  </span>
                  <div className="text-xl font-black text-amber-800 mt-1">
                    ৳{summary.pendingCommissionDue.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-amber-600">
                    {language === 'bn' ? 'পরিশোধের অপেক্ষায়' : 'Pending settlement'}
                  </span>
                </div>

                {/* Settled Commission */}
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    {language === 'bn' ? 'পরিশোধিত কমিশন' : 'Settled Commission'}
                  </span>
                  <div className="text-xl font-black text-purple-800 mt-1">
                    ৳{summary.settledCommission.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-purple-600">
                    {language === 'bn' ? 'অ্যাডমিন দ্বারা নিষ্পত্তি' : 'Settled with admin'}
                  </span>
                </div>
              </div>

              {/* Commission Policy Banner */}
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-start gap-3">
                <Coins className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                <div className="text-xs text-brand-900 leading-relaxed">
                  <span className="font-bold">
                    {language === 'bn'
                      ? 'জিরো-কস্ট ক্যাশ পলিসি (Zero-Cost Cash Architecture): '
                      : 'Zero-Cost Cash Architecture Policy: '}
                  </span>
                  {language === 'bn'
                    ? 'গ্রাহক সার্ভিসের পর সরাসরি আপনাকে সম্পূর্ণ ক্যাশ বুঝিয়ে দেন। কোনো গেটওয়ে ফি নেই (৳০ খরচ)। প্ল্যাটফর্মের পরিচালনা বাবদ ১০% কমিশন লেজারে নথিভুক্ত থাকে, যা নির্দিষ্ট বিরতিতে সরাসরি অফিসে বা নির্ধারিত উপায়ে নিষ্পত্তি করা হয়।'
                    : 'Customers pay 100% in cash directly upon service completion with zero payment gateway fees. A 10% platform commission is tracked transparently in this ledger and settled manually with administration.'}
                </div>
              </div>

              {/* Recent Commission Entries Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  {language === 'bn'
                    ? 'সাম্প্রতিক ট্রানজ্যাকশন লেজার'
                    : 'Recent Commission & Job Records'}
                </h3>

                {summary.recentEntries.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    {language === 'bn'
                      ? 'এখনো কোনো সম্পন্ন বুকিংয়ের পেমেন্ট রেকর্ড নেই'
                      : 'No confirmed cash payment records yet'}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'বুকিং নম্বর' : 'Booking No'}
                          </th>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'মোট ক্যাশ' : 'Gross Cash'}
                          </th>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'নেট আয় (৯০%)' : 'Net Earnings'}
                          </th>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'কমিশন (১০%)' : 'Commission'}
                          </th>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                          </th>
                          <th className="py-2.5 px-3">
                            {language === 'bn' ? 'তারিখ' : 'Date'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {summary.recentEntries.map((entry) => (
                          <tr key={entry._id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                              {entry.booking?.bookingNumber || 'SC-BOOKING'}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                              ৳{entry.totalAmount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">
                              ৳{entry.providerEarnings.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-amber-700">
                              ৳{entry.commissionAmount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  entry.status === 'SETTLED'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {entry.status === 'SETTLED'
                                  ? language === 'bn'
                                    ? 'নিষ্পত্তিকৃত'
                                    : 'Settled'
                                  : language === 'bn'
                                  ? 'বকেয়া'
                                  : 'Due'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
