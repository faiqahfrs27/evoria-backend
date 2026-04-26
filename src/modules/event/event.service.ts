import {
  Prisma,
  PrismaClient,
  EventCategory,
} from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";
import { GetEventDTO } from "./dto/get-event.dto.js";
import { UpdateEventDTO } from "./dto/update-event.dto.js";

export class EventService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  getEvent = async (query: GetEventDTO) => {
    const {
      page = 1,
      take = 5,
      sortBy = "startDate",
      sortOrder = "asc",
      search,
      category,
      location,
    } = query;
    const whereClause: Prisma.EventWhereInput = {
      endDate: { gte: new Date() },
      deletedAt: null,
    };

    // Filter search by name event
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }

    // Filter by category
    if (category) {
      whereClause.category = category as EventCategory;
    }

    // Filter by location
    if (location) {
      whereClause.location = { contains: location, mode: "insensitive" };
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      take: take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organizer: {
          select: { id: true, name: true },
        },
        ticketTypes: true,
      },
    });

    const total = await this.prisma.event.count({
      where: whereClause,
    });

    console.log(events, "ini eveents")

    return {
      data: events,
      meta: { page, take, total },
    };
  };

  getEventById = async (id: string) => {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
        vouchers: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    if (!event) throw new ApiError("Event not found", 404);
    return event;
  };

  getEventBySlug = async (slug: string) => {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePic: true,
          },
        },
        ticketTypes: true,
        vouchers: true,
      },
    });

    if (!event) throw new ApiError("event not found", 404);

    return event;
  };

  createEvent = async (
    body: CreateEventDTO,
    thumbnail: Express.Multer.File | undefined,
    organizerId: string,
  ) => {
    const existing = await this.prisma.event.findFirst({
      where: { name: body.name, deletedAt: null },
    });
    if (existing) throw new ApiError("Event name already in use", 400);

    const slug = generateSlug(body.name);

    let imageUrl: string | null = null;
    if (thumbnail) {
      const { secure_url } = await this.cloudinaryService.upload(thumbnail);
      imageUrl = secure_url;
    }

    let parsedTicketTypes: { name: string; price: number; quota: number }[] =
      [];
    if ((body as any).ticketTypes) {
      try {
        parsedTicketTypes = JSON.parse((body as any).ticketTypes);
      } catch {
        throw new ApiError(
          "Invalid ticketTypes format, must be valid JSON",
          400,
        );
      }
    }

    await this.prisma.event.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        category: body.category,
        location: body.location,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isFree: body.isFree === "true",
        price: body.isFree === "true" ? 0 : Number(body.price),
        availableSeats: Number(body.availableSeats),
        totalSeats: Number(body.totalSeats),
        imageUrl,
        organizerId,
        ticketTypes: parsedTicketTypes
          ? {
              create: parsedTicketTypes.map((t: any) => ({
                name: t.name,
                price: Number(t.price),
                quota: Number(t.quota),
              })),
            }
          : undefined,
      },
    });

    return { message: "Create event success" };
  };

  updateEvent = async (
    eventId: string,
    organizerId: string,
    body: UpdateEventDTO,
    thumbnail?: Express.Multer.File,
  ) => {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
    });

    if (!event) throw new ApiError("Event not found", 404);

    // Upload gambar baru kalau ada
    let imageUrl = event.imageUrl;
    if (thumbnail) {
      if (event.imageUrl) {
        await this.cloudinaryService.removeByUrl(event.imageUrl);
      }
      const { secure_url } = (await this.cloudinaryService.upload(
        thumbnail,
      )) as { secure_url: string };
      imageUrl = secure_url;
    }
    // Regenerate slug kalau name berubah
    const slug = body.name ? generateSlug(body.name) : event.slug;

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(body.name && { name: body.name, slug }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category}),
        ...(body.location && { location: body.location }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.isFree !== undefined && { isFree: body.isFree === "true" }),
        ...(body.price !== undefined && {
          price: body.isFree === "true" ? 0 : Number(body.price),
        }),
        ...(body.availableSeats && {
          availableSeats: Number(body.availableSeats),
        }),
        ...(body.totalSeats && { totalSeats: Number(body.totalSeats) }),
        imageUrl,
      },
    });
  };

  deleteEvent = async (eventId: string, organizerId: string) => {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
    });

    if (!event) throw new ApiError("Event not found", 404);

    return this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  };
}
