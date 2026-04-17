import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { EventService } from "./event.service.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";

export class EventController {
  constructor(private eventService: EventService) {}

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
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

  createEvent = async (req: Request, res: Response) => {
    const body = plainToInstance(CreateEventDTO, req.body);

    const errors = await validate(body);
    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();

      throw new ApiError(messages.join(", "), 400);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files?.thumbnail?.[0];

    if (!thumbnail) throw new ApiError("thumbnail is required", 400);

    const organizerId = res.locals.user.id;

    const result = await this.eventService.createEvent(
      body,
      thumbnail,
      organizerId,
    );

    res.status(200).send(result);
  };
}
