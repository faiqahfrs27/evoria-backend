import express, { Express } from "express";
import { SampleRouter } from "./modules/sample/sample.router.js";
import { globalError, notFoundError } from "./utils/error.js";
import cors from "cors";
import { SampleService } from "./modules/sample/sample.service.js";
import { SampleController } from "./modules/sample/sample.controller.js";
import { prisma } from "./lib/prisma.js";
import { RegisterService } from "./modules/auth/register/register.service.js";
import { RegisterController } from "./modules/auth/register/register.controller.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { LoginController } from "./modules/auth/login/login.controller.js";
import { LoginService } from "./modules/auth/login/login.service.js";

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
    // services
    const sampleService = new SampleService(prisma);

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