import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Express } from "express";
import { prisma } from "./lib/prisma.js";
import { AuthMiddleware } from "./middlewares/auth.middleware.js";
import { UploadMiddleware } from "./middlewares/upload.middleware.js";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { CloudinaryService } from "./module/cloudinary/cloudinary.service.js";
import { SampleController } from "./module/sample/sample.controller.js";
import { SampleRouter } from "./module/sample/sample.router.js";
import { SampleService } from "./module/sample/sample.service.js";
import { EventController } from "./module/event/event.controller.js";
import { EventRouter } from "./module/event/event.router.js";
import { EventService } from "./module/event/event.service.js";
import { globalError, notFoundError } from "./utils/error.js";
import { RegisterService } from "./module/auth/register/register.service.js";
import { RegisterController } from "./module/auth/register/register.controller.js";
import { AuthRouter } from "./module/auth/auth.router.js";
import { LoginController } from "./module/auth/login/login.controller.js";
import { LoginService } from "./module/auth/login/login.service.js";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModule();
    this.errors();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  
  private registerModule() {
    // services
    const cloudinaryService = new CloudinaryService();
    const sampleService = new SampleService(prisma);
    const eventService = new EventService(prisma, cloudinaryService);

    // controllers
    const sampleController = new SampleController(sampleService);

    // routes
    const sampleRouter = new SampleRouter(sampleController);

    // Auth Services
    const registerService = new RegisterService(prisma);
    const loginService = new LoginService(prisma);

    // Auth Controller
    const registerController = new RegisterController(registerService);
    const loginController = new LoginController(loginService);

    
    // Auth Routes (Register, Login)
    const authRouter = new AuthRouter(registerController, loginController);

    // entry point
    this.app.use("/api/auth", authRouter.getRouter());
    this.app.use("/samples", sampleRouter.getRouter());
    

    // Event controllers
    const eventController = new EventController(eventService);

    // middlewares
    const authMiddleware = new AuthMiddleware();
    const uploadMiddleware = new UploadMiddleware();
    const validationMiddleware = new ValidationMiddleware();

    // Event Routes
    const eventRouter = new EventRouter(
      eventController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware
    );

    // entry point
    this.app.use("/api/events", eventRouter.getRouter());
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
