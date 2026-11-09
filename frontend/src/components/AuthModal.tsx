import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import type { UserRole } from '../types/index.js';
import { X, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const { language } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(identifier, password);
      } else {
        await register({
          name,
          email,
          phone,
          password,
          role,
          preferredLanguage: language,
        });
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMessage(
        error.response?.data?.error?.message ||
          (language === 'bn' ? 'অনুরোধটি সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Failed to complete request. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {mode === 'login'
              ? language === 'bn'
                ? 'লগইন করুন'
                : 'Welcome Back'
              : language === 'bn'
                ? 'নতুন একাউন্ট তৈরি করুন'
                : 'Create Account'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'bn'
              ? 'সেবাকানেক্টে আপনার প্রয়োজনীয় সকল সেবা নিরাপদ রাখুন'
              : 'Access reliable home services across Dhaka'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {language === 'bn' ? 'একাউন্টের ধরন নির্বাচন করুন' : 'Select Account Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-colors ${
                      role === 'CUSTOMER'
                        ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {language === 'bn' ? 'গ্রাহক' : 'Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('INDIVIDUAL_PROVIDER')}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-colors ${
                      role === 'INDIVIDUAL_PROVIDER'
                        ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {language === 'bn' ? 'টেকনিশিয়ান' : 'Technician'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('COMPANY_OWNER')}
                    className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-colors ${
                      role === 'COMPANY_OWNER'
                        ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {language === 'bn' ? 'কোম্পানি' : 'Company'}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'সম্পূর্ণ নাম' : 'Full Name'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: তানভির আহমেদ' : 'e.g. Tanvir Ahmed'}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'বাংলাদেশ মোবাইল নম্বর' : 'BD Mobile Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email or Mobile Number'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={language === 'bn' ? 'ইমেইল বা মোবাইল নম্বর দিন' : 'Enter email or phone'}
                  className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 mt-2"
          >
            {loading
              ? language === 'bn'
                ? 'অপেক্ষা করুন...'
                : 'Processing...'
              : mode === 'login'
                ? language === 'bn'
                  ? 'লগইন করুন'
                  : 'Log In'
                : language === 'bn'
                  ? 'নিবন্ধন সম্পন্ন করুন'
                  : 'Complete Registration'}
          </button>
        </form>

        {/* Toggle between login and register */}
        <div className="text-center mt-5 pt-4 border-t border-gray-100 text-xs text-gray-600">
          {mode === 'login' ? (
            <span>
              {language === 'bn' ? 'একাউন্ট নেই?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('register');
                }}
                className="font-bold text-brand-600 hover:underline"
              >
                {language === 'bn' ? 'নিবন্ধন করুন' : 'Register now'}
              </button>
            </span>
          ) : (
            <span>
              {language === 'bn' ? 'ইতিমধ্যে একাউন্ট আছে?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('login');
                }}
                className="font-bold text-brand-600 hover:underline"
              >
                {language === 'bn' ? 'লগইন করুন' : 'Log in here'}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
