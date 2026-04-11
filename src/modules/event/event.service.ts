import { PrismaClient, EventCategory } from "../../generated/prisma/client.js";

interface GetEventsQuery {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}

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
      throw { message: "Event not found", status: 404 };
    }

    return event;
  };
}