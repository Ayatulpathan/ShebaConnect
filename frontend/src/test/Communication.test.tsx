import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '../components/NotificationBell.js';
import { BookingChatDrawer } from '../components/BookingChatDrawer.js';
import { LanguageProvider } from '../context/LanguageContext.js';

const { mockNotifications, mockMessages } = vi.hoisted(() => ({
  mockNotifications: [
    {
      _id: 'notif-1',
      recipient: 'user-1',
      title: { en: 'Technician on the way', bn: 'টেকনিশিয়ান রওনা দিয়েছেন' },
      message: {
        en: 'Technician is heading to your address',
        bn: 'টেকনিশিয়ান আপনার ঠিকানায় আসছেন',
      },
      type: 'BOOKING_STATUS_CHANGED' as const,
      isRead: false,
      createdAt: '2026-11-20T10:00:00.000Z',
    },
    {
      _id: 'notif-2',
      recipient: 'user-1',
      title: { en: 'System Notice', bn: 'সিস্টেম বার্তা' },
      message: { en: 'Welcome to ShebaConnect', bn: 'সেবাকানেক্টে স্বাগতম' },
      type: 'SYSTEM_ALERT' as const,
      isRead: false,
      createdAt: '2026-11-20T09:00:00.000Z',
    },
  ],
  mockMessages: [
    {
      _id: 'msg-1',
      booking: 'bk-123',
      sender: { _id: 'prov-1', name: 'Salim Electrician' },
      senderRole: 'INDIVIDUAL_PROVIDER',
      content: 'I will be there in 15 minutes.',
      readBy: ['prov-1'],
      createdAt: '2026-11-20T10:15:00.000Z',
      updatedAt: '2026-11-20T10:15:00.000Z',
    },
  ],
}));

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
  fetchNotifications: vi.fn().mockResolvedValue({
    notifications: mockNotifications,
    total: 2,
    unreadCount: 2,
    page: 1,
    limit: 15,
  }),
  fetchUnreadNotificationCount: vi.fn().mockResolvedValue(2),
  markNotificationAsRead: vi.fn().mockResolvedValue({ ...mockNotifications[0], isRead: true }),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(2),
  fetchBookingMessages: vi.fn().mockResolvedValue(mockMessages),
  sendBookingMessage: vi.fn().mockResolvedValue({
    _id: 'msg-2',
    booking: 'bk-123',
    sender: { _id: 'cust-1', name: 'You' },
    senderRole: 'CUSTOMER',
    content: 'Sure, see you soon!',
    readBy: ['cust-1'],
    createdAt: new Date().toISOString(),
  }),
  markBookingMessagesAsRead: vi.fn().mockResolvedValue(1),
}));

vi.mock('../services/socket.js', () => ({
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('../context/AuthContext.js', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: {
      id: 'cust-1',
      name: 'Rahim Customer',
      email: 'rahim@example.com',
      phone: '01711000001',
      role: 'CUSTOMER',
    },
    isAuthenticated: true,
  }),
}));

describe('ShebaConnect Phase 7 — Real-Time Communication & Notifications Tests', () => {
  it('renders NotificationBell with unread counter and displays notification dropdown', async () => {
    render(
      <LanguageProvider>
        <NotificationBell />
      </LanguageProvider>
    );

    // Initial badge counter
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click bell to toggle dropdown
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);

    // Notification dropdown header and list items
    await waitFor(() => {
      expect(screen.getByText('বিজ্ঞপ্তি সমূহ')).toBeInTheDocument();
      expect(screen.getByText('টেকনিশিয়ান রওনা দিয়েছেন')).toBeInTheDocument();
      expect(screen.getByText('সিস্টেম বার্তা')).toBeInTheDocument();
    });
  });

  it('renders BookingChatDrawer with booking header, message history, and send input', async () => {
    render(
      <LanguageProvider>
        <BookingChatDrawer
          isOpen={true}
          onClose={() => {}}
          bookingId="bk-123"
          bookingNumber="SC-2611-COMM01"
          partnerName="Salim Electrician"
        />
      </LanguageProvider>
    );

    // Header info
    expect(screen.getByText('SC-2611-COMM01')).toBeInTheDocument();
    expect(screen.getByText(/Salim Electrician/)).toBeInTheDocument();

    // Message from partner
    await waitFor(() => {
      expect(screen.getByText('I will be there in 15 minutes.')).toBeInTheDocument();
    });

    // Send input and button
    const input = screen.getByPlaceholderText(/বার্তা লিখুন/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Sure, see you soon!' } });
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Sure, see you soon!')).toBeInTheDocument();
    });
  });
});
