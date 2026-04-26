import {
  PrismaClient,
  TransactionStatus,
} from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { getDateRange } from "../../utils/date-range.js";
import { groupByPeriod } from "../../utils/group-by-period.js";
import { TransactionService } from "../transaction/transaction.service.js";
import { GetStatisticsDTO } from "./dto/dashboard.dto.js";

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  getOrganizerEvents = async (organizerId: string) => {
    return this.prisma.event.findMany({
      where: { organizerId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        location: true,
        startDate: true,
        endDate: true,
        availableSeats: true,
        totalSeats: true, 
        price: true,
        isFree: true, 
        imageUrl: true, 
        createdAt: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  };

  getStatistics = async (organizerId: string, query: GetStatisticsDTO) => {
    const { period, year, month } = query;
    const { startDate, endDate } = getDateRange(period, year, month); // ✅ clean

    const transactions = await this.prisma.transaction.findMany({
      where: {
        event: { organizerId },
        status: TransactionStatus.DONE,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        finalPrice: true,
        quantity: true,
        createdAt: true,
        event: { select: { name: true } },
      },
    });

    const grouped = groupByPeriod(transactions, period);
    const totalRevenue = transactions.reduce((sum, t) => sum + t.finalPrice, 0);
    const totalTicketsSold = transactions.reduce(
      (sum, t) => sum + t.quantity,
      0,
    );

    return {
      summary: {
        totalRevenue,
        totalTicketsSold,
        totalTransactions: transactions.length,
      },
      chart: grouped,
    };
  };

  getAttendeeList = async (organizerId: string, eventId: string) => {
  const event = await this.prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });

  if (!event) throw new ApiError("Event not found", 404);

  return this.prisma.transaction.findMany({
    where: { eventId, status: TransactionStatus.DONE },
    select: {
      id: true,
      quantity: true,
      finalPrice: true,
      createdAt: true,
      customer: {
        select: { id: true, name: true, email: true },
      },
      ticketType: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};
}
