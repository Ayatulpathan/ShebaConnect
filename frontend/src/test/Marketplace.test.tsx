import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceCard } from '../components/ServiceCard.js';
import { LanguageProvider } from '../context/LanguageContext.js';
import type { Service } from '../types/index.js';

const mockService: Service = {
  _id: 'srv-123',
  slug: 'ac-jet-wash',
  name: {
    en: 'Master AC Jet Wash',
    bn: 'মাস্টার এসি জেট ওয়াশ',
  },
  category: {
    _id: 'cat-123',
    slug: 'ac-repair',
    name: {
      en: 'AC Servicing',
      bn: 'এসি সার্ভিসিং',
    },
    description: {
      en: 'AC repair',
      bn: 'এসি মেরামত',
    },
    icon: 'Wind',
    order: 1,
    isActive: true,
  },
  description: {
    en: 'Deep indoor and outdoor unit cleaning',
    bn: 'গভীর ইনডোর ও আউটডোর পরিষ্কার',
  },
  images: [],
  basePrice: 1200,
  pricingType: 'STARTING_PRICE',
  estimatedDurationMinutes: 60,
  requirements: ['Water source'],
  isActive: true,
};

describe('ShebaConnect Phase 3 — Marketplace Frontend Tests', () => {
  it('renders ServiceCard with Bangla name, BDT currency, and pricing type badge', () => {
    render(
      <LanguageProvider>
        <ServiceCard service={mockService} />
      </LanguageProvider>
    );

    expect(screen.getByText('মাস্টার এসি জেট ওয়াশ')).toBeInTheDocument();
    expect(screen.getByText('এসি সার্ভিসিং')).toBeInTheDocument();
    expect(screen.getByText('৳১,২০০')).toBeInTheDocument();
    expect(screen.getAllByText('শুরু').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('বুকিং করুন')).toBeInTheDocument();
  });
});
