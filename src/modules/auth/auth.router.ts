import { Router } from "express";
import { RegisterController } from "./register/register.controller.js";
import { LoginController } from "./login/login.controller.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { RegisterDTO } from "./dto/register.dto.js";
import { LoginDTO } from "./dto/login.dto.js";
import { LogoutController } from "./logout/logout.controller.js";

export class AuthRouter {
  router: Router;

  constructor(
    private registerController: RegisterController,
    private loginController: LoginController,
    private logoutController: LogoutController,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post(
      "/register",
      this.validationMiddleware.validateBody(RegisterDTO),
      this.registerController.register,
    );

    this.router.post(
      "/login",
      this.validationMiddleware.validateBody(LoginDTO),
      this.loginController.login,
    );

    this.router.post("/logout", this.logoutController.logout);
  };

  getRouter = () => {
    return this.router;
  };
}
