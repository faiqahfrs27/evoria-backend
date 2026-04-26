import { PrismaClient, Role } from "../../generated/prisma/client.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { DashboardController } from "./dashboard.controller.js";
import { Router } from "express";
import { GetStatisticsDTO } from "./dto/dashboard.dto.js";
import { ProfileController } from "../profile/profile.controller.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import {
  ChangePasswordDTO,
  UpdateProfileDTO,
} from "../profile/dto/profile.dto.js";

export class DashboardRouter {
  router: Router;
  constructor(
    private dashboardController: DashboardController,
    private profileController: ProfileController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
    private uploadMiddleware: UploadMiddleware,
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

    // GET /dashboard/organizer/profile
    this.router.get(
      "/organizer/profile",
      ...organizerOnly,
      this.profileController.getProfile,
    );

    // PUT /dashboard/organizer/profile
    this.router.put(
      "/organizer/profile",
      ...organizerOnly,
      this.validationMiddleware.validateBody(UpdateProfileDTO),
      this.profileController.updateProfile,
    );

    // PATCH /dashboard/organizer/profile/picture
    this.router.patch(
      "/organizer/profile/picture",
      ...organizerOnly,
      this.uploadMiddleware.upload().single("profilePic"),
      this.profileController.updateProfilePic,
    );

    // PUT /dashboard/organizer/change-password
    this.router.put(
      "/organizer/profile/change-password",
      ...organizerOnly,
      this.validationMiddleware.validateBody(ChangePasswordDTO),
      this.profileController.changePassword,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
