import { Router } from "express";
import { TransactionController } from "./transaction.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { CreateTransactionDTO } from "./dto/create-transaction.dto.js";

export class TransactionRouter {
  router: Router;

  constructor(
    private transactionController: TransactionController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    const JWT = process.env.JWT_SECRET as string;
    const { verifyToken, verifyRole } = this.authMiddleware;

    // ── CUSTOMER ────────────────────────────────────────────

    // POST /transactions → buat transaksi
    this.router.post(
      "/",
      verifyToken(JWT),
      verifyRole([Role.USER]),
      this.validationMiddleware.validateBody(CreateTransactionDTO),
      this.transactionController.createTransaction
    );

    // GET /transactions/my → lihat transaksi saya
    this.router.get(
      "/my",
      verifyToken(JWT),
      verifyRole([Role.USER]),
      this.transactionController.getMyTransactions
    );

    // PATCH /transactions/:id/payment-proof → upload bukti bayar
    this.router.patch(
      "/:id/payment-proof",
      verifyToken(JWT),
      verifyRole([Role.USER]),
      this.uploadMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.transactionController.uploadPaymentProof
    );

    // PATCH /transactions/:id/cancel → cancel transaksi
    this.router.patch(
      "/:id/cancel",
      verifyToken(JWT),
      verifyRole([Role.USER]),
      this.transactionController.cancelTransaction
    );

    // ── ORGANIZER ───────────────────────────────────────────

    // GET /transactions/event/:eventId → lihat transaksi event
    this.router.get(
      "/event/:eventId",
      verifyToken(JWT),
      verifyRole([Role.ORGANIZER]),
      this.transactionController.getEventTransactions
    );

    // PATCH /transactions/:id/accept → terima transaksi
    this.router.patch(
      "/:id/accept",
      verifyToken(JWT),
      verifyRole([Role.ORGANIZER]),
      this.transactionController.acceptTransaction
    );

    // PATCH /transactions/:id/reject → tolak transaksi
    this.router.patch(
      "/:id/reject",
      verifyToken(JWT),
      verifyRole([Role.ORGANIZER]),
      this.transactionController.rejectTransaction
    );
  };

  getRouter = () => this.router;
}