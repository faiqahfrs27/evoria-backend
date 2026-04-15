import { Router } from "express";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";
import { EventController } from "./event.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { Role } from "../../generated/prisma/enums.js";

export class EventRouter {
  router: Router;
  private authMiddleware: AuthMiddleware;


  constructor(
    private eventController: EventController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.uploadMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateEventDTO),
      this.eventController.createEvent,
    );
  };

  getRouter = () => {
    return this.router;
  };
}


