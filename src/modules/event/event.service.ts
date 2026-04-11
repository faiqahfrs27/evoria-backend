import { PrismaClient, EventCategory } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";

interface GetEventsQuery {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}

interface CreateEventBody {
  name: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  price: number;
  isFree: boolean;
  availableSeats: number;
  totalSeats: number;
  imageUrl?: string;
  ticketTypes?: { name: string; price: number; quota: number }[];
}

interface UpdateEventBody extends Partial<CreateEventBody> {}

export class EventService {
  constructor(private prisma: PrismaClient) {}

  getEvents = async (query: GetEventsQuery) => {
    const { search, category, location, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      startDate: { gte: new Date() },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category as EventCategory;
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startDate: "asc" },
        include: {
          organizer: {
            select: { id: true, name: true, email: true },
          },
          ticketTypes: true,
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  };

  getEventById = async (id: string) => {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        ticketTypes: true,
        vouchers: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    return event;
  };

  createEvent = async (organizerId: string, body: CreateEventBody) => {
    const { ticketTypes, ...eventData } = body;

    const event = await this.prisma.event.create({
      data: {
        ...eventData,
        category: eventData.category as EventCategory,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        price: eventData.isFree ? 0 : Number(eventData.price),
        organizerId,
        ticketTypes: ticketTypes
          ? { create: ticketTypes }
          : undefined,
      },
      include: { ticketTypes: true },
    });

    return event;
  };

  updateEvent = async (id: string, organizerId: string, body: UpdateEventBody) => {
    const existing = await this.prisma.event.findUnique({ where: { id } });

    if (!existing) throw new ApiError("Event not found", 404);
    if (existing.organizerId !== organizerId) {
      throw new ApiError("Forbidden: You don't own this event", 403);
    }

    const { ticketTypes, ...eventData } = body;

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...eventData,
        category: eventData.category
          ? (eventData.category as EventCategory)
          : undefined,
        startDate: eventData.startDate
          ? new Date(eventData.startDate)
          : undefined,
        endDate: eventData.endDate
          ? new Date(eventData.endDate)
          : undefined,
        price:
          eventData.isFree !== undefined
            ? eventData.isFree
              ? 0
              : Number(eventData.price)
            : undefined,
      },
      include: { ticketTypes: true },
    });

    return updated;
  };

  deleteEvent = async (id: string, organizerId: string) => {
    const existing = await this.prisma.event.findUnique({ where: { id } });

    if (!existing) throw new ApiError("Event not found", 404);
    if (existing.organizerId !== organizerId) {
      throw new ApiError("Forbidden: You don't own this event", 403);
    }

    await this.prisma.event.delete({ where: { id } });
    return { message: "Event deleted successfully" };
  };
}