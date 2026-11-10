import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  AlertTriangle,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  fetchAdminOverview,
  fetchAdminUsers,
  updateAdminUserStatus,
  fetchAdminVerificationApplications,
  reviewAdminProviderVerification,
  reviewAdminCompanyApproval,
  fetchAdminDisputes,
  resolveAdminDispute,
  fetchAdminAuditLogs,
} from '../services/api.js';
import type {
  AdminOverviewData,
  AdminVerificationApplications,
  AdminDispute,
  AuditLogRecord,
  User,
  Language,
} from '../types/index.js';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

type AdminTab = 'overview' | 'users' | 'verification' | 'disputes' | 'financials' | 'audit';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  lang = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  const [verificationApps, setVerificationApps] = useState<AdminVerificationApplications>({
    providers: [],
    companies: [],
  });
  const [verificationType, setVerificationType] = useState<'providers' | 'companies'>('providers');

  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // Action states
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  const isBn = lang === 'bn';

  useEffect(() => {
    if (!isOpen) return;
    loadTabData(activeTab);
  }, [isOpen, activeTab]);

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (tab === 'overview' || tab === 'financials') {
        const data = await fetchAdminOverview();
        setOverview(data);
      } else if (tab === 'users') {
        const data = await fetchAdminUsers({
          search: userSearch || undefined,
          role: userRoleFilter || undefined,
          status: userStatusFilter || undefined,
        });
        setUsers(data.users);
        setUsersTotal(data.total);
      } else if (tab === 'verification') {
        const data = await fetchAdminVerificationApplications();
        setVerificationApps(data);
      } else if (tab === 'disputes') {
        const data = await fetchAdminDisputes();
        setDisputes(data);
      } else if (tab === 'audit') {
        const data = await fetchAdminAuditLogs();
        setAuditLogs(data.logs);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTabData('users');
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const reason = actionReason.trim() || `Administrative ${nextStatus.toLowerCase()} via dashboard`;
    try {
      setLoading(true);
      await updateAdminUserStatus(user.id, nextStatus, reason);
      setActionReason('');
      await loadTabData('users');
      setSuccessMessage(
        isBn
          ? `ব্যবহারকারী ${user.name}-এর স্ট্যাটাস ${nextStatus} করা হয়েছে`
          : `User ${user.name} status updated to ${nextStatus}`
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user status');
      setLoading(false);
    }
  };

  const handleProviderVerification = async (
    profileId: string,
    status: 'VERIFIED' | 'REJECTED'
  ) => {
    try {
      setLoading(true);
      await reviewAdminProviderVerification(profileId, {
        status,
        notes: actionNotes.trim() || undefined,
        rejectionReason: status === 'REJECTED' ? actionNotes.trim() || 'Requirements not met' : undefined,
      });
      setActionNotes('');
      await loadTabData('verification');
      setSuccessMessage(
        isBn
          ? `প্রোভাইডারের আবেদন ${status === 'VERIFIED' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে`
          : `Provider application ${status.toLowerCase()} successfully`
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to review provider');
      setLoading(false);
    }
  };

  const handleCompanyApproval = async (
    orgId: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setLoading(true);
      await reviewAdminCompanyApproval(orgId, {
        status,
        notes: actionNotes.trim() || undefined,
      });
      setActionNotes('');
      await loadTabData('verification');
      setSuccessMessage(
        isBn
          ? `কোম্পানির আবেদন ${status === 'APPROVED' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে`
          : `Company application ${status.toLowerCase()} successfully`
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to review company');
      setLoading(false);
    }
  };

  const handleDisputeResolution = async (
    bookingId: string,
    resolution: 'RESOLVE_AS_COMPLETED' | 'RESOLVE_AS_CANCELLED'
  ) => {
    const notes = actionNotes.trim() || 'Dispute resolved after administrative review';
    try {
      setLoading(true);
      await resolveAdminDispute(bookingId, {
        resolution,
        notes,
        refundOrWaiveFee: true,
      });
      setActionNotes('');
      await loadTabData('disputes');
      setSuccessMessage(
        isBn
          ? `বিরোধ সফলভাবে নিষ্পত্তি করা হয়েছে (${resolution === 'RESOLVE_AS_COMPLETED' ? 'সম্পন্ন' : 'বাতিল'})`
          : `Dispute successfully resolved as ${resolution === 'RESOLVE_AS_COMPLETED' ? 'COMPLETED' : 'CANCELLED'}`
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resolve dispute');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isBn ? 'সেবাকানেক্ট অ্যাডমিন ও মার্কেটপ্লেস নিয়ন্ত্রণ' : 'ShebaConnect Admin & Marketplace Governance'}
              </h2>
              <p className="text-xs text-emerald-100">
                {isBn
                  ? 'ঢাকা জোন কার্যক্রম, শূন্য-খরচ আর্থিক লেজার এবং পরিচালনা প্ল্যাটফর্ম'
                  : 'Dhaka Operations, Strict Zero-Cost Ledger & Governance Platform'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isBn ? 'সংক্ষিপ্ত বিবরণ ও কেপিআই' : 'Overview & KPIs'}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isBn ? 'ব্যবহারকারী পরিচালনা' : 'User Governance'}</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isBn ? 'ভেরিফিকেশন কিউ' : 'Verification Queue'}</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'disputes'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isBn ? 'বিরোধ নিষ্পত্তি' : 'Dispute Resolution'}</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'financials'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isBn ? 'আর্থিক হিসাব ও কমিশন' : 'Financials & Ledger'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'অডিট ট্রেইল' : 'Platform Audit Trail'}</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 font-bold ml-2">×</button>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold ml-2">×</button>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {!loading && activeTab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Users & Providers KPIs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {isBn ? 'মার্কেটপ্লেস ব্যবহারকারী ও প্রতিষ্ঠান' : 'Users & Providers'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'মোট ব্যবহারকারী' : 'Total Users'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{overview.users.total}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {overview.users.customers} {isBn ? 'গ্রাহক' : 'Customers'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'ব্যক্তিগত প্রোভাইডার' : 'Individual Providers'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{overview.users.individualProviders}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {overview.users.verifiedProviders} {isBn ? 'ভেরিফাইড' : 'Verified'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'নিবন্ধিত কোম্পানি' : 'Registered Companies'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{overview.users.registeredCompanies}</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {overview.users.pendingCompanyApprovals} {isBn ? 'অনুমোদনের অপেক্ষায়' : 'Pending Approval'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'অপেক্ষমান আবেদন' : 'Pending Verifications'}</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {overview.users.pendingProviderVerifications + overview.users.pendingCompanyApprovals}
                    </p>
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="text-xs text-amber-700 underline font-medium mt-1 inline-block"
                    >
                      {isBn ? 'এখনই যাচাই করুন →' : 'Review Queue →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings & Operations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {isBn ? 'বুকিং কার্যক্রম ও বিরোধ' : 'Bookings & Disputes'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'মোট বুকিং' : 'Total Bookings'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{overview.bookings.total}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {overview.bookings.activeInProgress} {isBn ? 'চলমান' : 'In Progress'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'সম্পন্ন বুকিং' : 'Completed Bookings'}</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{overview.bookings.completed}</p>
                    <p className="text-xs text-gray-400 mt-1">100% Cash-after-service</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'বাতিল বুকিং' : 'Cancelled Bookings'}</p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">{overview.bookings.cancelled}</p>
                    <p className="text-xs text-gray-400 mt-1">Within policy limits</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-red-50/20">
                    <p className="text-xs text-red-600 font-semibold">{isBn ? 'উন্মুক্ত বিরোধ' : 'Open Disputes'}</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{overview.bookings.disputed}</p>
                    <button
                      onClick={() => setActiveTab('disputes')}
                      className="text-xs text-red-700 underline font-medium mt-1 inline-block"
                    >
                      {isBn ? 'বিরোধ নিষ্পত্তি করুন →' : 'Resolve Disputes →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Zero-Cost Cash Financial Ledger */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {isBn ? 'আর্থিক লেজার (১০% প্ল্যাটফর্ম ফি)' : 'Financial Ledger (10% Platform Fee)'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'মোট ক্যাশ ভলিউম' : 'Total Cash GMV'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ৳{overview.financials.totalGrossVolumeBDT.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Cash Handover</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'প্ল্যাটফর্ম কমিশন অর্জিত (১০%)' : 'Commission Earned (10%)'}</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      ৳{overview.financials.totalCommissionEarnedBDT.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">৳0 Operating Cost</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'বকেয়া কমিশন' : 'Commission Due'}</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      ৳{overview.financials.totalCommissionPendingBDT.toLocaleString()}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Awaiting settlement</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500">{isBn ? 'পরিশোধিত কমিশন' : 'Commission Settled'}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ৳{overview.financials.totalCommissionSettledBDT.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {overview.financials.settlementsCount} {isBn ? 'সেটেলমেন্ট' : 'Settlements'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER GOVERNANCE */}
          {!loading && activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <form onSubmit={handleUserSearch} className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={isBn ? 'নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by name, email, or phone...'}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{isBn ? 'সকল রোল' : 'All Roles'}</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INDIVIDUAL_PROVIDER">Individual Provider</option>
                  <option value="COMPANY_OWNER">Company Owner</option>
                  <option value="COMPANY_STAFF">Company Staff</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="PENDING">PENDING</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                >
                  <Filter className="w-4 h-4" />
                  <span>{isBn ? 'ফিল্টার' : 'Filter'}</span>
                </button>
              </form>

              {/* Users Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs font-semibold text-gray-500">
                    {isBn ? `মোট ব্যবহারকারী: ${usersTotal}` : `Total Users: ${usersTotal}`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">{isBn ? 'ব্যবহারকারী' : 'User'}</th>
                        <th className="py-3 px-4">{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                        <th className="py-3 px-4">{isBn ? 'রোল' : 'Role'}</th>
                        <th className="py-3 px-4">{isBn ? 'ভেরিফিকেশন' : 'Verified'}</th>
                        <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                        <th className="py-3 px-4 text-right">{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            {isBn ? 'কোন ব্যবহারকারী পাওয়া যায়নি' : 'No users found matching query'}
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{u.name}</div>
                              <div className="text-xs text-gray-400">{u.id}</div>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600">
                              <div>{u.phone}</div>
                              <div className="text-gray-400">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {u.isVerified ? (
                                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  {isBn ? 'যাচাইকৃত' : 'Verified'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-gray-400">
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  {isBn ? 'অযাচাইকৃত' : 'Unverified'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : u.status === 'SUSPENDED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {u.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handleStatusToggle(u)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    u.status === 'SUSPENDED'
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                >
                                  {u.status === 'SUSPENDED' ? (
                                    <span className="flex items-center space-x-1">
                                      <Unlock className="w-3 h-3" />
                                      <span>{isBn ? 'সক্রিয় করুন' : 'Reactivate'}</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <Lock className="w-3 h-3" />
                                      <span>{isBn ? 'স্থগিত করুন' : 'Suspend'}</span>
                                    </span>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION QUEUE */}
          {!loading && activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="flex space-x-2 border-b border-gray-200 pb-3">
                <button
                  onClick={() => setVerificationType('providers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    verificationType === 'providers'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isBn
                    ? `ব্যক্তিগত প্রোভাইডার (${verificationApps.providers.length})`
                    : `Individual Providers (${verificationApps.providers.length})`}
                </button>
                <button
                  onClick={() => setVerificationType('companies')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    verificationType === 'companies'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isBn
                    ? `কোম্পানি ও ট্রেড লাইসেন্স (${verificationApps.companies.length})`
                    : `Companies & Trade Licenses (${verificationApps.companies.length})`}
                </button>
              </div>

              {/* Provider Queue */}
              {verificationType === 'providers' && (
                <div className="space-y-3">
                  {verificationApps.providers.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                      {isBn ? 'কোন অপেক্ষমান প্রোভাইডার আবেদন নেই' : 'No pending provider applications'}
                    </div>
                  ) : (
                    verificationApps.providers.map((p) => (
                      <div key={p._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">{p.user?.name || 'Provider'}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-semibold">
                              {p.verificationStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Phone: {p.user?.phone} | Email: {p.user?.email}
                          </p>
                          <p className="text-xs text-gray-700 mt-2">
                            <span className="font-semibold">NID Number:</span> {p.nidNumber || 'Not provided'}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Skills:</span> {p.skills?.join(', ') || 'N/A'} ({p.experienceYears} yrs experience)
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProviderVerification(p._id, 'VERIFIED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{isBn ? 'অনুমোদন দিন' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => handleProviderVerification(p._id, 'REJECTED')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isBn ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Company Queue */}
              {verificationType === 'companies' && (
                <div className="space-y-3">
                  {verificationApps.companies.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                      {isBn ? 'কোন অপেক্ষমান কোম্পানি আবেদন নেই' : 'No pending company applications'}
                    </div>
                  ) : (
                    verificationApps.companies.map((c) => (
                      <div key={c._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-gray-900">{c.name}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-semibold">
                              {c.approvalStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Owner: {c.owner?.name} ({c.owner?.phone})
                          </p>
                          <p className="text-xs text-gray-700 mt-2">
                            <span className="font-semibold">Trade License:</span> {c.tradeLicense}
                          </p>
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Address:</span> {c.address}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Zones: {c.serviceAreas?.join(', ')}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCompanyApproval(c._id, 'APPROVED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{isBn ? 'অনুমোদন দিন' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => handleCompanyApproval(c._id, 'REJECTED')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isBn ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DISPUTE RESOLUTION */}
          {!loading && activeTab === 'disputes' && (
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">
                    {isBn ? 'বর্তমানে কোন উন্মুক্ত বিরোধ নেই' : 'No Open Customer Disputes'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {isBn
                      ? 'সকল সেবা কার্যক্রম ও ক্যাশ পেমেন্ট সন্তোষজনকভাবে সম্পন্ন হয়েছে।'
                      : 'All service deliveries and cash transactions are proceeding normally.'}
                  </p>
                </div>
              ) : (
                disputes.map(({ booking, payment }) => (
                  <div key={booking.id} className="bg-white p-5 rounded-xl border border-red-200 shadow-sm space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-bold text-gray-900">
                            #{booking.bookingNumber} — {booking.service?.name?.en || 'Service'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-semibold">
                            DISPUTED
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Zone: {booking.serviceAddress?.area} | Scheduled: {new Date(booking.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ৳{booking.finalPrice || booking.basePrice} BDT
                        </span>
                        <p className="text-xs text-gray-400">Cash Payment</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-gray-700">{isBn ? 'গ্রাহক তথ্য:' : 'Customer:'}</span>
                        <p className="text-gray-900 font-medium mt-1">{booking.customer?.name}</p>
                        <p className="text-gray-500">{booking.customer?.phone}</p>
                        <p className="text-gray-700 mt-2 font-semibold">{isBn ? 'সমস্যার বিবরণ:' : 'Problem Description:'}</p>
                        <p className="text-gray-600 italic">"{booking.problemDescription}"</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-gray-700">{isBn ? 'প্রোভাইডার / টেকনিশিয়ান:' : 'Provider / Technician:'}</span>
                        <p className="text-gray-900 font-medium mt-1">
                          {booking.provider?.name || booking.technician?.name || 'Unassigned'}
                        </p>
                        <p className="text-gray-500">{booking.provider?.phone || booking.technician?.phone}</p>
                        <p className="text-gray-700 mt-2 font-semibold">{isBn ? 'ক্যাশ পেমেন্ট স্ট্যাটাস:' : 'Cash Status:'}</p>
                        <p className="text-gray-600">
                          Amount: ৳{(payment as any)?.amountCollected || 0} (Status: {(payment as any)?.status || 'PENDING'})
                        </p>
                      </div>
                    </div>

                    {/* Resolution Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={() => handleDisputeResolution((booking._id || booking.id || '') as string, 'RESOLVE_AS_COMPLETED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সম্পন্ন হিসেবে নিষ্পত্তি (Confirm Delivery)' : 'Resolve as Completed'}</span>
                      </button>
                      <button
                        onClick={() => handleDisputeResolution((booking._id || booking.id || '') as string, 'RESOLVE_AS_CANCELLED')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল ও ফি মওকুফ (Cancel & Waive Fee)' : 'Cancel & Waive Fee'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: FINANCIALS & SETTLEMENTS */}
          {!loading && activeTab === 'financials' && overview && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg">
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                  {isBn ? 'ক্যাশ-অন-ডেলিভারি রাজস্ব মডেল' : 'Cash-After-Service 10% Platform Revenue Model'}
                </span>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-emerald-200">{isBn ? 'গ্রস ক্যাশ ভলিউম' : 'Gross Cash GMV'}</p>
                    <p className="text-3xl font-extrabold mt-1">৳{overview.financials.totalGrossVolumeBDT.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200">{isBn ? '১০% প্ল্যাটফর্ম ফি' : '10% Platform Commission'}</p>
                    <p className="text-3xl font-extrabold mt-1">৳{overview.financials.totalCommissionEarnedBDT.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200">{isBn ? 'বকেয়া কমিশন' : 'Commission Due'}</p>
                    <p className="text-3xl font-extrabold mt-1 text-amber-300">৳{overview.financials.totalCommissionPendingBDT.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-200">{isBn ? 'পরিশোধিত কমিশন' : 'Settled Commission'}</p>
                    <p className="text-3xl font-extrabold mt-1 text-blue-200">৳{overview.financials.totalCommissionSettledBDT.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {isBn ? 'ম্যানুয়াল কমিশন সেটেলমেন্ট নির্দেশিকা' : 'Offline Commission Settlement Protocol'}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isBn
                    ? 'সেবাকানেক্ট একটি সম্পূর্ণ শূন্য-খরচ প্ল্যাটফর্ম। কোন বাণিজ্যিক পেমেন্ট গেটওয়ে নেই। প্রোভাইডার এবং কোম্পানিগুলো গ্রাহকের কাছ থেকে নগদ ক্যাশ গ্রহণের পর তাদের অর্জিত আয়ের ১০% কমিশন অফিসে বা প্রতিনিধির কাছে ম্যানুয়ালি জমা দেয়। অ্যাডমিন সেই রেকর্ড সংরক্ষণ করে বকেয়া কমিশন পরিশোধিত হিসেবে চিহ্নিত করতে পারেন।'
                    : 'ShebaConnect operates on a strict zero-cost budget without paid commercial payment gateways. Individual providers and companies collect cash directly from customers, and their 10% platform commission is settled manually in cash or offline direct transfer. Administrators record settlements to verify platform revenue.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {!loading && activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs font-semibold text-gray-500">
                    {isBn ? 'প্ল্যাটফর্ম অডিট লগ ও গভর্ন্যান্স ট্রেইল' : 'Platform Audit Trail & Admin Operations'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                        <th className="py-3 px-4">{isBn ? 'অ্যাডমিন / এক্টর' : 'Actor'}</th>
                        <th className="py-3 px-4">{isBn ? 'পদক্ষেপ' : 'Action'}</th>
                        <th className="py-3 px-4">{isBn ? 'টার্গেট' : 'Target'}</th>
                        <th className="py-3 px-4">{isBn ? 'বিবরণ' : 'Details'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-xs">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400 font-sans">
                            {isBn ? 'কোন অডিট লগ পাওয়া যায়নি' : 'No audit records logged yet'}
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              <span className="font-semibold">{log.actor?.name || 'Admin'}</span>{' '}
                              <span className="text-[10px] text-gray-400">({log.actorRole})</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {log.targetType}: {log.targetId.slice(0, 10)}...
                            </td>
                            <td className="py-3 px-4 text-gray-500 truncate max-w-xs">
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isBn ? 'অ্যাডমিন কনসোল অনলাইন' : 'Governance Node Online'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
