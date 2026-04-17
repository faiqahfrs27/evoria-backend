import { Router } from "express";
import { VoucherController } from "./voucher.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { CreateVoucherDTO } from "./dto/create-voucher.dto.js";
import { GetVouchersDTO } from "./dto/get-voucher.dto.js";

export class VoucherRouter {
  router: Router;

  constructor(
    private voucherController: VoucherController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = Router({ mergeParams: true }); // ← penting! biar bisa baca :eventId dari parent route
    this.initRoutes();
  }

  private initRoutes = () => {
    const JWT_SECRET = process.env.JWT_SECRET as string;

    this.router.get(
      "/",
      this.authMiddleware.verifyToken(JWT_SECRET),
      this.authMiddleware.verifyRole([Role.ORGANIZER]),
      this.validationMiddleware.validateBody(GetVouchersDTO),
      this.voucherController.getVouchers
    );

    
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(JWT_SECRET),
      this.authMiddleware.verifyRole([Role.ORGANIZER]),
      this.validationMiddleware.validateBody(CreateVoucherDTO),
      this.voucherController.createVoucher
    );


    this.router.delete(
      "/:voucherId",
      this.authMiddleware.verifyToken(JWT_SECRET),
      this.authMiddleware.verifyRole([Role.ORGANIZER]),
      this.voucherController.deleteVoucher
    );
  };

  getRouter = () => this.router;
}