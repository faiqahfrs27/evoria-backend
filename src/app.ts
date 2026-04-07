import express, { Express } from "express";
import { SampleRouter } from "./modules/sample/sample.router.js";
import { globalError, notFoundError } from "./utils/error.js";
import cors from "cors";
import { EventService } from "./modules/event/event.service.js";
import { EventController } from "./modules/event/event.controller.js";
import { EventRouter } from "./modules/event/event.router.js";
import { prisma } from "./lib/prisma.js";
import { UserRouter } from "./modules/user/user.router.js";
import { UserController } from "./modules/user/user.controller.js";
import { UserService } from "./modules/user/user.service.js";

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
  }

  private registerModule() {
    const userService = new UserService(prisma);
    const userController = new UserController(userService);
    const userRouter = new UserRouter(userController);

    const eventService = new EventService(prisma);
    const eventController = new EventController(eventService);
    const eventRouter = new EventRouter(eventController);

    this.app.use("/users", userRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
  }

  private errors(){
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
