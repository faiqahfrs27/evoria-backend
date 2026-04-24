import { NextFunction, Request, Response } from "express";
import { EventService } from "./event.service.js";
import { plainToInstance } from "class-transformer";
import { GetEventDTO } from "./dto/get-event.dto.js";

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
}
