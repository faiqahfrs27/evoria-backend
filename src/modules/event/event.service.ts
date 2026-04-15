import { PrismaClient, EventCategory } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";

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
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  createEvent = async (
    body: CreateEventDTO,
    thumbnail: Express.Multer.File | undefined,
    organizerId: string,
  ) => {
    const event = await this.prisma.event.findFirst({
      where: {
        name: body.name,
      },
    });

    if (event) throw new ApiError("event name already in use", 400);

    const slug = generateSlug(body.name);

    const existingSlug = await this.prisma.event.findUnique({
      where: {
        slug: slug,
      },
    });

    let finalSlug = slug;

    if (existingSlug) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    const isFree = body.isFree === "true";
    const price = body.price ? Number(body.price) : 0;
    const availableSeats = Number(body.availableSeats);
    const totalSeats = Number(body.totalSeats);

    if (new Date(body.endDate) < new Date(body.startDate)) {
      throw new ApiError("end date cannot be earlier than start date", 400);
    }

    if (availableSeats > totalSeats) {
      throw new ApiError("available seats cannot be greater than total seats", 400);
    }

    if (!isFree && !body.price) {
      throw new ApiError("price is required for paid event", 400);
    }

    let imageUrl: string | null = null;

    if (thumbnail) {
      const { secure_url } = await this.cloudinaryService.upload(thumbnail);
      imageUrl = secure_url;
    }

    await this.prisma.event.create({
      data: {
        name: body.name,
        slug: finalSlug,
        description: body.description,
        category: body.category as EventCategory,
        location: body.location,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        price: isFree ? 0 : price,
        isFree: isFree,
        availableSeats: availableSeats,
        totalSeats: totalSeats,
        imageUrl: imageUrl,
        organizerId: organizerId,
      },
    });

    return { message: "create event success" };
  };
}