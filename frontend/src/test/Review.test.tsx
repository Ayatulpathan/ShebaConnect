import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewModal } from '../components/ReviewModal.js';
import { ReviewDisplayCard } from '../components/ReviewDisplayCard.js';
import { ServiceReviewsSection } from '../components/ServiceReviewsSection.js';
import { LanguageProvider } from '../context/LanguageContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import type { Review, ServiceReviewsResponse } from '../types/index.js';

const { mockReview, mockServiceReviews } = vi.hoisted(() => {
  const mockReview: Review = {
    _id: 'rev-001',
    booking: 'bk-123',
    customer: {
      id: 'cust-1',
      name: 'Rahim Chowdhury',
      email: 'rahim@example.com',
      phone: '01711000001',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isVerified: true,
      preferredLanguage: 'bn',
      addresses: [],
      createdAt: '2026-11-20T10:00:00.000Z',
    },
    service: {
      _id: 'srv-1',
      name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
      slug: 'ac-servicing',
    },
    rating: 5,
    categories: {
      punctuality: 5,
      quality: 5,
      behavior: 5,
      costTransparency: 5,
    },
    comment: 'Technician was punctual and cleaned the AC thoroughly.',
    providerReply: 'Thank you Rahim bhai for your appreciation!',
    repliedAt: '2026-11-20T11:00:00.000Z',
    isPublic: true,
    status: 'ACTIVE',
    createdAt: '2026-11-20T10:30:00.000Z',
    updatedAt: '2026-11-20T11:00:00.000Z',
  };

  const mockServiceReviews: ServiceReviewsResponse = {
    reviews: [mockReview],
    summary: {
      averageRating: 5.0,
      totalReviews: 1,
      breakdown: {
        5: 1,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    },
    pagination: {
      page: 1,
      limit: 5,
      total: 1,
      totalPages: 1,
    },
  };

  return { mockReview, mockServiceReviews };
});

vi.mock('../services/api.js', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setApiAccessToken: vi.fn(),
  createReview: vi.fn().mockResolvedValue(mockReview),
  replyToReview: vi.fn().mockResolvedValue({
    ...mockReview,
    providerReply: 'Thank you for your valuable feedback!',
  }),
  fetchBookingReview: vi.fn().mockResolvedValue(mockReview),
  fetchServiceReviews: vi.fn().mockResolvedValue(mockServiceReviews),
  fetchProviderReviews: vi.fn().mockResolvedValue(mockServiceReviews),
}));

describe('ShebaConnect Phase 8 — Reviews & Ratings Component Tests', () => {
  it('renders ReviewModal and submits 5-star rating with comments', async () => {
    const handleClose = vi.fn();
    const handleSubmitted = vi.fn();

    render(
      <LanguageProvider>
        <AuthProvider>
          <ReviewModal
            isOpen={true}
            bookingId="bk-123"
            serviceTitle="AC Master Servicing"
            onClose={handleClose}
            onReviewSubmitted={handleSubmitted}
          />
        </AuthProvider>
      </LanguageProvider>
    );

    // Modal title & service title rendered
    expect(screen.getByText(/Rate & Review Service|সেবার রিভিউ ও রেটিং দিন/i)).toBeInTheDocument();
    expect(screen.getByText('AC Master Servicing')).toBeInTheDocument();

    // Type review comment
    const textarea = screen.getByPlaceholderText(
      /Describe technician work quality|টেকনিশিয়ানের কাজের মান/i
    );
    fireEvent.change(textarea, {
      target: { value: 'Great experience! AC cooling restored completely.' },
    });

    // Submit review
    const submitBtn = screen.getByRole('button', {
      name: /Submit Review|রিভিউ জমা দিন/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Thank you for your valuable feedback|আপনার মূল্যবান মতামতের জন্য ধন্যবাদ/i)
      ).toBeInTheDocument();
    });
  });

  it('renders ReviewDisplayCard with stars, category badges and provider reply', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <ReviewDisplayCard review={mockReview} />
        </AuthProvider>
      </LanguageProvider>
    );

    // Customer name and star score rendered
    expect(screen.getByText('Rahim Chowdhury')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(
      screen.getByText(/"Technician was punctual and cleaned the AC thoroughly."/)
    ).toBeInTheDocument();

    // Provider reply rendered
    expect(
      screen.getByText(/"Thank you Rahim bhai for your appreciation!"/)
    ).toBeInTheDocument();
  });

  it('renders ServiceReviewsSection with breakdown and review counts', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <ServiceReviewsSection serviceId="srv-1" />
        </AuthProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('5.0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/1 টি রিভিউ|1 reviews/i)).toBeInTheDocument();
      expect(screen.getByText('Rahim Chowdhury')).toBeInTheDocument();
    });
  });
});
