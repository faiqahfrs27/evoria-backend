import { Router } from "express";
import { RegisterController } from "./register/register.controller.js";
import { LoginController } from "./login/login.controller.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { RegisterDTO } from "./dto/register.dto.js";
import { LoginDTO } from "./dto/login.dto.js";
import { LogoutController } from "./logout/logout.controller.js";
import { RefreshController } from "./refresh-token/refresh.controller.js";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto.js";
import { ForgotPasswordController } from "./forgot-password/forgot-password.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ResetPasswordDTO } from "./dto/reset-password.dto.js";
import { ResetPasswordController } from "./reset-password/reset-password.controller.js";

export class AuthRouter {
  router: Router;

  constructor(
    private registerController: RegisterController,
    private loginController: LoginController,
    private logoutController: LogoutController,
    private refreshController: RefreshController,
    private forgotPasswordController: ForgotPasswordController,
    private resetPasswordController: ResetPasswordController,
    private validationMiddleware: ValidationMiddleware,
    private authMiddleware: AuthMiddleware,
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

    this.router.post("/refresh", this.refreshController.refresh);

    this.router.post(
      "/forgot-password",
      this.validationMiddleware.validateBody(ForgotPasswordDTO),
      this.forgotPasswordController.forgotPassword,
    );

    this.router.post(
      "/reset-password",
      this.validationMiddleware.validateBody(ResetPasswordDTO),
      this.resetPasswordController.resetPassword,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
