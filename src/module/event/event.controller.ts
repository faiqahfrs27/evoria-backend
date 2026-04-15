import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { EventService } from "./event.service.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";

export class EventController {
  constructor(private eventService: EventService) {}

  createEvent = async (req: Request, res: Response) => {
    const body = plainToInstance(CreateEventDTO, req.body);

    const errors = await validate(body);
    if (errors.length > 0) {
      throw new ApiError("validation failed", 400);
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