import { PrismaClient, EventStatus } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";

type CreateEventBody = {
  organizerId: number;
  category: string;
  title: string;
  description: string;
  city: string;
  startAt: Date;
  endAt: Date;
  status?: EventStatus;
};

type UpdateEventBody = {
  category?: string;
  title?: string;
  description?: string;
  city?: string;
  startAt?: Date;
  endAt?: Date;
  status?: EventStatus;
};

type GetEventsQuery = {
  search?: string;
  category?: string;
  city?: string;
  status?: EventStatus;
};

type CreateTicketTypeBody = {
  eventId: number;
  name: string;
  price: number;
  quota: number;
};

type UpdateTicketTypeBody = {
  name?: string;
  price?: number;
  quota?: number;
};

type CreateVoucherBody = {
  eventId: number;
  code: string;
  discountAmount: number;
  quota: number;
  startAt: Date;
  endAt: Date;
};

type UpdateVoucherBody = {
  code?: string;
  discountAmount?: number;
  quota?: number;
  startAt?: Date;
  endAt?: Date;
  isActive?: boolean;
};

export class EventService {
  constructor(private prisma: PrismaClient) {}

  createEvent = async (body: CreateEventBody) => {
    const organizer = await this.prisma.user.findUnique({
      where: { id: body.organizerId },
    });

    if (!organizer) {
      throw new ApiError("Organizer not found", 404);
    }

    if (organizer.role !== "ORGANIZER") {
      throw new ApiError("User is not organizer", 400);
    }

    if (body.endAt <= body.startAt) {
      throw new ApiError("End date must be after start date", 400);
    }

    const event = await this.prisma.event.create({
      data: {
        organizerId: body.organizerId,
        category: body.category,
        title: body.title,
        description: body.description,
        city: body.city,
        startAt: body.startAt,
        endAt: body.endAt,
        status: body.status ?? "DRAFT",
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return event;
  };

  getEvents = async (query: GetEventsQuery) => {
    const events = await this.prisma.event.findMany({
      where: {
        title: query.search
          ? {
              contains: query.search,
              mode: "insensitive",
            }
          : undefined,
        category: query.category,
        city: query.city,
        status: query.status,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startAt: "asc",
      },
    });

    return events;
  };

  getEventById = async (id: number) => {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    return event;
  };

  updateEvent = async (id: number, body: UpdateEventBody) => {
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new ApiError("Event not found", 404);
    }

    const finalStartAt = body.startAt ?? existingEvent.startAt;
    const finalEndAt = body.endAt ?? existingEvent.endAt;

    if (finalEndAt <= finalStartAt) {
      throw new ApiError("End date must be after start date", 400);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        category: body.category,
        title: body.title,
        description: body.description,
        city: body.city,
        startAt: body.startAt,
        endAt: body.endAt,
        status: body.status,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedEvent;
  };

  deleteEvent = async (id: number) => {
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new ApiError("Event not found", 404);
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return {
      message: "Event deleted successfully",
    };
  };

  createTicketType = async (body: CreateTicketTypeBody) => {
    const event = await this.prisma.event.findUnique({
      where: { id: body.eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    if (!body.name || !body.name.trim()) {
      throw new ApiError("Ticket type name is required", 400);
    }

    if (body.price < 0) {
      throw new ApiError("Ticket price cannot be negative", 400);
    }

    if (body.quota <= 0) {
      throw new ApiError("Ticket quota must be greater than 0", 400);
    }

    const existingTicketType = await this.prisma.ticketType.findFirst({
      where: {
        eventId: body.eventId,
        name: body.name,
      },
    });

    if (existingTicketType) {
      throw new ApiError("Ticket type already exists for this event", 400);
    }

    const ticketType = await this.prisma.ticketType.create({
      data: {
        eventId: body.eventId,
        name: body.name,
        price: body.price,
        quota: body.quota,
        remainingQuota: body.quota,
      },
    });

    return ticketType;
  };

  getTicketTypesByEvent = async (eventId: number) => {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    return await this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: {
        id: "asc",
      },
    });
  };

  updateTicketType = async (id: number, body: UpdateTicketTypeBody) => {
    const existingTicketType = await this.prisma.ticketType.findUnique({
      where: { id },
    });

    if (!existingTicketType) {
      throw new ApiError("Ticket type not found", 404);
    }

    const finalQuota = body.quota ?? existingTicketType.quota;
    const soldAmount =
      existingTicketType.quota - existingTicketType.remainingQuota;

    if (finalQuota <= 0) {
      throw new ApiError("Ticket quota must be greater than 0", 400);
    }

    if (finalQuota < soldAmount) {
      throw new ApiError(
        "New quota cannot be less than already allocated tickets",
        400,
      );
    }

    if (body.price !== undefined && body.price < 0) {
      throw new ApiError("Ticket price cannot be negative", 400);
    }

    const updatedTicketType = await this.prisma.ticketType.update({
      where: { id },
      data: {
        name: body.name,
        price: body.price,
        quota: body.quota,
        remainingQuota:
          body.quota !== undefined
            ? body.quota - soldAmount
            : existingTicketType.remainingQuota,
      },
    });

    return updatedTicketType;
  };

  deleteTicketType = async (id: number) => {
    const existingTicketType = await this.prisma.ticketType.findUnique({
      where: { id },
    });

    if (!existingTicketType) {
      throw new ApiError("Ticket type not found", 404);
    }

    await this.prisma.ticketType.delete({
      where: { id },
    });

    return {
      message: "Ticket type deleted successfully",
    };
  };

  createVoucher = async (body: CreateVoucherBody) => {
  const event = await this.prisma.event.findUnique({
    where: { id: body.eventId },
  });

  if (!event) {
    throw new ApiError("Event not found", 404);
  }

  if (!body.code || !body.code.trim()) {
    throw new ApiError("Voucher code is required", 400);
  }

  if (body.discountAmount <= 0) {
    throw new ApiError("Discount amount must be greater than 0", 400);
  }

  if (body.quota <= 0) {
    throw new ApiError("Voucher quota must be greater than 0", 400);
  }

  if (body.endAt <= body.startAt) {
    throw new ApiError("Voucher end date must be after start date", 400);
  }

  const existingVoucher = await this.prisma.eventVoucher.findFirst({
    where: {
      eventId: body.eventId,
      code: body.code,
    },
  });

  if (existingVoucher) {
    throw new ApiError("Voucher code already exists for this event", 400);
  }

  const voucher = await this.prisma.eventVoucher.create({
    data: {
      eventId: body.eventId,
      code: body.code,
      discountAmount: body.discountAmount,
      quota: body.quota,
      remainingQuota: body.quota,
      startAt: body.startAt,
      endAt: body.endAt,
      isActive: true,
    },
  });

  return voucher;
};

getVouchersByEvent = async (eventId: number) => {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new ApiError("Event not found", 404);
  }

  return await this.prisma.eventVoucher.findMany({
    where: { eventId },
    orderBy: {
      id: "asc",
    },
  });
};

updateVoucher = async (id: number, body: UpdateVoucherBody) => {
  const existingVoucher = await this.prisma.eventVoucher.findUnique({
    where: { id },
  });

  if (!existingVoucher) {
    throw new ApiError("Voucher not found", 404);
  }

  const finalStartAt = body.startAt ?? existingVoucher.startAt;
  const finalEndAt = body.endAt ?? existingVoucher.endAt;
  const finalQuota = body.quota ?? existingVoucher.quota;
  const usedAmount = existingVoucher.quota - existingVoucher.remainingQuota;

  if (finalEndAt <= finalStartAt) {
    throw new ApiError("Voucher end date must be after start date", 400);
  }

  if (body.discountAmount !== undefined && body.discountAmount <= 0) {
    throw new ApiError("Discount amount must be greater than 0", 400);
  }

  if (finalQuota <= 0) {
    throw new ApiError("Voucher quota must be greater than 0", 400);
  }

  if (finalQuota < usedAmount) {
    throw new ApiError("New voucher quota cannot be less than already used quota", 400);
  }

  const updatedVoucher = await this.prisma.eventVoucher.update({
    where: { id },
    data: {
      code: body.code,
      discountAmount: body.discountAmount,
      quota: body.quota,
      remainingQuota:
        body.quota !== undefined
          ? body.quota - usedAmount
          : existingVoucher.remainingQuota,
      startAt: body.startAt,
      endAt: body.endAt,
      isActive: body.isActive,
    },
  });

  return updatedVoucher;
};

deleteVoucher = async (id: number) => {
  const existingVoucher = await this.prisma.eventVoucher.findUnique({
    where: { id },
  });

  if (!existingVoucher) {
    throw new ApiError("Voucher not found", 404);
  }

  await this.prisma.eventVoucher.delete({
    where: { id },
  });

  return {
    message: "Voucher deleted successfully",
  };
};
}
