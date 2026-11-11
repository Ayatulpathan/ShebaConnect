import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import type { UserRole } from '../types/index.js';
import { X, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { signInWithGooglePopup } from '../config/firebase.js';

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
  const { login, register, loginWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { idToken } = await signInWithGooglePopup();
      await loginWithGoogle(idToken, role);
      onClose();
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string; response?: { data?: { error?: { message?: string } } } };
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      setErrorMessage(
        error.response?.data?.error?.message ||
          error.message ||
          (language === 'bn' ? 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।' : 'Failed to complete Google sign-in.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeveloperMockLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle('mock-google-token:google-demo-user:user.google@shebaconnect.com:Demo User', role);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setErrorMessage(error.response?.data?.error?.message || 'Mock login failed');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
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
                    placeholder={language === 'bn' ? 'আপনার নাম' : 'John Doe'}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর' : 'Email or Phone'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={language === 'bn' ? 'ইমেইল বা মোবাইল নম্বর দিন' : '017XXXXXXXX or user@example.com'}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
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

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500 font-medium">
              {language === 'bn' ? 'অথবা' : 'Or continue with'}
            </span>
          </div>
        </div>

        {/* Google Sign In Section */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{language === 'bn' ? 'গুগল দিয়ে সাইন ইন করুন' : 'Continue with Google'}</span>
          </button>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleDeveloperMockLogin}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline"
            >
              {language === 'bn' ? 'মক টেস্ট অ্যাকাউন্ট দিয়ে প্রবেশ' : 'Sign in as Mock Demo User'}
            </button>
          </div>
        </div>

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
