import { Types } from 'mongoose';
import { Quote, IQuote } from '../models/Quote.js';
import { Booking } from '../models/Booking.js';
import { BookingStateService } from './bookingState.service.js';
import { AppError } from '../utils/AppError.js';
import { UserRole } from '../constants/roles.js';

export interface CreateQuoteDTO {
  amount: number;
  breakdown?: Array<{ description: string; amount: number }>;
  notes?: string;
  validUntil: string | Date;
}

export class QuoteService {
  /**
   * Submit a formal quotation for a booking
   */
  public static async createQuote(
    bookingId: string,
    providerUserId: string,
    data: CreateQuoteDTO
  ): Promise<IQuote> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(booking.status)) {
      throw new AppError(
        `Cannot submit quotation for booking in '${booking.status}' status`,
        400,
        'INVALID_BOOKING_STATUS_FOR_QUOTE'
      );
    }

    const validUntilDate = new Date(data.validUntil);
    if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
      throw new AppError(
        'Quote validity date must be in the future',
        400,
        'INVALID_QUOTE_VALIDITY'
      );
    }

    const quote = await Quote.create({
      booking: booking._id,
      provider: new Types.ObjectId(providerUserId),
      organization: booking.organization,
      amount: data.amount,
      breakdown: data.breakdown || [],
      notes: data.notes,
      validUntil: validUntilDate,
      status: 'PENDING',
    });

    return quote;
  }

  /**
   * List quotations for a specific booking
   */
  public static async listQuotesForBooking(
    bookingId: string,
    actor: { userId: string; role: UserRole }
  ): Promise<IQuote[]> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const isCustomer = booking.customer.toString() === actor.userId;
    const isProvider = booking.provider?.toString() === actor.userId;
    const isAdmin = actor.role === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new AppError(
        'You are not authorized to view quotations for this booking',
        403,
        'FORBIDDEN_QUOTE_ACCESS'
      );
    }

    const quotes = await Quote.find({ booking: booking._id })
      .populate('provider', 'name phone email')
      .sort({ createdAt: -1 });

    return quotes;
  }

  /**
   * Customer responds to a quotation (ACCEPT / REJECT)
   */
  public static async respondToQuote(
    quoteId: string,
    customerUserId: string,
    action: 'ACCEPT' | 'REJECT'
  ): Promise<{ quote: IQuote; booking?: any }> {
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      throw new AppError('Quotation not found', 404, 'QUOTE_NOT_FOUND');
    }

    const booking = await Booking.findById(quote.booking);
    if (!booking) {
      throw new AppError('Associated booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.customer.toString() !== customerUserId) {
      throw new AppError(
        'Only the customer who created the booking can accept or reject this quote',
        403,
        'FORBIDDEN_QUOTE_ACTION'
      );
    }

    if (quote.status !== 'PENDING') {
      throw new AppError(
        `This quote has already been ${quote.status.toLowerCase()}`,
        400,
        'QUOTE_ALREADY_PROCESSED'
      );
    }

    if (new Date() > quote.validUntil) {
      quote.status = 'EXPIRED';
      await quote.save();
      throw new AppError('This quotation has expired', 400, 'QUOTE_EXPIRED');
    }

    if (action === 'ACCEPT') {
      quote.status = 'ACCEPTED';
      await quote.save();

      // Automatically transition booking to SCHEDULED with accepted quote details
      const updatedBooking = await BookingStateService.transition(
        booking._id,
        'SCHEDULED',
        { userId: customerUserId, role: 'CUSTOMER' },
        { quoteId: quote._id.toString(), finalPrice: quote.amount }
      );

      return { quote, booking: updatedBooking };
    } else {
      quote.status = 'REJECTED';
      await quote.save();
      return { quote };
    }
  }
}
