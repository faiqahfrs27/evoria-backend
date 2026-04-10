import { NextFunction, Request, Response } from "express";
import { EventService } from "./event.service.js";

export class EventController {
  constructor(private eventService: EventService) {}

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, location, page, limit } = req.query;

      const result = await this.eventService.getEvents({
        search: search as string,
        category: category as string,
        location: location as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error); 
    }
  };

  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ message: "Invalid event ID" });
        return;
      }

      const event = await this.eventService.getEventById(id);
      res.status(200).json({ data: event });
    } catch (error) {
      next(error);
    }
  };
}