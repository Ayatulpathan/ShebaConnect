import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderOperationsModal } from '../components/ProviderOperationsModal.js';
import { CompanyOperationsModal } from '../components/CompanyOperationsModal.js';
import { LanguageProvider } from '../context/LanguageContext.js';

// Mock API calls
vi.mock('../services/api.js', () => ({
  fetchMyProviderProfile: vi.fn().mockResolvedValue({
    _id: 'prof-1',
    user: 'user-1',
    bio: 'Certified AC repair technician',
    skills: ['AC Maintenance', 'Wiring'],
    experienceYears: 5,
    emergencyContact: '01712345678',
    verificationStatus: 'UNVERIFIED',
    totalCompletedJobs: 12,
    ratingAverage: 4.8,
    ratingCount: 10,
  }),
  fetchMyAvailability: vi.fn().mockResolvedValue([
    { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isAvailable: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isAvailable: false },
  ]),
  updateMyProviderProfile: vi.fn().mockResolvedValue({}),
  submitProviderVerification: vi.fn().mockResolvedValue({}),
  updateMyAvailability: vi.fn().mockResolvedValue([]),
  fetchMyCompany: vi.fn().mockResolvedValue({
    _id: 'org-1',
    businessName: 'Dhaka Care Services Ltd',
    tradeLicenseNumber: 'TRAD-12345',
    contactPhone: '01812345678',
    contactEmail: 'contact@dhakacare.com',
    serviceAreas: ['mirpur', 'dhanmondi'],
    verificationStatus: 'VERIFIED',
    isActive: true,
  }),
  fetchCompanyMembers: vi.fn().mockResolvedValue([
    {
      _id: 'mem-1',
      organization: 'org-1',
      user: { name: 'Al Amin Technician', phone: '01700000001' },
      role: 'TECHNICIAN',
      isActive: true,
    },
  ]),
  createCompany: vi.fn().mockResolvedValue({}),
  updateMyCompany: vi.fn().mockResolvedValue({}),
  addCompanyMember: vi.fn().mockResolvedValue({}),
  removeCompanyMember: vi.fn().mockResolvedValue({}),
}));

describe('ShebaConnect Phase 4 — Provider & Company Operations Frontend Tests', () => {
  it('renders ProviderOperationsModal with tabs, NID zero-cost protocol notice, and availability', async () => {
    render(
      <LanguageProvider>
        <ProviderOperationsModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    // Header & Tab labels in Bengali
    expect(screen.getByText('টেকনিশিয়ান হাব ও পরিচালনা')).toBeInTheDocument();
    expect(screen.getByText('বায়ো ও দক্ষতা')).toBeInTheDocument();
    expect(screen.getByText('এনআইডি ভেরিফিকেশন')).toBeInTheDocument();
    expect(screen.getByText('কাজের সময়সূচী')).toBeInTheDocument();

    // Switch to NID verification tab
    fireEvent.click(screen.getByText('এনআইডি ভেরিফিকেশন'));
    expect(await screen.findByText('জাতীয় পরিচয়পত্র (NID) নম্বর')).toBeInTheDocument();
    expect(screen.getByText('শূন্য-খরচ ডকুমেন্ট প্রোটোকল')).toBeInTheDocument();

    // Switch to Availability tab
    fireEvent.click(screen.getByText('কাজের সময়সূচী'));
    expect(await screen.findByText('রবিবার')).toBeInTheDocument();
    expect(screen.getByText('সময়সূচী সংরক্ষণ করুন')).toBeInTheDocument();
  });

  it('renders CompanyOperationsModal with company details, Dhaka service areas, and members roster', async () => {
    render(
      <LanguageProvider>
        <CompanyOperationsModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('কোম্পানি ম্যানেজমেন্ট')).toBeInTheDocument();
    expect(screen.getByText('প্রতিষ্ঠানের তথ্য')).toBeInTheDocument();
    expect(screen.getByText('টেকনিশিয়ান ও কর্মী')).toBeInTheDocument();

    // Dhaka areas buttons (wait for loading to finish)
    expect(await screen.findByText('মিরপুর')).toBeInTheDocument();
    expect(screen.getByText('ধানমন্ডি')).toBeInTheDocument();
    expect(screen.getByText('গুলশান')).toBeInTheDocument();
  });
});
