import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  BarChart3,
  X,
  Trash2,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchMyCompany,
  fetchCompanyMembers,
  addCompanyMember,
  updateCompanyMember,
  removeCompanyMember,
  fetchCompanyBookings,
  assignTechnicianToBooking,
  fetchCompanyMetrics,
} from '../services/api.js';
import type {
  Organization,
  OrganizationMember,
  Booking,
  CompanyMetrics,
  AddMemberDTO,
} from '../types/index.js';

interface CompanyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyDashboardModal: React.FC<CompanyDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'dispatch' | 'analytics'>('staff');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [company, setCompany] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);

  // Add member form state
  const [showAddMember, setShowAddMember] = useState<boolean>(false);
  const [newMember, setNewMember] = useState<AddMemberDTO>({
    name: '',
    email: '',
    phone: '',
    memberRole: 'TECHNICIAN',
    password: '',
  });

  // Selected technician per booking for dispatch tab
  const [selectedTechs, setSelectedTechs] = useState<Record<string, string>>({});

  const loadAllCompanyData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const org = await fetchMyCompany();
      setCompany(org);

      if (org) {
        const [memberList, bookingList, metricData] = await Promise.all([
          fetchCompanyMembers(org._id).catch(() => []),
          fetchCompanyBookings(org._id).catch(() => []),
          fetchCompanyMetrics(org._id).catch(() => null),
        ]);

        setMembers(memberList);
        setBookings(bookingList);
        setMetrics(metricData);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load company information'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllCompanyData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await addCompanyMember(company._id, newMember);
      setMembers((prev) => [result.member, ...prev]);
      setShowAddMember(false);
      setNewMember({
        name: '',
        email: '',
        phone: '',
        memberRole: 'TECHNICIAN',
        password: '',
      });
      setSuccessMsg(
        language === 'bn'
          ? 'নতুন সদস্য সফলভাবে যুক্ত করা হয়েছে'
          : 'New member registered successfully'
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

  const handleToggleMemberStatus = async (member: OrganizationMember) => {
    if (!company) return;
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await updateCompanyMember(company._id, member._id, {
        status: nextStatus,
      });
      setMembers((prev) => prev.map((m) => (m._id === member._id ? updated : m)));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update member status');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!company) return;
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই সদস্যকে সরাতে চান?' : 'Remove this member from company?')) {
      return;
    }
    try {
      await removeCompanyMember(company._id, memberId);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleAssignTechnician = async (bookingId: string) => {
    if (!company) return;
    const techId = selectedTechs[bookingId];
    if (!techId) {
      alert(language === 'bn' ? 'অনুগ্রহ করে টেকনিশিয়ান নির্বাচন করুন' : 'Please select a technician');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updatedBooking = await assignTechnicianToBooking(company._id, bookingId, techId);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? updatedBooking : b))
      );
      setSuccessMsg(
        language === 'bn'
          ? 'টেকনিশিয়ান সফলভাবে নিয়োগ করা হয়েছে'
          : 'Technician dispatched and assigned successfully'
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

  const activeTechnicians = members.filter(
    (m) => m.memberRole === 'TECHNICIAN' && m.status === 'ACTIVE'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {company?.name || (language === 'bn' ? 'প্রতিষ্ঠান ড্যাশবোর্ড' : 'Company Dashboard')}
                </h3>
                {company?.isVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'লাইসেন্স:' : 'Trade License:'} {company?.tradeLicense || 'Pending'}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            {language === 'bn' ? 'কর্মী ও টেকনিশিয়ান' : 'Staff & Technicians'} ({members.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'dispatch'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            {language === 'bn' ? 'কাজ বরাদ্দ ও ট্র্যাকিং' : 'Dispatch & Jobs'} ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {language === 'bn' ? 'আয় ও পারফরম্যান্স' : 'Analytics & Revenue'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {language === 'bn' ? 'কোম্পানি প্রোফাইল' : 'Profile'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{language === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading company data...'}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: STAFF & TECHNICIANS */}
              {activeTab === 'staff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'bn' ? 'প্রতিষ্ঠানের সদস্যবৃন্দ' : 'Company Members'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {language === 'bn'
                          ? 'কর্মীদের মাধ্যমে কাজ পরিচালনা ও টেকনিশিয়ানদের কাজ বরাদ্দ করুন।'
                          : 'Manage staff and dispatch active technicians to incoming jobs.'}
                      </p>
                    </div>
                    {user?.role === 'COMPANY_OWNER' && (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(!showAddMember)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Add Member'}
                      </button>
                    )}
                  </div>

                  {/* Add Member Form Modal / Drawer */}
                  {showAddMember && (
                    <form
                      onSubmit={handleAddMember}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {language === 'bn' ? 'নতুন কর্মী বা টেকনিশিয়ান যুক্ত করুন' : 'Register New Member'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            placeholder="e.g. Rahim Master"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {language === 'bn' ? 'ভূমিকা (Role)' : 'Role'}
                          </label>
                          <select
                            value={newMember.memberRole}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                memberRole: e.target.value as 'STAFF' | 'TECHNICIAN',
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="TECHNICIAN">{language === 'bn' ? 'টেকনিশিয়ান (Field Technician)' : 'Technician'}</option>
                            <option value="STAFF">{language === 'bn' ? 'স্টাফ / ম্যানেজার (Office Staff)' : 'Staff'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {language === 'bn' ? 'ইমেইল' : 'Email Address'}
                          </label>
                          <input
                            type="email"
                            required
                            value={newMember.email}
                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            placeholder="rahim@example.com"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={newMember.phone}
                            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                            placeholder="01712345678"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {language === 'bn' ? 'অস্থায়ী পাসওয়ার্ড' : 'Initial Password'}
                          </label>
                          <input
                            type="password"
                            required
                            value={newMember.password}
                            onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                            placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddMember(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          {language === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Member'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Members List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map((member) => {
                      const u = member.user as any;
                      const isTech = member.memberRole === 'TECHNICIAN';
                      return (
                        <div
                          key={member._id}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs">
                              {u?.name?.[0] || 'M'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-slate-900 dark:text-white">
                                  {u?.name || 'Member'}
                                </h5>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isTech
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                  }`}
                                >
                                  {member.memberRole}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {u?.phone || u?.email}
                              </p>
                              {isTech && (
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  {language === 'bn' ? 'মোট বরাদ্দকৃত কাজ:' : 'Assigned Jobs:'}{' '}
                                  <span className="font-bold text-indigo-600">{member.assignedJobsCount || 0}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {user?.role === 'COMPANY_OWNER' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleMemberStatus(member)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  member.status === 'ACTIVE'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {member.status}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: DISPATCH & JOBS */}
              {activeTab === 'dispatch' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? 'কোম্পানি বুকিংস ও ডিসপ্যাচ' : 'Company Bookings & Dispatch'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {language === 'bn'
                        ? 'আগত বুকিংগুলোতে উপযুক্ত টেকনিশিয়ান নিয়োগ দিয়ে ফিল্ডে পাঠান।'
                        : 'Select and dispatch active technicians to confirmed customer requests.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {bookings.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        {language === 'bn' ? 'বর্তমানে কোনো বুকিং নেই' : 'No bookings found for this company'}
                      </div>
                    ) : (
                      bookings.map((b) => {
                        const canAssign = ['ACCEPTED', 'SCHEDULED', 'PROVIDER_ASSIGNED'].includes(b.status);
                        return (
                          <div
                            key={b._id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  #{b.bookingNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {b.status}
                                </span>
                              </div>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                ৳{(b.finalPrice || b.basePrice).toLocaleString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                              <div>
                                <span className="text-slate-400 block">{language === 'bn' ? 'গ্রাহক:' : 'Customer:'}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {(b.customer as any)?.name} ({(b.customer as any)?.phone})
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">{language === 'bn' ? 'ঠিকানা:' : 'Address:'}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {b.serviceAddress?.addressLine}, {b.serviceAddress?.area}
                                </span>
                              </div>
                            </div>

                            {/* Assigned Technician or Dispatch Selector */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                              {b.technician ? (
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-emerald-600" />
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {language === 'bn' ? 'বরাদ্দকৃত টেকনিশিয়ান:' : 'Assigned Technician:'}{' '}
                                    <strong className="text-slate-900 dark:text-white font-bold">
                                      {(b.technician as any)?.name}
                                    </strong>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {language === 'bn' ? 'এখনও কোনো টেকনিশিয়ান নিয়োগ দেওয়া হয়নি' : 'No technician assigned yet'}
                                </span>
                              )}

                              {canAssign && activeTechnicians.length > 0 && (
                                <div className="flex items-center gap-2 ml-auto">
                                  <select
                                    value={selectedTechs[b._id] || ''}
                                    onChange={(e) =>
                                      setSelectedTechs({
                                        ...selectedTechs,
                                        [b._id]: e.target.value,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                                  >
                                    <option value="">{language === 'bn' ? 'টেকনিশিয়ান বেছে নিন...' : 'Select Technician...'}</option>
                                    {activeTechnicians.map((t) => (
                                      <option key={t.user as any} value={(t.user as any)._id || t.user}>
                                        {(t.user as any)?.name || 'Technician'} ({t.assignedJobsCount || 0} jobs)
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleAssignTechnician(b._id)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-sm"
                                  >
                                    {language === 'bn' ? 'বরাদ্দ দিন' : 'Dispatch'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ANALYTICS & REVENUE */}
              {activeTab === 'analytics' && metrics && (
                <div className="space-y-6">
                  {/* Revenue Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100">
                      <span className="text-xs font-semibold block">{language === 'bn' ? 'মোট আদায়কৃত রাজস্ব' : 'Gross Revenue'}</span>
                      <span className="text-2xl font-black mt-1 block">৳{metrics.totalGrossRevenue.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">100% Cash-After-Service</span>
                    </div>

                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-100">
                      <span className="text-xs font-semibold block">{language === 'bn' ? 'কোম্পানির নীট আয় (৯০%)' : 'Net Company Share (90%)'}</span>
                      <span className="text-2xl font-black mt-1 block">৳{metrics.netRevenue.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">After platform commission</span>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100">
                      <span className="text-xs font-semibold block">{language === 'bn' ? 'প্ল্যাটফর্ম ফি প্রদেয় (১০%)' : 'Platform Fee Due (10%)'}</span>
                      <span className="text-2xl font-black mt-1 block">৳{metrics.platformCommissionDue.toLocaleString()}</span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Offline periodic settlement</span>
                    </div>
                  </div>

                  {/* Booking Counts */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[11px]">{language === 'bn' ? 'মোট বুকিং' : 'Total'}</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{metrics.totalBookings}</span>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-emerald-700 dark:text-emerald-300 block text-[11px]">{language === 'bn' ? 'সম্পন্ন' : 'Completed'}</span>
                      <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{metrics.completedBookings}</span>
                    </div>
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <span className="text-blue-700 dark:text-blue-300 block text-[11px]">{language === 'bn' ? 'চলমান' : 'Active'}</span>
                      <span className="text-lg font-bold text-blue-800 dark:text-blue-200">{metrics.activeBookings}</span>
                    </div>
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
                      <span className="text-rose-700 dark:text-rose-300 block text-[11px]">{language === 'bn' ? 'বাতিল' : 'Cancelled'}</span>
                      <span className="text-lg font-bold text-rose-800 dark:text-rose-200">{metrics.cancelledBookings}</span>
                    </div>
                  </div>

                  {/* Technician Leaderboard */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      {language === 'bn' ? 'টেকনিশিয়ান পারফরম্যান্স লিডারবোর্ড' : 'Technician Performance Leaderboard'}
                    </h5>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                      {metrics.technicianStats.map((t) => (
                        <div key={t.technicianId} className="p-3.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                              {t.name[0]}
                            </div>
                            <div>
                              <h6 className="font-bold text-slate-900 dark:text-white">{t.name}</h6>
                              <span className="text-[11px] text-slate-400">{t.phone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-right">
                            <div>
                              <span className="text-slate-400 block text-[10px]">{language === 'bn' ? 'সম্পন্ন কাজ' : 'Completed'}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{t.completedJobsCount} / {t.assignedJobsCount}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">{language === 'bn' ? 'গড় রেটিং' : 'Rating'}</span>
                              <span className="font-bold text-amber-500 flex items-center gap-0.5 justify-end">
                                ★{t.ratingAverage > 0 ? t.ratingAverage.toFixed(1) : '5.0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COMPANY PROFILE */}
              {activeTab === 'profile' && company && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Company Name'}:</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{company.name}</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block">{language === 'bn' ? 'যোগাযোগের ফোন' : 'Contact Phone'}:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{company.contactPhone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'bn' ? 'অপারেটিং ঠিকানা' : 'Address'}:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{company.address}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'সেবা কভারেজ এলাকা' : 'Service Areas'}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {company.serviceAreas.map((area) => (
                        <span key={area} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
