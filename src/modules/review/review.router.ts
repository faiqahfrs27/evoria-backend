import { Router } from "express";
import { ReviewController } from "./review.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { CreateReviewDTO } from "./dto/create-review.dto.js";

export class ReviewRouter {
  router: Router;

  constructor(
    private reviewController: ReviewController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    const JWT = process.env.JWT_SECRET as string;

    // ── PUBLIC (tidak butuh token) ───────────────────────────

    // GET /reviews/event/:eventId → lihat review event
    this.router.get(
      "/event/:eventId",
      this.reviewController.getEventReviews
    );
    

    // GET /reviews/organizer/:organizerId → profil organizer
    this.router.get(
      "/organizer/:organizerId",
      this.reviewController.getOrganizerProfile
    );

    // ── PROTECTED (butuh token USER) ─────────────────────────

    // POST /reviews → buat review
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(JWT),
      this.authMiddleware.verifyRole([Role.USER]),
      this.validationMiddleware.validateBody(CreateReviewDTO),
      this.reviewController.createReview
    );
  };

  getRouter = () => this.router;
}