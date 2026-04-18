import { Prisma, PrismaClient, TransactionStatus } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateReviewDTO } from "./dto/create-review.dto.js";

export class ReviewService {
  constructor(private prisma: PrismaClient) {}

  // Customer buat review
  createReview = async (customerId: string, body: CreateReviewDTO) => {
    const { eventId, rating, comment } = body;

    // 1. Cek event ada
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new ApiError("Event not found", 404);

    // 2. Cek event sudah selesai
    // Customer hanya bisa review kalau event sudah lewat
    if (new Date() < event.endDate) {
      throw new ApiError("You can only review after the event has ended", 400);
    }

    // 3. Cek customer punya transaksi DONE di event ini
    // Artinya customer benar-benar sudah attend event
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        customerId,
        eventId,
        status: TransactionStatus.DONE,
      },
    });
    if (!transaction) {
      throw new ApiError(
        "You can only review events you have attended",
        403
      );
    }

    // 4. Cek customer belum pernah review event ini
    const existingReview = await this.prisma.review.findUnique({
      where: {
        customerId_eventId: { customerId, eventId },
      },
    });
    if (existingReview) {
      throw new ApiError("You have already reviewed this event", 400);
    }

    // 5. Buat review
    const review = await this.prisma.review.create({
      data: {
        customerId,
        eventId,
        rating,
        comment,
      },
      include: {
        customer: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    return review;
  };

  // Lihat semua review di 1 event (public)
  getEventReviews = async (eventId: string) => {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new ApiError("Event not found", 404);

    const reviews = await this.prisma.review.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    // Hitung rata-rata rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      data: reviews,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10, // 1 desimal
    };
  };

  // Lihat profil organizer + semua review eventnya (public)
  getOrganizerProfile = async (organizerId: string) => {
    // 1. Cek organizer ada
    const organizer = await this.prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePic: true,
        createdAt: true,
      },
    });
    if (!organizer) throw new ApiError("Organizer not found", 404);

    // 2. Ambil semua event organizer beserta reviewnya
    const events = await this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      include: {
        reviews: {
          include: {
            customer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // 3. Hitung statistik keseluruhan organizer
    const allReviews = events.flatMap((e) => e.reviews);
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return {
      organizer,
      totalEvents: events.length,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        totalReviews: e.reviews.length,
        averageRating:
          e.reviews.length > 0
            ? Math.round(
                (e.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  e.reviews.length) *
                  10
              ) / 10
            : 0,
        reviews: e.reviews,
      })),
    };
  };
}