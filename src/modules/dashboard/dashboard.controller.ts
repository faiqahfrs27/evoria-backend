import { NextFunction, Request, Response } from "express";
import { TransactionService } from "../transaction/transaction.service.js";
import { DashboardService } from "./dashboard.service.js";

// dashboard.controller.ts
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private transactionService: TransactionService, // ✅ inject service, bukan controller
  ) {}

  // GET /dashboard/events
  getOrganizerEvents = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;
      const result = await this.dashboardService.getOrganizerEvents(id);
      res.status(200).json({ message: "Events fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // GET /dashboard/statistics
  getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const result = await this.dashboardService.getStatistics(
        id,
        req.query as any,
      );
      res.status(200).json({ message: "Statistics fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // GET /dashboard/events/:eventId/attendees
  getAttendeeList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const eventId = req.params.eventId as string;
      const result = await this.dashboardService.getAttendeeList(id, eventId);
      res.status(200).json({ message: "Attendee list fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /dashboard/transactions/:transactionId/accept
  acceptTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;
      const transactionId = req.params.transactionId as string;
      const result = await this.transactionService.acceptTransaction(
        transactionId,
        id,
      );
      res.status(200).json({ message: "Transaction accepted", data: result });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /dashboard/transactions/:transactionId/reject
  rejectTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;
      const transactionId = req.params.transactionId as string;
      const result = await this.transactionService.rejectTransaction(
        transactionId,
        id,
      );
      res.status(200).json({ message: "Transaction rejected", data: result });
    } catch (error) {
      next(error);
    }
  };

  // GET /dashboard/events/:eventId/transactions
  getEventTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;
      const eventId = req.params.eventId as string;
      const result = await this.transactionService.getEventTransactions(
        eventId,
        id,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
