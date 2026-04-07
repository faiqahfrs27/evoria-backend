import { Router } from "express";
import { EventController } from "./event.controller.js";

export class EventRouter {
  router: Router;

  constructor(private eventController: EventController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post("/", this.eventController.createEvent);
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/:id", this.eventController.getEventById);
    this.router.patch("/:id", this.eventController.updateEvent);
    this.router.delete("/:id", this.eventController.deleteEvent);

    this.router.post("/:eventId/ticket-types", this.eventController.createTicketType);
    this.router.get("/:eventId/ticket-types", this.eventController.getTicketTypesByEvent);
    this.router.patch("/ticket-types/:id", this.eventController.updateTicketType);
    this.router.delete("/ticket-types/:id", this.eventController.deleteTicketType);

    this.router.post("/:eventId/vouchers", this.eventController.createVoucher);
    this.router.get("/:eventId/vouchers", this.eventController.getVouchersByEvent);
    this.router.patch("/vouchers/:id", this.eventController.updateVoucher);
    this.router.delete("/vouchers/:id", this.eventController.deleteVoucher);
  };

  getRouter = () => {
    return this.router;
  };
}