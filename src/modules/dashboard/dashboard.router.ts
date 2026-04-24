import { PrismaClient, Role } from "../../generated/prisma/client.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { DashboardController } from "./dashboard.controller.js";
import { Router } from "express";
import { GetStatisticsDTO } from "./dto/dashboard.dto.js";

export class DashboardRouter {
    router: Router;
  constructor(
    private dashboardController: DashboardController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    const organizerOnly = [
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole([Role.ORGANIZER]),
    ];

    // GET /dashboard/events
    this.router.get(
      "/events",
      ...organizerOnly,
      this.dashboardController.getOrganizerEvents,
    );

    // GET /dashboard/statistics?period=day|month|year
    this.router.get(
      "/statistics",
      ...organizerOnly,
      this.validationMiddleware.validateQuery(GetStatisticsDTO),
      this.dashboardController.getStatistics,
    );

    // GET /dashboard/events/:eventId/transactions
    this.router.get(
      "/events/:eventId/transactions",
      ...organizerOnly,
      this.dashboardController.getEventTransactions,
    );

    // PATCH /dashboard/transactions/:transactionId/accept
    this.router.patch(
      "/transactions/:transactionId/accept",
      ...organizerOnly,
      this.dashboardController.acceptTransaction,
    );

    // PATCH /dashboard/transactions/:transactionId/reject
    this.router.patch(
      "/transactions/:transactionId/reject",
      ...organizerOnly,
      this.dashboardController.rejectTransaction,
    );

    // GET /dashboard/events/:eventId/attendees
    this.router.get(
      "/events/:eventId/attendees",
      ...organizerOnly,
      this.dashboardController.getAttendeeList,
    );
  }

  getRouter = () => {
    return this.router;
  };
}
