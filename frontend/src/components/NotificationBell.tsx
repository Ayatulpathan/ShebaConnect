import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api.js';
import { getSocket } from '../services/socket.js';
import type { Notification } from '../types/index.js';
import {
  Bell,
  Check,
  MessageSquare,
  AlertCircle,
  Wrench,
  Banknote,
  Loader2,
} from 'lucide-react';

interface Props {
  onOpenBooking?: (bookingId: string) => void;
}

export const NotificationBell: React.FC<Props> = ({ onOpenBooking }) => {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch (_err) {
      // Non-blocking
    }
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: 15 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_err) {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  // Initial load & Socket.IO live listener
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();

      const socket = getSocket();
      if (socket) {
        const handleNewNotification = (newNotif: Notification) => {
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
          socket.off('new_notification', handleNewNotification);
        };
      }
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (_err) {
        // Non-blocking
      }
    }

    if (notif.booking && onOpenBooking) {
      setIsOpen(false);
      const bId =
        typeof notif.booking === 'string'
          ? notif.booking
          : notif.booking._id || notif.booking.id;
      if (bId) onOpenBooking(bId);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_err) {
      // Non-blocking
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CHAT_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'BOOKING_STATUS_CHANGED':
        return <Wrench className="w-4 h-4 text-brand-600" />;
      case 'PAYMENT_COLLECTED':
      case 'PAYMENT_CONFIRMED':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'PAYMENT_DISPUTED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        aria-label="Notifications"
        className="relative p-2 text-gray-600 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-600 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {language === 'bn' ? 'বিজ্ঞপ্তি সমূহ' : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-700 rounded-full">
                  {unreadCount} {language === 'bn' ? 'টি নতুন' : 'new'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>{language === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                {language === 'bn'
                  ? 'কোনো নতুন বিজ্ঞপ্তি নেই'
                  : 'No notifications at this time'}
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`w-full text-left p-3 flex items-start gap-3 hover:bg-gray-50/80 transition-colors ${
                    !notif.isRead ? 'bg-brand-50/20' : ''
                  }`}
                >
                  <div className="p-2 bg-gray-100 rounded-xl shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                        }`}
                      >
                        {notif.title?.[language] || notif.title?.en}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                      {notif.message?.[language] || notif.message?.en}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
