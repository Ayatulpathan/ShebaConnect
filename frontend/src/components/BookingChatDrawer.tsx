import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchBookingMessages,
  sendBookingMessage,
  markBookingMessagesAsRead,
} from '../services/api.js';
import { getSocket } from '../services/socket.js';
import type { ChatMessage } from '../types/index.js';
import {
  X,
  Send,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingNumber: string;
  partnerName?: string;
}

export const BookingChatDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  bookingId,
  bookingNumber,
  partnerName,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const history = await fetchBookingMessages(bookingId);
      setMessages(history);
      await markBookingMessagesAsRead(bookingId);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    loadMessages();

    const socket = getSocket();
    if (socket) {
      socket.emit('join_booking_chat', { bookingId });

      const handleNewMessage = (newMsg: ChatMessage) => {
        if (newMsg.booking === bookingId || (newMsg.booking as any)?._id === bookingId) {
          setMessages((prev) => [...prev, newMsg]);
          markBookingMessagesAsRead(bookingId);
          setTimeout(scrollToBottom, 50);
        }
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.emit('leave_booking_chat', { bookingId });
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending) return;

    setSending(true);
    setErrorMsg(null);
    try {
      const msg = await sendBookingMessage(bookingId, content);
      setInputText('');
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'bn' ? 'লাইভ চ্যাট ও বার্তা' : 'Live Booking Chat'}
                </h3>
                <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">
                  {bookingNumber}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {partnerName
                  ? `${language === 'bn' ? 'কথোপকথন:' : 'With:'} ${partnerName}`
                  : language === 'bn'
                  ? 'গ্রাহক ও টেকনিশিয়ান সরাসরি বার্তা'
                  : 'Direct messaging between customer & provider'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close chat"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-4 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-xs">
                {language === 'bn' ? 'বার্তা লোড হচ্ছে...' : 'Loading messages...'}
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-xs px-6">
              <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
              <p className="font-semibold text-gray-600">
                {language === 'bn' ? 'কোনো পূর্ববর্তী বার্তা নেই' : 'No messages yet'}
              </p>
              <p className="text-[11px] mt-1">
                {language === 'bn'
                  ? 'সার্ভিস ও সময়সূচি নিশ্চিত করতে প্রোভাইডারের সাথে কথা বলুন'
                  : 'Start the conversation to discuss details and scheduling'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender?._id === user?.id || (msg.sender as any) === user?.id;
              const senderName = msg.sender?.name || (isMe ? 'You' : 'Participant');

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-gray-500">
                      {isMe ? (language === 'bn' ? 'আপনি' : 'You') : senderName}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'বার্তা লিখুন...'
                : 'Type your message...'
            }
            className="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={sending || !inputText.trim()}
            className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
