import { Request, Response } from "express";
import { EventService } from "./event.service.js";

export class EventController {
  constructor(private eventService: EventService) {}

  createEvent = async (req: Request, res: Response) => {
    const result = await this.eventService.createEvent({
      organizerId: Number(req.body.organizerId),
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      city: req.body.city,
      startAt: new Date(req.body.startAt),
      endAt: new Date(req.body.endAt),
      status: req.body.status,
    });

    res.status(201).send(result);
  };

  getEvents = async (req: Request, res: Response) => {
    const result = await this.eventService.getEvents({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      city: req.query.city as string | undefined,
      status: req.query.status as any,
    });

    res.status(200).send(result);
  };

  getEventById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.eventService.getEventById(id);

    res.status(200).send(result);
  };

  updateEvent = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const result = await this.eventService.updateEvent(id, {
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      city: req.body.city,
      startAt: req.body.startAt ? new Date(req.body.startAt) : undefined,
      endAt: req.body.endAt ? new Date(req.body.endAt) : undefined,
      status: req.body.status,
    });

    res.status(200).send(result);
  };

  deleteEvent = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.eventService.deleteEvent(id);

    res.status(200).send(result);
  };

  createTicketType = async (req: Request, res: Response) => {
    const eventId = Number(req.params.eventId);

    const result = await this.eventService.createTicketType({
      eventId,
      name: req.body.name,
      price: Number(req.body.price),
      quota: Number(req.body.quota),
    });

    res.status(201).send(result);
  };

  getTicketTypesByEvent = async (req: Request, res: Response) => {
    const eventId = Number(req.params.eventId);
    const result = await this.eventService.getTicketTypesByEvent(eventId);

    res.status(200).send(result);
  };

  updateTicketType = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const result = await this.eventService.updateTicketType(id, {
      name: req.body.name,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      quota: req.body.quota !== undefined ? Number(req.body.quota) : undefined,
    });

    res.status(200).send(result);
  };

  deleteTicketType = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.eventService.deleteTicketType(id);

    res.status(200).send(result);
  };

  createVoucher = async (req: Request, res: Response) => {
    const eventId = Number(req.params.eventId);

    const result = await this.eventService.createVoucher({
      eventId,
      code: req.body.code,
      discountAmount: Number(req.body.discountAmount),
      quota: Number(req.body.quota),
      startAt: new Date(req.body.startAt),
      endAt: new Date(req.body.endAt),
    });

    res.status(201).send(result);
  };

  getVouchersByEvent = async (req: Request, res: Response) => {
    const eventId = Number(req.params.eventId);
    const result = await this.eventService.getVouchersByEvent(eventId);

    res.status(200).send(result);
  };

  updateVoucher = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const result = await this.eventService.updateVoucher(id, {
      code: req.body.code,
      discountAmount:
        req.body.discountAmount !== undefined
          ? Number(req.body.discountAmount)
          : undefined,
      quota: req.body.quota !== undefined ? Number(req.body.quota) : undefined,
      startAt: req.body.startAt ? new Date(req.body.startAt) : undefined,
      endAt: req.body.endAt ? new Date(req.body.endAt) : undefined,
      isActive: req.body.isActive,
    });

    res.status(200).send(result);
  };

  deleteVoucher = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.eventService.deleteVoucher(id);

    res.status(200).send(result);
  };
}
