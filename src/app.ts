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
import { RegisterService } from "./modules/auth/register/register.service.js";
import { RegisterController } from "./modules/auth/register/register.controller.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { LoginController } from "./modules/auth/login/login.controller.js";
import { LoginService } from "./modules/auth/login/login.service.js";
import "reflect-metadata";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { MailService } from "./modules/mail/mail.service.js";

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
    const sampleService = new SampleService(prisma);

    // controllers
    const sampleController = new SampleController(sampleService);

    // routes
    const sampleRouter = new SampleRouter(sampleController);

    // Services
    const mailService = new MailService();
    const registerService = new RegisterService(prisma, mailService);
    const loginService = new LoginService(prisma);
    const cloudinaryService = new CloudinaryService();
    const eventService = new EventService(prisma, cloudinaryService);

    // Controller
    const registerController = new RegisterController(registerService);
    const loginController = new LoginController(loginService);
    const eventController = new EventController(eventService);

    // Middlewares
    const authMidlleware = new AuthMiddleware();
    const authMiddleware = new AuthMiddleware();
    const uploadMiddleware = new UploadMiddleware();
    const validationMiddleware = new ValidationMiddleware();

    // Routes
    const authRouter = new AuthRouter(
      registerController,
      loginController,
      validationMiddleware,
    );
    const eventRouter = new EventRouter(
      eventController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware,
    );

    // entry point
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/api/events", eventRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
  }

  private errors() {
    this.app.use(globalError);
    this.app.use(notFoundError);
  }

  start() {
    const PORT = Number(process.env.PORT) || 8000;

    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}
