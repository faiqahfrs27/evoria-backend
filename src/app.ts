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
import { MailService } from "./modules/mail/mail.service.js";
import { VoucherService } from "./modules/voucher/voucher.service.js";
import { VoucherController } from "./modules/voucher/voucher.controller.js";
import { VoucherRouter } from "./modules/voucher/voucher.router.js";
import { TransactionService } from "./modules/transaction/transaction.service.js";
import { TransactionController } from "./modules/transaction/transaction.controller.js";
import { TransactionRouter } from "./modules/transaction/transaction.router.js";
import { LogoutController } from "./modules/auth/logout/logout.controller.js";
import { LogoutService } from "./modules/auth/logout/logout.service.js";
import { RefreshService } from "./modules/auth/refresh-token/refresh.service.js";
import { RefreshController } from "./modules/auth/refresh-token/refresh.controller.js";
import { ForgotPasswordService } from "./modules/auth/forgot-password/forgot-password.service.js";
import { ForgotPasswordController } from "./modules/auth/forgot-password/forgot-password.controller.js";
import { ResetPasswordService } from "./modules/auth/reset-password/reset-password.service.js";
import { ResetPasswordController } from "./modules/auth/reset-password/reset-password.controller.js";
import { ReviewService } from "./modules/review/review.service.js";
import { ReviewController } from "./modules/review/review.controller.js";
import { ReviewRouter } from "./modules/review/review.router.js";

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
    const logoutService = new LogoutService(prisma);
    const refreshService = new RefreshService(prisma);
    const forgotPasswordService = new ForgotPasswordService(
      prisma,
      mailService,
    );
    const resetPasswordService = new ResetPasswordService(prisma);
    const cloudinaryService = new CloudinaryService();
    const eventService = new EventService(prisma, cloudinaryService);
    const voucherService = new VoucherService(prisma);
    const reviewService = new ReviewService(prisma);

    // Controller
    const registerController = new RegisterController(registerService);
    const loginController = new LoginController(loginService);
    const logoutController = new LogoutController(logoutService);
    const refreshController = new RefreshController(refreshService);
    const forgotPasswordController = new ForgotPasswordController(
      forgotPasswordService,
    );
    const resetPasswordController = new ResetPasswordController(resetPasswordService);
    const eventController = new EventController(eventService);
    const voucherController = new VoucherController(voucherService);
    const reviewController = new ReviewController(reviewService);

    // Middlewares
    const authMiddleware = new AuthMiddleware();
    const uploadMiddleware = new UploadMiddleware();
    const validationMiddleware = new ValidationMiddleware();

    // Routes
    const authRouter = new AuthRouter(
      registerController,
      loginController,
      logoutController,
      refreshController,
      forgotPasswordController,
      resetPasswordController,
      validationMiddleware,
      authMiddleware,
    );

    const eventRouter = new EventRouter(
      eventController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware,
    );
    
    const voucherRouter = new VoucherRouter(
      voucherController,
      authMiddleware,
      validationMiddleware,
    );

    const transactionService = new TransactionService(
      prisma,
      cloudinaryService,
      mailService,
    );
    const transactionController = new TransactionController(transactionService);
    const transactionRouter = new TransactionRouter(
      transactionController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware,
    );

    const reviewRouter = new ReviewRouter(
      reviewController,
      authMiddleware,
      validationMiddleware,
    );

    // entry point
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/events/:eventId/vouchers", voucherRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/reviews", reviewRouter.getRouter());
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
