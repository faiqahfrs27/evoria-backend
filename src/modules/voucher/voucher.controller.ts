import { NextFunction, Request, Response } from "express";
import { VoucherService } from "./voucher.service.js";

export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  // GET /api/events/:eventId/vouchers
  getVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId as string;
      const query = req.query;

      const result = await this.voucherService.getVouchers(
        eventId,
        query as any
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // POST /api/events/:eventId/vouchers
  createVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId as string;
      const organizerId = res.locals.user.id;
      const body = req.body;

      const result = await this.voucherService.createVoucher(
        eventId,
        organizerId,
        body
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/events/:eventId/vouchers/:voucherId
  deleteVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voucherId = req.params.voucherId as string;
      const organizerId = res.locals.user.id;

      const result = await this.voucherService.deleteVoucher(
        voucherId,
        organizerId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}