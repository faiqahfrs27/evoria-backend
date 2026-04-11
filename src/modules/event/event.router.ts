import { Router } from "express";
import { EventController } from "./event.controller.js";

export class EventRouter {
  router: Router;

  constructor(private eventController: EventController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/:id", this.eventController.getEventById);
  };

  getRouter = () => {
    return this.router;
  };
}