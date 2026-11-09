import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import {
  fetchMyProviderProfile,
  updateMyProviderProfile,
  submitProviderVerification,
  fetchMyAvailability,
  updateMyAvailability,
} from '../services/api.js';
import type { ProviderProfile, AvailabilitySlot } from '../types/index.js';
import {
  X,
  UserCheck,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, en: 'Sunday', bn: 'রবিবার' },
  { id: 1, en: 'Monday', bn: 'সোমবার' },
  { id: 2, en: 'Tuesday', bn: 'মঙ্গলবার' },
  { id: 3, en: 'Wednesday', bn: 'বুধবার' },
  { id: 4, en: 'Thursday', bn: 'বৃহস্পতিবার' },
  { id: 5, en: 'Friday', bn: 'শুক্রবার' },
  { id: 6, en: 'Saturday', bn: 'শনিবার' },
];

export const ProviderOperationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'availability'>('profile');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Form State
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [emergencyContact, setEmergencyContact] = useState('');

  // Verification Form State
  const [nidNumber, setNidNumber] = useState('');

  // Availability State
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    DAYS_OF_WEEK.map((d) => ({
      dayOfWeek: d.id,
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: d.id !== 5, // Friday default off in BD
    }))
  );

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [prof, avail] = await Promise.allSettled([
          fetchMyProviderProfile(),
          fetchMyAvailability(),
        ]);

        if (isMounted && prof.status === 'fulfilled' && prof.value) {
          setProfile(prof.value);
          setBio(prof.value.bio || '');
          setSkillsInput(prof.value.skills ? prof.value.skills.join(', ') : '');
          setExperienceYears(prof.value.experienceYears || 1);
          setEmergencyContact(prof.value.emergencyContact || '');
          if (prof.value.nidNumber) {
            setNidNumber(prof.value.nidNumber);
          }
        }

        if (isMounted && avail.status === 'fulfilled' && avail.value.length > 0) {
          // Merge with default 7 days
          const merged = DAYS_OF_WEEK.map((d) => {
            const found = avail.value.find((s) => s.dayOfWeek === d.id);
            return (
              found || {
                dayOfWeek: d.id,
                startTime: '09:00',
                endTime: '18:00',
                isAvailable: d.id !== 5,
              }
            );
          });
          setSlots(merged);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.response?.data?.message || err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateMyProviderProfile({
        bio,
        skills: skillsArray,
        experienceYears,
        emergencyContact,
      });

      setProfile(updated);
      setSuccessMsg(
        language === 'bn'
          ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে'
          : 'Profile updated successfully'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitNID = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await submitProviderVerification({
        nidNumber: nidNumber.trim(),
        nidFrontUrl: 'mock://local-docs/nid-front.jpg',
        nidBackUrl: 'mock://local-docs/nid-back.jpg',
      });
      setProfile(updated);
      setSuccessMsg(
        language === 'bn'
          ? 'জাতীয় পরিচয়পত্র যাচাইকরণের জন্য জমা দেওয়া হয়েছে'
          : 'NID submitted for verification'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updatedSlots = await updateMyAvailability(slots);
      setSlots(updatedSlots);
      setSuccessMsg(
        language === 'bn'
          ? 'কাজের সময়সূচী সফলভাবে সংরক্ষিত হয়েছে'
          : 'Availability schedule saved successfully'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime' | 'isAvailable',
    val: any
  ) => {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: val } : s))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {language === 'bn' ? 'টেকনিশিয়ান হাব ও পরিচালনা' : 'Technician Hub & Operations'}
              </h2>
              <p className="text-xs text-gray-500">
                {language === 'bn'
                  ? 'আপনার প্রোফাইল, এনআইডি যাচাইকরণ এবং কাজের শিডিউল পরিচালনা করুন'
                  : 'Manage profile, NID verification and weekly schedule'}
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
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            {language === 'bn' ? 'বায়ো ও দক্ষতা' : 'Bio & Skills'}
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {language === 'bn' ? 'এনআইডি ভেরিফিকেশন' : 'NID Verification'}
            {profile?.verificationStatus === 'VERIFIED' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'availability'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {language === 'bn' ? 'কাজের সময়সূচী' : 'Availability'}
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
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
              <p className="text-sm">
                {language === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading details...'}
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === 'bn' ? 'আপনার বায়ো / পরিচিতি' : 'Professional Bio'}
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={
                        language === 'bn'
                          ? 'আপনার কাজের অভিজ্ঞতা ও দক্ষতার সংক্ষিপ্ত বিবরণ লিখুন...'
                          : 'Describe your expertise and work history...'
                      }
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {language === 'bn'
                        ? 'দক্ষতাসমূহ (কমা দ্বারা আলাদা করুন)'
                        : 'Skills (comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="AC Repair, Wiring, Compressor Replacement"
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {language === 'bn' ? 'কাজের অভিজ্ঞতা (বছর)' : 'Experience (Years)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {language === 'bn' ? 'জরুরী যোগাযোগ নম্বর' : 'Emergency Contact'}
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="01712345678"
                        className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Verification */}
              {activeTab === 'verification' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">
                        {language === 'bn' ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}
                      </span>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {profile?.verificationStatus === 'VERIFIED' && (
                          <span className="text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            {language === 'bn' ? 'যাচাইকৃত (Verified)' : 'Verified'}
                          </span>
                        )}
                        {profile?.verificationStatus === 'PENDING_REVIEW' && (
                          <span className="text-amber-600 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {language === 'bn' ? 'পর্যালোচনার অধীনে (Pending)' : 'Pending Review'}
                          </span>
                        )}
                        {profile?.verificationStatus === 'REJECTED' && (
                          <span className="text-red-600 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {language === 'bn' ? 'বাতিল করা হয়েছে' : 'Rejected'}
                          </span>
                        )}
                        {(!profile || profile.verificationStatus === 'UNVERIFIED') && (
                          <span className="text-gray-600">
                            {language === 'bn' ? 'অযাচাইকৃত (Unverified)' : 'Unverified'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full font-medium text-gray-600">
                      {profile?.verificationStatus || 'UNVERIFIED'}
                    </span>
                  </div>

                  {profile?.verificationStatus === 'VERIFIED' ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800">
                      <p className="font-semibold mb-1">
                        {language === 'bn'
                          ? 'আপনার জাতীয় পরিচয়পত্র সফলভাবে যাচাইকৃত!'
                          : 'Your NID has been successfully verified!'}
                      </p>
                      <p>
                        {language === 'bn'
                          ? 'আপনি এখন প্ল্যাটফর্মে সরাসরি বুকিং ও কাজের সুযোগ গ্রহণ করতে পারবেন।'
                          : 'You can now receive direct booking requests and jobs.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitNID} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {language === 'bn'
                            ? 'জাতীয় পরিচয়পত্র (NID) নম্বর'
                            : 'National ID (NID) Number'}
                        </label>
                        <input
                          type="text"
                          required
                          value={nidNumber}
                          onChange={(e) => setNidNumber(e.target.value)}
                          placeholder="10, 13, or 17 digit NID number"
                          className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          {language === 'bn'
                            ? 'স্মার্ট কার্ড (১০ ডিজিট), পুরাতন এনআইডি (১৩ অথবা ১৭ ডিজিট)'
                            : 'Smart Card (10 digits), or Old NID (13 or 17 digits)'}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700">
                        <p className="font-semibold mb-0.5">
                          {language === 'bn'
                            ? 'শূন্য-খরচ ডকুমেন্ট প্রোটোকল'
                            : 'Zero-Cost Document Protocol'}
                        </p>
                        <p>
                          {language === 'bn'
                            ? 'শূন্য-খরচ নীতির অধীনে ক্লাউড স্টোরেজের জন্য কোনো পেইড চার্জ বা ক্রেডিট কার্ডের অনুমতি নেই। আপনার এনআইডি তথ্য স্থানীয় নিরাপদ মেটাডাটা অ্যাডাপ্টারে সংরক্ষিত হবে।'
                            : 'In accordance with our zero-cost budget constraint, external cloud storage billing is prohibited. Document references are stored safely via local zero-cost metadata.'}
                        </p>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          <span>
                            {language === 'bn'
                              ? 'যাচাইকরণের জন্য জমা দিন'
                              : 'Submit for Verification'}
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 3: Availability */}
              {activeTab === 'availability' && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-500">
                    {language === 'bn'
                      ? 'প্রতিটি বারের কাজের শুরুর সময় ও শেষ সময় নির্ধারণ করুন। শুক্রবার সাপ্তাহিক ছুটি রাখা যাবে।'
                      : 'Define your working hours for each day of the week. Friday can be marked as holiday.'}
                  </div>

                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const slot = slots.find((s) => s.dayOfWeek === day.id) || {
                        dayOfWeek: day.id,
                        startTime: '09:00',
                        endTime: '18:00',
                        isAvailable: false,
                      };

                      return (
                        <div
                          key={day.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-colors ${
                            slot.isAvailable
                              ? 'bg-white border-gray-200'
                              : 'bg-gray-50/70 border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="w-28 font-bold text-gray-800">
                            {language === 'bn' ? day.bn : day.en}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              disabled={!slot.isAvailable}
                              value={slot.startTime}
                              onChange={(e) =>
                                updateSlot(day.id, 'startTime', e.target.value)
                              }
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              disabled={!slot.isAvailable}
                              value={slot.endTime}
                              onChange={(e) =>
                                updateSlot(day.id, 'endTime', e.target.value)
                              }
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
                            />
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                updateSlot(day.id, 'isAvailable', !slot.isAvailable)
                              }
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                slot.isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {slot.isAvailable
                                ? language === 'bn'
                                  ? 'খোলা'
                                  : 'Available'
                                : language === 'bn'
                                ? 'ছুটি'
                                : 'Off'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAvailability}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {language === 'bn'
                          ? 'সময়সূচী সংরক্ষণ করুন'
                          : 'Save Availability'}
                      </span>
                    </button>
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
