import { NextFunction, Request, Response } from "express";
import { TransactionService } from "./transaction.service.js";

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  createTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = res.locals.user.id;
      const result = await this.transactionService.createTransaction(
        customerId,
        req.body,
      );
      res.status(201).json({ message: "Transaction created", data: result });
    } catch (error) {
      next(error);
    }
  };

  uploadPaymentProof = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = res.locals.user.id;
      const transactionId = req.params.id as string;

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const paymentProof = files?.paymentProof?.[0];

      if (!paymentProof) {
        res.status(400).json({ message: "Payment proof file is required" });
        return;
      }

      const result = await this.transactionService.uploadPaymentProof(
        transactionId,
        customerId,
        paymentProof,
      );
      res.status(200).json({ message: "Payment proof uploaded", data: result });
    } catch (error) {
      next(error);
    }
  };

  cancelTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = res.locals.user.id;
      const transactionId = req.params.id as string;
      const result = await this.transactionService.cancelTransaction(
        transactionId,
        customerId,
      );
      res.status(200).json({ message: "Transaction canceled", data: result });
    } catch (error) {
      next(error);
    }
  };

  getMyTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = res.locals.user.id;
      const result = await this.transactionService.getMyTransactions(
        customerId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getTransactionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const customerId = res.locals.user.id;
      const transactionId = req.params.id as string;

      const result = await this.transactionService.getTransactionDetail(
        transactionId,
        customerId,
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  acceptTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const organizerId = res.locals.user.id;
      const transactionId = req.params.id as string;
      const result = await this.transactionService.acceptTransaction(
        transactionId,
        organizerId,
      );
      res.status(200).json({ message: "Transaction accepted", data: result });
    } catch (error) {
      next(error);
    }
  };

  rejectTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const organizerId = res.locals.user.id;
      const transactionId = req.params.id as string;
      const result = await this.transactionService.rejectTransaction(
        transactionId,
        organizerId,
      );
      res.status(200).json({ message: "Transaction rejected", data: result });
    } catch (error) {
      next(error);
    }
  };

  getEventTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const organizerId = res.locals.user.id;
      const eventId = req.params.eventId as string;
      const result = await this.transactionService.getEventTransactions(
        eventId,
        organizerId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
