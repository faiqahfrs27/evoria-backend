import { Router } from "express";
import { EventController } from "./event.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";
import { GetEventDTO } from "./dto/get-event.dto.js";

export class EventRouter {
  router: Router;

  constructor(
    private eventController: EventController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    const JWT_SECRET = process.env.JWT_SECRET as string;

    this.router.get(
      "/",
      this.eventController.getEvents
    );

    this.router.get("/:id", this.eventController.getEventById);

    this.router.post(
      "/",
      this.authMiddleware.verifyToken(JWT_SECRET),
      this.authMiddleware.verifyRole([Role.ORGANIZER]),
      this.uploadMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateEventDTO),
      this.eventController.createEvent
    );
  };

  getRouter = () => this.router;
}
