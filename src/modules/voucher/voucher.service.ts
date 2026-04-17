import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateVoucherDTO } from "./dto/create-voucher.dto.js";
import { GetVouchersDTO } from "./dto/get-voucher.dto.js";

export class VoucherService {
  constructor(private prisma: PrismaClient) {}

  getVouchers = async (eventId: string, query: GetVouchersDTO) => {
    const {
      page = 1,           
      take = 10,         
      sortBy = "createdAt", 
      sortOrder = "desc", 
      search
    } = query;

    const whereClause: Prisma.VoucherWhereInput = {
      eventId, 
    };

    if (search) {
      whereClause.code = { contains: search, mode: "insensitive" };
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        event: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const total = await this.prisma.voucher.count({
      where: whereClause,
    });

    return {
      data: vouchers,
      meta: { page, take, total },
    };
  };

  createVoucher = async (
    eventId: string,
    organizerId: string,
    body: CreateVoucherDTO
  ) => {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new ApiError("Event not found", 404);
    if (event.organizerId !== organizerId) {
      throw new ApiError("You don't have access to this event", 403);
    }

    const existing = await this.prisma.voucher.findFirst({
      where: {
        code: body.code,
        eventId,
      },
    });
    if (existing) throw new ApiError("Voucher code already in use", 400);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (endDate <= startDate) {
      throw new ApiError("End date must be after start date", 400);
    }

    await this.prisma.voucher.create({
      data: {
        code: body.code,
        discountAmount: Number(body.discountAmount),
        startDate,
        endDate,
        quota: Number(body.quota),
        eventId,
      },
    });

    return { message: "Create voucher success" };
  };

  deleteVoucher = async (voucherId: string, organizerId: string) => {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { event: true },
    });

    if (!voucher) throw new ApiError("Voucher not found", 404);

    if (voucher.event.organizerId !== organizerId) {
      throw new ApiError("You don't have access to this voucher", 403);
    }

    await this.prisma.voucher.delete({ where: { id: voucherId } });

    return { message: "Delete voucher success" };
  };
}