import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { TransactionStatus } from "../generated/prisma/client.js";
import { MailService } from "../modules/mail/mail.service.js";

const mailService = new MailService();

export const startTransactionJobs = () => {
  // Jalan setiap 5 menit
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    console.log(`[CRON] Running at ${now}`);

    // ── AUTO EXPIRE ──────────────────────────────────────────
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.WAITING_FOR_PAYMENT,
        paymentDeadline: { lt: now },
      },
      include: {
        customer: { select: { name: true, email: true } },
        event: { select: { name: true } },
        voucher: true,
      },
    });

    for (const t of expiredTransactions) {
      await prisma.$transaction(async (tx) => {
        // Rollback seats
        await tx.event.update({
          where: { id: t.eventId },
          data: { availableSeats: { increment: t.quantity } },
        });

        // Rollback ticketType quota
        if (t.ticketTypeId) {
          await tx.ticketType.update({
            where: { id: t.ticketTypeId },
            data: { quota: { increment: t.quantity } },
          });
        }

        // Rollback voucher
        if (t.voucherId) {
          await tx.voucher.update({
            where: { id: t.voucherId },
            data: { usedCount: { decrement: 1 } },
          });
        }

        // Rollback poin
        if (t.pointUsed > 0) {
          await tx.point.create({
            data: {
              userId: t.customerId,
              amount: t.pointUsed,
              source: "refund",
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Update status
        await tx.transaction.update({
          where: { id: t.id },
          data: { status: TransactionStatus.EXPIRED },
        });
      });

      // Kirim email
      await mailService.sendMail({
        to: t.customer.email,
        subject: "⏰ Transaksi Expired",
        templateName: "transactionExpired",
        context: {
          customerName: t.customer.name,
          eventName: t.event.name,
          pointUsed: t.pointUsed > 0 ? t.pointUsed : null,
          voucherCode: t.voucher?.code || null,
        },
      });

      console.log(`[CRON] Transaction ${t.id} → EXPIRED`);
    }

    // ── AUTO CANCEL ──────────────────────────────────────────
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const canceledTransactions = await prisma.transaction.findMany({
      where: {
        status: TransactionStatus.WAITING_FOR_ADMIN_CONFIRMATION,
        updatedAt: { lt: threeDaysAgo },
      },
      include: {
        customer: { select: { name: true, email: true } },
        event: { select: { name: true } },
        voucher: true,
      },
    });

    for (const t of canceledTransactions) {
      await prisma.$transaction(async (tx) => {
        await tx.event.update({
          where: { id: t.eventId },
          data: { availableSeats: { increment: t.quantity } },
        });
        if (t.ticketTypeId) {
          await tx.ticketType.update({
            where: { id: t.ticketTypeId },
            data: { quota: { increment: t.quantity } },
          });
        }
        if (t.voucherId) {
          await tx.voucher.update({
            where: { id: t.voucherId },
            data: { usedCount: { decrement: 1 } },
          });
        }
        if (t.pointUsed > 0) {
          await tx.point.create({
            data: {
              userId: t.customerId,
              amount: t.pointUsed,
              source: "refund",
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          });
        }
        await tx.transaction.update({
          where: { id: t.id },
          data: { status: TransactionStatus.CANCELED },
        });
      });

      // Kirim email
      await mailService.sendMail({
        to: t.customer.email,
        subject: "🚫 Transaksi Dibatalkan Otomatis",
        templateName: "transactionCanceled",
        context: {
          customerName: t.customer.name,
          eventName: t.event.name,
          pointUsed: t.pointUsed > 0 ? t.pointUsed : null,
          voucherCode: t.voucher?.code || null,
        },
      });

      console.log(`[CRON] Transaction ${t.id} → CANCELED`);
    }
  });

  console.log("[CRON] Transaction jobs started ✅");
};