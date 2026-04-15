import { Router } from "express";
import { RegisterController } from "./register/register.controller.js";
import { LoginController } from "./login/login.controller.js";

export class AuthRouter {
  router: Router;

  constructor(
    private registerController: RegisterController,
    private loginController: LoginController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post("/register", this.registerController.createUser);
    this.router.post("/login", this.loginController.login);
  };

  getRouter = () => {
    return this.router;
  };
}
