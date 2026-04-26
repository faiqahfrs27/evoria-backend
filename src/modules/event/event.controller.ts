import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { GetEventDTO } from "./dto/get-event.dto.js";
import { EventService } from "./event.service.js";

export class EventController {
  constructor(private eventService: EventService) {}

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(GetEventDTO, req.query);
      const result = await this.eventService.getEvent(query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const event = await this.eventService.getEventById(id);
      res.status(200).json({ data: event });
    } catch (error) {
      next(error);
    }
  };

 getEventBySlug = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await this.eventService.getEventBySlug(slug);
  res.status(200).send(result);
};


  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const thumbnail = files?.thumbnail?.[0];

      if (!thumbnail) {
        res.status(400).json({ message: "Thumbnail is required" });
        return;
      }

      const organizerId = res.locals.user.id;

      const result = await this.eventService.createEvent(
        body,
        thumbnail,
        organizerId,
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const eventId = req.params.eventId as string;
      const file = req.file as Express.Multer.File | undefined;
      const result = await this.eventService.updateEvent(
        eventId,
        id,
        req.body,
        file,
      );
      res.status(200).json({ message: "Event updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const eventId = req.params.eventId as string;
      const result = await this.eventService.deleteEvent(eventId, id);
      res.status(200).json({ message: "Event deleted", data: result });
    } catch (error) {
      next(error);
    }
  };
}
