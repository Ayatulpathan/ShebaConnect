import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import {
  fetchMyCompany,
  createCompany,
  updateMyCompany,
  fetchCompanyMembers,
  addCompanyMember,
  removeCompanyMember,
} from '../services/api.js';
import type { Organization, OrganizationMember } from '../types/index.js';
import { DHAKA_AREAS } from '../constants/areas.js';
import {
  X,
  Building2,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyOperationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Company State
  const [company, setCompany] = useState<Organization | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Members State
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'TECHNICIAN' | 'COMPANY_STAFF'>(
    'TECHNICIAN'
  );

  const loadCompanyData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const org = await fetchMyCompany();
      if (org) {
        setCompany(org);
        setBusinessName(org.businessName);
        setTradeLicenseNumber(org.tradeLicenseNumber || '');
        setContactPhone(org.contactPhone);
        setContactEmail(org.contactEmail || '');
        setSelectedAreas(org.serviceAreas || []);

        // Load members
        const mems = await fetchCompanyMembers(org._id);
        setMembers(mems);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCompanyData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAreas.length === 0) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে অন্তত একটি ঢাকা সার্ভিস এলাকা নির্বাচন করুন'
          : 'Please select at least one Dhaka service area'
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!company) {
        // Create new company
        const created = await createCompany({
          businessName,
          tradeLicenseNumber: tradeLicenseNumber || undefined,
          contactPhone,
          contactEmail: contactEmail || undefined,
          serviceAreas: selectedAreas,
        });
        setCompany(created);
        setSuccessMsg(
          language === 'bn'
            ? 'কোম্পানি সফলভাবে নিবন্ধিত হয়েছে'
            : 'Company registered successfully'
        );
      } else {
        // Update existing company
        const updated = await updateMyCompany(company._id, {
          businessName,
          tradeLicenseNumber: tradeLicenseNumber || undefined,
          contactPhone,
          contactEmail: contactEmail || undefined,
          serviceAreas: selectedAreas,
        });
        setCompany(updated);
        setSuccessMsg(
          language === 'bn'
            ? 'কোম্পানির তথ্য সফলভাবে সংরক্ষিত হয়েছে'
            : 'Company details updated successfully'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!newMemberUserId.trim()) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const added = await addCompanyMember(company._id, {
        userId: newMemberUserId.trim(),
        role: newMemberRole,
      });
      setMembers((prev) => [...prev, added]);
      setNewMemberUserId('');
      setSuccessMsg(
        language === 'bn'
          ? 'নতুন সদস্য যুক্ত করা হয়েছে'
          : 'Member added successfully'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!company) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await removeCompanyMember(company._id, memberId);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setSuccessMsg(
        language === 'bn'
          ? 'সদস্য অপসারিত হয়েছে'
          : 'Member removed successfully'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {language === 'bn' ? 'কোম্পানি ম্যানেজমেন্ট' : 'Company Management'}
              </h2>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'আপনার প্রতিষ্ঠান, ট্রেড লাইসেন্স ও টেকনিশিয়ান টিম পরিচালনা করুন'
                  : 'Manage company profile, service areas, and technician roster'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {language === 'bn' ? 'প্রতিষ্ঠানের তথ্য' : 'Company Details'}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            disabled={!company}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 disabled:opacity-40 ${
              activeTab === 'members'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            {language === 'bn' ? 'টেকনিশিয়ান ও কর্মী' : 'Technicians & Staff'}
            {members.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded-full font-bold">
                {members.length}
              </span>
            )}
          </button>
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

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
              <p className="text-sm">
                {language === 'bn' ? 'কোম্পানি তথ্য লোড হচ্ছে...' : 'Loading company data...'}
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: Details */}
              {activeTab === 'details' && (
                <form onSubmit={handleSaveCompany} className="space-y-4">
                  {company && (
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        {language === 'bn' ? 'যাচাইকরণ স্ট্যাটাস:' : 'Verification Status:'}
                      </span>
                      <span className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full font-semibold text-gray-700">
                        {company.verificationStatus}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Business / Company Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Dhaka Pro Servicing Co."
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {language === 'bn'
                          ? 'ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)'
                          : 'Trade License Number (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={tradeLicenseNumber}
                        onChange={(e) => setTradeLicenseNumber(e.target.value)}
                        placeholder="TRAD/DNCC/12345/2026"
                        className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {language === 'bn' ? 'যোগাযোগের ফোন নম্বর' : 'Contact Phone'}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="01712345678"
                        className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Contact Email (Optional)'}
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@dhakaservicing.com"
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Dhaka Service Areas */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === 'bn'
                        ? 'সার্ভিস এরিয়া নির্বাচন করুন (ঢাকা)'
                        : 'Select Dhaka Service Areas'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {DHAKA_AREAS.map((area) => {
                        const isSelected = selectedAreas.includes(area.id);
                        return (
                          <button
                            type="button"
                            key={area.id}
                            onClick={() => toggleArea(area.id)}
                            className={`p-2.5 rounded-xl border text-xs text-left font-medium transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{language === 'bn' ? area.bn : area.en}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {company
                          ? language === 'bn'
                            ? 'তথ্য আপডেট করুন'
                            : 'Update Details'
                          : language === 'bn'
                          ? 'কোম্পানি নিবন্ধন করুন'
                          : 'Register Company'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Members */}
              {activeTab === 'members' && (
                <div className="space-y-5">
                  {/* Add Member Form */}
                  <form
                    onSubmit={handleAddMember}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3"
                  >
                    <h3 className="text-xs font-bold text-gray-800">
                      {language === 'bn'
                        ? 'নতুন টেকনিশিয়ান বা স্টাফ যুক্ত করুন'
                        : 'Add New Technician or Staff'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          value={newMemberUserId}
                          onChange={(e) => setNewMemberUserId(e.target.value)}
                          placeholder="User Mongo ID (24-char hex)"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <select
                          value={newMemberRole}
                          onChange={(e) =>
                            setNewMemberRole(e.target.value as 'TECHNICIAN' | 'COMPANY_STAFF')
                          }
                          className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="TECHNICIAN">
                            {language === 'bn' ? 'টেকনিশিয়ান' : 'Technician'}
                          </option>
                          <option value="COMPANY_STAFF">
                            {language === 'bn' ? 'কোম্পানি স্টাফ' : 'Staff'}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'যুক্ত করুন' : 'Add Member'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Members List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700">
                      {language === 'bn' ? 'বর্তমান টিম সদস্য' : 'Current Team Members'} (
                      {members.length})
                    </h4>
                    {members.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">
                        {language === 'bn'
                          ? 'কোনো সদস্য এখনো যুক্ত করা হয়নি'
                          : 'No team members added yet'}
                      </p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white text-xs"
                        >
                          <div>
                            <p className="font-bold text-gray-900">
                              {member.user?.name || 'User'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {member.user?.email || member.user?.phone}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                              {member.role}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member._id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
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
