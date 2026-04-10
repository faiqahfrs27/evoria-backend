import cors from "cors";
import express, { Express } from "express";
import { prisma } from "./lib/prisma.js";
import { SampleController } from "./modules/sample/sample.controller.js";
import { SampleRouter } from "./modules/sample/sample.router.js";
import { SampleService } from "./modules/sample/sample.service.js";
import { EventController } from "./modules/event/event.controller.js";
import { EventRouter } from "./modules/event/event.router.js";
import { EventService } from "./modules/event/event.service.js";
import { globalError, notFoundError } from "./utils/error.js";
import cookieParser from "cookie-parser";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModules();
    this.errors();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(cookieParser())
  }

  private registerModules() {
    const sampleService = new SampleService(prisma);
    const sampleController = new SampleController(sampleService);
    const sampleRouter = new SampleRouter(sampleController);
    this.app.use("/samples", sampleRouter.getRouter());

    const eventService = new EventService(prisma);
    const eventController = new EventController(eventService);
    const eventRouter = new EventRouter(eventController);
    this.app.use("/events", eventRouter.getRouter());
  }

  private errors() {
    this.app.use(globalError);
    this.app.use(notFoundError);
  }

  start() {
    const PORT = process.env.PORT;
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}