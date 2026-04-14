import { Router } from "express";
import { RegisterController } from "./register/register.controller.js";
import { LoginController } from "./login/login.controller.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { RegisterDTO } from "./dto/register.dto.js";
import { LoginDTO } from "./dto/login.dto.js";

export class AuthRouter {
  router: Router;

  constructor(
    private registerController: RegisterController,
    private loginController: LoginController,
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
  };

  getRouter = () => {
    return this.router;
  };
}
