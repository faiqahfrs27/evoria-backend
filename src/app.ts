import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Express } from "express";
import { prisma } from "./lib/prisma.js";
import { AuthMiddleware } from "./middlewares/auth.middleware.js";
import { UploadMiddleware } from "./middlewares/upload.middleware.js";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { CloudinaryService } from "./modules/cloudinary/cloudinary.service.js";
import { SampleController } from "./modules/sample/sample.controller.js";
import { SampleRouter } from "./modules/sample/sample.router.js";
import { SampleService } from "./modules/sample/sample.service.js";
import { EventController } from "./modules/event/event.controller.js";
import { EventRouter } from "./modules/event/event.router.js";
import { EventService } from "./modules/event/event.service.js";
import { globalError, notFoundError } from "./utils/error.js";

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
    this.app.use(cookieParser());
  }

  private registerModules() {
    // services
    const cloudinaryService = new CloudinaryService();
    const sampleService = new SampleService(prisma);
    const eventService = new EventService(prisma, cloudinaryService);

    // controllers
    const sampleController = new SampleController(sampleService);
    const eventController = new EventController(eventService);

    // middlewares
    const authMiddleware = new AuthMiddleware();
    const uploadMiddleware = new UploadMiddleware();
    const validationMiddleware = new ValidationMiddleware();

    // routes
    const sampleRouter = new SampleRouter(sampleController);
    const eventRouter = new EventRouter(
      eventController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware
    );

    // entry point
    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/api/events", eventRouter.getRouter());
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