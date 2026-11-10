import { Types } from 'mongoose';
import { Review, IReview, IReviewCategories, ReviewStatus } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Organization } from '../models/Organization.js';
import { Service } from '../models/Service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { NOTIFICATION_TYPES } from '../constants/statuses.js';

export interface CreateReviewDTO {
  bookingId: string;
  rating: number;
  categories: IReviewCategories;
  comment: string;
}

export interface ReviewBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ServiceReviewsResponse {
  reviews: IReview[];
  summary: {
    averageRating: number;
    totalReviews: number;
    breakdown: ReviewBreakdown;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ReviewService {
  /**
   * Recalculates and updates rolling average ratings and counts
   */
  private static async recomputeRatings(
    serviceId?: Types.ObjectId | string,
    providerId?: Types.ObjectId | string,
    organizationId?: Types.ObjectId | string
  ): Promise<void> {
    if (serviceId) {
      const stats = await Review.aggregate([
        { $match: { service: new Types.ObjectId(serviceId.toString()), status: 'ACTIVE' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
      const count = stats.length > 0 ? stats[0].count : 0;
      await Service.findByIdAndUpdate(serviceId, { ratingAverage: avg, ratingCount: count });
    }

    if (providerId) {
      const stats = await Review.aggregate([
        { $match: { provider: new Types.ObjectId(providerId.toString()), status: 'ACTIVE' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
      const count = stats.length > 0 ? stats[0].count : 0;
      await ProviderProfile.findOneAndUpdate(
        { user: new Types.ObjectId(providerId.toString()) },
        { ratingAverage: avg, ratingCount: count }
      );
    }

    if (organizationId) {
      const stats = await Review.aggregate([
        { $match: { organization: new Types.ObjectId(organizationId.toString()), status: 'ACTIVE' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
      const count = stats.length > 0 ? stats[0].count : 0;
      await Organization.findByIdAndUpdate(organizationId, { ratingAverage: avg, ratingCount: count });
    }
  }

  /**
   * Submits a customer review for an eligible completed and paid booking
   */
  public static async createReview(
    userId: string,
    data: CreateReviewDTO
  ): Promise<IReview> {
    const booking = await Booking.findById(data.bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Role / ownership check: Customer who placed the booking
    if (booking.customer.toString() !== userId) {
      throw new AppError(
        'Only the customer who booked this service can submit a review',
        403,
        'FORBIDDEN_REVIEW'
      );
    }

    // Eligibility check: Booking must be COMPLETED
    if (booking.status !== 'COMPLETED') {
      throw new AppError(
        'Reviews can only be submitted after the service has been marked as COMPLETED',
        400,
        'BOOKING_NOT_COMPLETED'
      );
    }

    // Eligibility check: Cash payment must be CONFIRMED (isPaid === true)
    if (!booking.isPaid) {
      throw new AppError(
        'Reviews can only be submitted after cash payment has been completed and confirmed',
        400,
        'PAYMENT_REQUIRED_BEFORE_REVIEW'
      );
    }

    // Single review constraint: Prevent duplicates
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      throw new AppError(
        'A review has already been submitted for this booking',
        409,
        'REVIEW_ALREADY_EXISTS'
      );
    }

    // Create review
    const review = await Review.create({
      booking: booking._id,
      customer: booking.customer,
      provider: booking.provider,
      organization: booking.organization,
      technician: booking.technician,
      service: booking.service,
      rating: data.rating,
      categories: data.categories,
      comment: data.comment,
      isPublic: true,
      status: 'ACTIVE',
    });

    // Recalculate rating aggregates
    await this.recomputeRatings(booking.service, booking.provider, booking.organization);

    // If individual provider, increment completed jobs counter in profile
    if (booking.provider) {
      await ProviderProfile.findOneAndUpdate(
        { user: booking.provider },
        { $inc: { totalCompletedJobs: 1 } }
      );

      // In-app notification to provider
      await NotificationService.createNotification({
        recipient: booking.provider.toString(),
        sender: booking.customer.toString(),
        booking: booking._id.toString(),
        title: {
          en: `New ${data.rating}-Star Review Received!`,
          bn: `নতুন ${data.rating}-স্টার রিভিউ পেয়েছেন!`,
        },
        message: {
          en: `A customer rated your service ${data.rating}/5 stars: "${data.comment.slice(0, 80)}"`,
          bn: `একজন গ্রাহক আপনার সেবাকে ${data.rating}/5 স্টার দিয়েছেন: "${data.comment.slice(0, 80)}"`,
        },
        type: NOTIFICATION_TYPES.NEW_REVIEW,
        link: `/bookings?bookingId=${booking._id}`,
      }).catch(() => {});
    }

    // If organization booking, notify company owner
    if (booking.organization) {
      const org = await Organization.findById(booking.organization);
      if (org?.owner) {
        await NotificationService.createNotification({
          recipient: org.owner.toString(),
          sender: booking.customer.toString(),
          booking: booking._id.toString(),
          title: {
            en: `New ${data.rating}-Star Review for your Organization`,
            bn: `আপনার প্রতিষ্ঠানের সেবায় নতুন ${data.rating}-স্টার রিভিউ`,
          },
          message: {
            en: `A customer rated the service ${data.rating}/5 stars: "${data.comment.slice(0, 80)}"`,
            bn: `গ্রাহক প্রতিষ্ঠানটির সেবাকে ${data.rating}/5 স্টার দিয়েছেন: "${data.comment.slice(0, 80)}"`,
          },
          type: NOTIFICATION_TYPES.NEW_REVIEW,
          link: `/bookings?bookingId=${booking._id}`,
        }).catch(() => {});
      }
    }

    return review;
  }

  /**
   * Submits a polite provider reply to a customer review
   */
  public static async replyToReview(
    reviewId: string,
    userId: string,
    reply: string
  ): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    // Permission check: Assigned provider, assigned technician, or company owner
    let isAuthorized = false;
    if (review.provider && review.provider.toString() === userId) {
      isAuthorized = true;
    } else if (review.technician && review.technician.toString() === userId) {
      isAuthorized = true;
    } else if (review.organization) {
      const org = await Organization.findById(review.organization);
      if (org && org.owner.toString() === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new AppError(
        'You do not have permission to reply to this review',
        403,
        'FORBIDDEN_REVIEW_REPLY'
      );
    }

    review.providerReply = reply;
    review.repliedAt = new Date();
    review.repliedBy = new Types.ObjectId(userId);
    await review.save();

    // In-app notification to the reviewing customer
    await NotificationService.createNotification({
      recipient: review.customer.toString(),
      sender: new Types.ObjectId(userId).toString(),
      booking: review.booking.toString(),
      title: {
        en: 'Provider replied to your review',
        bn: 'সার্ভিস প্রদানকারী আপনার রিভিউতে উত্তর দিয়েছেন',
      },
      message: {
        en: `Reply: "${reply.slice(0, 80)}..."`,
        bn: `উত্তর: "${reply.slice(0, 80)}..."`,
      },
      type: NOTIFICATION_TYPES.REVIEW_REPLIED,
      link: `/bookings?bookingId=${review.booking}`,
    }).catch(() => {});

    return review;
  }

  /**
   * Retrieves review for a specific booking
   */
  public static async getReviewByBooking(bookingId: string): Promise<IReview | null> {
    return Review.findOne({ booking: new Types.ObjectId(bookingId) })
      .populate('customer', 'name avatarUrl role')
      .populate('provider', 'name avatarUrl role')
      .populate('repliedBy', 'name avatarUrl role');
  }

  /**
   * Retrieves public reviews for a specific service with statistical breakdown
   */
  public static async getReviewsByService(
    serviceId: string,
    page = 1,
    limit = 10
  ): Promise<ServiceReviewsResponse> {
    const filter = {
      service: new Types.ObjectId(serviceId),
      status: 'ACTIVE',
      isPublic: true,
    };

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'name avatarUrl role')
      .populate('repliedBy', 'name avatarUrl role');

    // Rating breakdown aggregation
    const breakdownAgg = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const breakdown: ReviewBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    for (const item of breakdownAgg) {
      const r = item._id as 1 | 2 | 3 | 4 | 5;
      if (breakdown[r] !== undefined) {
        breakdown[r] = item.count;
        totalScore += r * item.count;
      }
    }

    const averageRating = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;

    return {
      reviews,
      summary: {
        averageRating,
        totalReviews: total,
        breakdown,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves public reviews for a specific provider
   */
  public static async getReviewsByProvider(
    providerId: string,
    page = 1,
    limit = 10
  ): Promise<ServiceReviewsResponse> {
    const filter = {
      provider: new Types.ObjectId(providerId),
      status: 'ACTIVE',
      isPublic: true,
    };

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'name avatarUrl role')
      .populate('service', 'name slug basePrice')
      .populate('repliedBy', 'name avatarUrl role');

    const breakdownAgg = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const breakdown: ReviewBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    for (const item of breakdownAgg) {
      const r = item._id as 1 | 2 | 3 | 4 | 5;
      if (breakdown[r] !== undefined) {
        breakdown[r] = item.count;
        totalScore += r * item.count;
      }
    }

    const averageRating = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;

    return {
      reviews,
      summary: {
        averageRating,
        totalReviews: total,
        breakdown,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Moderates a review status (ADMIN / Support only)
   */
  public static async updateReviewStatus(
    reviewId: string,
    status: ReviewStatus
  ): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    review.status = status;
    await review.save();

    // Recompute ratings since status changed
    await this.recomputeRatings(review.service, review.provider, review.organization);

    return review;
  }
}
