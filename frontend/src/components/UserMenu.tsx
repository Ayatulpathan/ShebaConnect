import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { AuthModal } from './AuthModal.js';
import { User, LogOut, ChevronDown, MapPin, Shield } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, t } = useLanguage();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setAuthModalOpen(true);
  };

  const getRoleLabel = (role: string) => {
    if (language === 'bn') {
      switch (role) {
        case 'CUSTOMER':
          return 'গ্রাহক';
        case 'INDIVIDUAL_PROVIDER':
          return 'টেকনিশিয়ান';
        case 'COMPANY_OWNER':
          return 'কোম্পানি স্বত্বাধিকারী';
        case 'ADMIN':
          return 'অ্যাডমিন';
        default:
          return role;
      }
    }
    return role.replace('_', ' ');
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openAuth('login')}
            className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
          >
            {t.nav.login}
          </button>
          <button
            onClick={() => openAuth('register')}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            {t.nav.register}
          </button>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={modalMode}
        />
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-900 leading-tight">{user.name}</span>
          <span className="text-[10px] text-brand-700 font-medium">{getRoleLabel(user.role)}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900">{user.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded bg-brand-50 text-brand-700">
              {getRoleLabel(user.role)}
            </span>
          </div>

          <div className="py-1 text-xs text-gray-700">
            <button
              onClick={() => {
                setDropdownOpen(false);
                alert(language === 'bn' ? 'প্রোফাইল পৃষ্ঠা শিঘ্রই আসছে' : 'Profile page coming soon');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 text-left"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>{language === 'bn' ? 'আমার প্রোফাইল' : 'My Profile'}</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                alert(language === 'bn' ? 'ঠিকানা ব্যবস্থাপনা' : 'Address Management');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 text-left"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{language === 'bn' ? 'ঠিকানা সমূহ' : 'Saved Addresses'}</span>
            </button>

            {user.role === 'ADMIN' && (
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 text-left text-purple-700 font-medium"
              >
                <Shield className="w-4 h-4 text-purple-500" />
                <span>{language === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}</span>
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 pt-1 mt-1">
            <button
              onClick={async () => {
                setDropdownOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left font-medium"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>{language === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
