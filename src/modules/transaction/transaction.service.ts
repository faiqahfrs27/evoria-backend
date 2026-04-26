import {
  Prisma,
  PrismaClient,
  TransactionStatus,
} from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { MailService } from "../mail/mail.service.js";
import { CreateTransactionDTO } from "./dto/create-transaction.dto.js";
import { GetTransactionsDTO } from "./dto/get-transaction.dto.js";

export class TransactionService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
    private mailService: MailService,
  ) {}

  // ── HELPER: Rollback seat, voucher, coupon, poin ──────────
  rollbackTransaction = async (transactionId: string) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { voucher: true, coupon: true },
    });

    if (!transaction) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.event.update({
          where: { id: transaction.eventId },
          data: { availableSeats: { increment: transaction.quantity } },
        });

        if (transaction.ticketTypeId) {
          await tx.ticketType.update({
            where: { id: transaction.ticketTypeId },
            data: { quota: { increment: transaction.quantity } },
          });
        }

        if (transaction.voucherId) {
          await tx.voucher.update({
            where: { id: transaction.voucherId },
            data: { usedCount: { decrement: 1 } },
          });
        }

        if (transaction.couponId) {
          await tx.coupon.update({
            where: { id: transaction.couponId },
            data: { isUsed: false },
          });
        }

        if (transaction.pointUsed > 0) {
          await tx.point.create({
            data: {
              userId: transaction.customerId,
              amount: transaction.pointUsed,
              source: "refund",
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          });
        }
      });
    } catch (error) {
      console.error("[ROLLBACK] ERROR:", error);
    }
  };

  // ── 1. CREATE TRANSACTION ─────────────────────────────────
  createTransaction = async (
    customerId: string,
    body: CreateTransactionDTO,
  ) => {
    const {
      eventId,
      ticketTypeId,
      voucherId,
      couponCode,
      quantity,
      pointUsed = "0",
    } = body;

    // 1. Cek event ada
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    });
    if (!event) throw new ApiError("Event not found", 404);

    // 2. Cek seat tersedia
    if (event.availableSeats < Number(quantity)) {
      throw new ApiError("Not enough seats available", 400);
    }

    // 3. Tentukan harga dasar
    let basePrice = event.price * Number(quantity);

    // 4. Kalau ada ticketType, pakai harga ticketType
    if (ticketTypeId) {
      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
      });
      if (!ticketType) throw new ApiError("Ticket type not found", 404);
      if (ticketType.quota < Number(quantity)) {
        throw new ApiError("Not enough ticket quota", 400);
      }
      basePrice = ticketType.price * Number(quantity);
    }

    // 5. Hitung diskon voucher (dari organizer, spesifik event)
    let discountVoucher = 0;
    if (voucherId) {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: voucherId },
      });
      if (!voucher) throw new ApiError("Voucher not found", 404);
      if (voucher.eventId !== eventId) {
        throw new ApiError("Voucher not valid for this event", 400);
      }
      if (voucher.usedCount >= voucher.quota) {
        throw new ApiError("Voucher quota exceeded", 400);
      }
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        throw new ApiError("Voucher is not active", 400);
      }
      discountVoucher = voucher.discountAmount;
    }

    //Hitung diskon coupon (dari sistem/referral, berlaku semua event)
    let discountCoupon = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (!coupon) throw new ApiError("Coupon not found", 404);
      if (coupon.userId !== customerId) {
        throw new ApiError("Coupon does not belong to you", 403);
      }
      if (coupon.isUsed)
        throw new ApiError("Coupon has already been used", 400);
      if (new Date() > coupon.expiresAt)
        throw new ApiError("Coupon has expired", 400);

      // Hitung diskon persen dari basePrice
      discountCoupon = Math.floor(basePrice * (coupon.discountPercent / 100));
    }

    // 7. Hitung diskon poin
    const customerPoints = await this.prisma.point.findMany({
      where: {
        userId: customerId,
        isExpired: false,
        expiresAt: { gt: new Date() },
      },
    });
    const totalPoints = customerPoints.reduce((sum, p) => sum + p.amount, 0);

    const pointToUse = Number(pointUsed);
    if (pointToUse > totalPoints) {
      throw new ApiError(
        `Not enough points. Your balance: ${totalPoints} points`,
        400,
      );
    }

    // 8. Hitung harga final
    let finalPrice = basePrice - discountVoucher - discountCoupon - pointToUse;
    if (finalPrice < 0) finalPrice = 0;

    // 9. Set deadline pembayaran 2 jam dari sekarang
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 2);

    // 10. Buat transaksi dalam 1 DB transaction (atomic)
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Kurangi available seats
      await tx.event.update({
        where: { id: eventId },
        data: { availableSeats: { decrement: Number(quantity) } },
      });

      // Kurangi quota ticketType
      if (ticketTypeId) {
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { quota: { decrement: Number(quantity) } },
        });
      }

      // Tambah usedCount voucher
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Mark coupon used
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { isUsed: true },
        });
      }

      // Kurangi poin customer (hapus dari yang paling lama)
      if (pointToUse > 0) {
        let remaining = pointToUse;
        for (const point of customerPoints) {
          if (remaining <= 0) break;
          if (point.amount <= remaining) {
            await tx.point.delete({ where: { id: point.id } });
            remaining -= point.amount;
          } else {
            await tx.point.update({
              where: { id: point.id },
              data: { amount: { decrement: remaining } },
            });
            remaining = 0;
          }
        }
      }

      // Buat transaksi
      return await tx.transaction.create({
        data: {
          customerId,
          eventId,
          ticketTypeId: ticketTypeId || null,
          voucherId: voucherId || null,
          couponId: coupon?.id || null, // ✅ simpan couponId
          quantity: Number(quantity),
          basePrice,
          finalPrice,
          pointUsed: pointToUse,
          paymentDeadline,
          status: TransactionStatus.WAITING_FOR_PAYMENT,
        },
        include: {
          event: {
            select: { id: true, name: true, location: true, startDate: true },
          },
          ticketType: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      });
    });

    // 11. Kirim email notifikasi ke customer
    await this.mailService.sendMail({
      to: transaction.customer.email,
      subject: "Transaksi Berhasil Dibuat - Segera Lakukan Pembayaran",
      templateName: "transactionCreated",
      context: {
        customerName: transaction.customer.name,
        eventName: transaction.event.name,
        transactionId: transaction.id,
        finalPrice: finalPrice.toLocaleString("id-ID"),
        paymentDeadline: paymentDeadline.toLocaleString("id-ID"),
      },
    });

    return transaction;
  };

  // ── 2. UPLOAD PAYMENT PROOF ───────────────────────────────
  uploadPaymentProof = async (
    transactionId: string,
    customerId: string,
    file: Express.Multer.File,
  ) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        event: { select: { name: true } },
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.customerId !== customerId)
      throw new ApiError("Forbidden", 403);
    if (transaction.status !== TransactionStatus.WAITING_FOR_PAYMENT) {
      throw new ApiError("Transaction is not waiting for payment", 400);
    }

    if (new Date() > transaction.paymentDeadline) {
      await this.rollbackTransaction(transactionId);
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.EXPIRED },
      });
      throw new ApiError(
        "Payment deadline has passed, transaction expired",
        400,
      );
    }

    const { secure_url } = await this.cloudinaryService.upload(file);

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProof: secure_url,
        status: TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
      },
    });

    await this.mailService.sendMail({
      to: transaction.customer.email,
      subject: "Bukti Pembayaran Diterima - Menunggu Konfirmasi",
      templateName: "transactionCreated",
      context: {
        customerName: transaction.customer.name,
        eventName: transaction.event.name,
        transactionId: transaction.id,
        finalPrice: transaction.finalPrice.toLocaleString("id-ID"),
        paymentDeadline: "Menunggu konfirmasi organizer (maks. 3 hari)",
      },
    });

    return updated;
  };

  // ── 3. CANCEL TRANSACTION ─────────────────────────────────
  cancelTransaction = async (transactionId: string, customerId: string) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: { select: { name: true, email: true } },
        event: { select: { name: true } },
        voucher: true,
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.customerId !== customerId)
      throw new ApiError("Forbidden", 403);
    if (transaction.status !== TransactionStatus.WAITING_FOR_PAYMENT) {
      throw new ApiError(
        "Only transactions waiting for payment can be canceled",
        400,
      );
    }

    await this.rollbackTransaction(transactionId);

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.CANCELED },
    });

    await this.mailService.sendMail({
      to: transaction.customer.email,
      subject: "Transaksi Dibatalkan",
      templateName: "transactionCanceled",
      context: {
        customerName: transaction.customer.name,
        eventName: transaction.event.name,
        pointUsed: transaction.pointUsed > 0 ? transaction.pointUsed : null,
        voucherCode: transaction.voucher?.code || null,
      },
    });

    return updated;
  };

  // ── 4. GET MY TRANSACTIONS ────────────────────────────────
  getMyTransactions = async (customerId: string, query: GetTransactionsDTO) => {
    const {
      page = 1,
      take = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = query;

    const whereClause: Prisma.TransactionWhereInput = { customerId };
    if (status) whereClause.status = status as TransactionStatus;

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        event: {
          select: { id: true, name: true, location: true, startDate: true },
        },
        ticketType: true,
        voucher: true,
      },
    });

    const total = await this.prisma.transaction.count({ where: whereClause });
    return { data: transactions, meta: { page, take, total } };
  };

  // ── GET TRANSACTION DETAIL ────────────────────────────────
  getTransactionDetail = async (transactionId: string, customerId: string) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            startDate: true,
            endDate: true,
            imageUrl: true,
            organizer: { select: { id: true, name: true, email: true } },
          },
        },
        ticketType: true,
        voucher: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.customerId !== customerId)
      throw new ApiError("Forbidden", 403);

    return transaction;
  };

  // ── 5. ACCEPT TRANSACTION (ORGANIZER) ─────────────────────
  acceptTransaction = async (transactionId: string, organizerId: string) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          select: {
            organizerId: true,
            name: true,
            startDate: true,
            location: true,
          },
        },
        customer: { select: { name: true, email: true } },
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.event.organizerId !== organizerId)
      throw new ApiError("Forbidden", 403);
    if (
      transaction.status !== TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION
    ) {
      throw new ApiError("Transaction is not waiting for confirmation", 400);
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.DONE },
    });

    await this.mailService.sendMail({
      to: transaction.customer.email,
      subject: "🎉 Pembayaran Dikonfirmasi!",
      templateName: "transactionAccepted",
      context: {
        customerName: transaction.customer.name,
        eventName: transaction.event.name,
        eventDate: transaction.event.startDate.toLocaleString("id-ID"),
        eventLocation: transaction.event.location,
      },
    });

    return updated;
  };

  // ── 6. REJECT TRANSACTION (ORGANIZER) ─────────────────────
  rejectTransaction = async (transactionId: string, organizerId: string) => {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: { select: { organizerId: true, name: true } },
        customer: { select: { name: true, email: true } },
        voucher: true,
      },
    });

    if (!transaction) throw new ApiError("Transaction not found", 404);
    if (transaction.event.organizerId !== organizerId)
      throw new ApiError("Forbidden", 403);
    if (
      transaction.status !== TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION
    ) {
      throw new ApiError("Transaction is not waiting for confirmation", 400);
    }

    await this.rollbackTransaction(transactionId);

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.REJECTED },
    });

    await this.mailService.sendMail({
      to: transaction.customer.email,
      subject: "❌ Pembayaran Ditolak",
      templateName: "transactionRejected",
      context: {
        customerName: transaction.customer.name,
        eventName: transaction.event.name,
        pointUsed: transaction.pointUsed > 0 ? transaction.pointUsed : null,
        voucherCode: transaction.voucher?.code || null,
      },
    });

    return updated;
  };

  // ── 7. GET EVENT TRANSACTIONS (ORGANIZER) ─────────────────
  getEventTransactions = async (
    eventId: string,
    organizerId: string,
    query: GetTransactionsDTO,
  ) => {
    const {
      page = 1,
      take = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = query;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new ApiError("Event not found", 404);
    if (event.organizerId !== organizerId) throw new ApiError("Forbidden", 403);

    const whereClause: Prisma.TransactionWhereInput = { eventId };
    if (status) whereClause.status = status as TransactionStatus;

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        ticketType: true,
        voucher: true,
      },
    });

    const total = await this.prisma.transaction.count({ where: whereClause });
    return { data: transactions, meta: { page, take, total } };
  };
}
