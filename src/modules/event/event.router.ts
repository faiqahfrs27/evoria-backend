import { Router } from "express";
import { EventController } from "./event.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { Role } from "../../generated/prisma/enums.js";

export class EventRouter {
  router: Router;
  private authMiddleware: AuthMiddleware;


  constructor(private eventController: EventController) {
    this.router = Router();
    this.authMiddleware = new AuthMiddleware();
    this.initRoutes();
  }

  private initRoutes = () => {
    const { verifyToken, verifyRole } = this.authMiddleware;
    const JWT_SECRET = process.env.JWT_SECRET as string;

    this.router.get("/", this.eventController.getEvents);
    this.router.get("/:id", this.eventController.getEventById);
  
     this.router.post(
      "/",
      verifyToken(JWT_SECRET),
      verifyRole([Role.ORGANIZER]),
      this.eventController.createEvent
    );
    this.router.put(
      "/:id",
      verifyToken(JWT_SECRET),
      verifyRole([Role.ORGANIZER]),
      this.eventController.updateEvent
    );
    this.router.delete(
      "/:id",
      verifyToken(JWT_SECRET),
      verifyRole([Role.ORGANIZER]),
      this.eventController.deleteEvent
    );
  };

  getRouter = () => {
    return this.router;
  };
}

