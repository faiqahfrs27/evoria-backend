import { NextFunction, Request, Response } from "express";
import { ReviewService } from "./review.service.js";

export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // POST /reviews
  createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = res.locals.user.id;
      const result = await this.reviewService.createReview(
        customerId,
        req.body
      );
      res.status(201).json({
        message: "Review created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /reviews/event/:eventId
  getEventReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId as string;
      const result = await this.reviewService.getEventReviews(eventId);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  // GET /reviews/organizer/:organizerId
  getOrganizerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const organizerId = req.params.organizerId as string;
      const result = await this.reviewService.getOrganizerProfile(organizerId);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}