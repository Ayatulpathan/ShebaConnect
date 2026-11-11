import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { X, User, Mail, Phone, ShieldCheck, MapPin, LogOut } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();

  if (!isOpen || !user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: language === 'bn' ? 'অ্যাডমিন' : 'Platform Admin', color: 'bg-red-100 text-red-800' };
      case 'INDIVIDUAL_PROVIDER':
        return { label: language === 'bn' ? 'টেকনিশিয়ান' : 'Technician', color: 'bg-emerald-100 text-emerald-800' };
      case 'COMPANY_OWNER':
        return { label: language === 'bn' ? 'কোম্পানি স্বত্বাধিকারী' : 'Company Owner', color: 'bg-purple-100 text-purple-800' };
      case 'COMPANY_STAFF':
        return { label: language === 'bn' ? 'কোম্পানি স্টাফ' : 'Company Staff', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: language === 'bn' ? 'গ্রাহক' : 'Customer', color: 'bg-brand-100 text-brand-800' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-gray-900">
              {language === 'bn' ? 'আমার প্রোফাইল' : 'My Account Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-gray-900 leading-tight">{user.name}</h4>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{language === 'bn' ? 'ইমেইল' : 'Email Address'}</span>
              </span>
              <span className="font-semibold text-gray-800">{user.email || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</span>
              </span>
              <span className="font-semibold text-gray-800">{user.phone || '—'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="flex items-center gap-2 text-gray-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'স্ট্যাটাস' : 'Account Status'}</span>
              </span>
              <span className="font-semibold text-emerald-700 uppercase">{user.status || 'ACTIVE'}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{language === 'bn' ? 'সেবা এলাকা' : 'Service Zone'}</span>
              </span>
              <span className="font-semibold text-gray-800">
                {language === 'bn' ? 'ঢাকা মেট্রো' : 'Dhaka Metro'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগআউট করুন' : 'Log Out'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
            >
              {language === 'bn' ? 'ঠিক আছে' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
