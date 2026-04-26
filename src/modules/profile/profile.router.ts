import { Router } from "express";
import { PrismaClient } from "../../generated/prisma/client.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { ChangePasswordDTO, UpdateProfileDTO } from "./dto/profile.dto.js";
import { ProfileController } from "./profile.controller.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";

export class ProfileRouter {
  router: Router;

  constructor(
    private profileController: ProfileController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.profileController.getProfile,
    );

    this.router.put(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.validationMiddleware.validateBody(UpdateProfileDTO),
      this.profileController.updateProfile,
    );

    this.router.patch(
      "/picture",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.uploadMiddleware.upload().single("profilePic"),
      this.profileController.updateProfilePic,
    );

    this.router.put(
      "/change-password",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.validationMiddleware.validateBody(ChangePasswordDTO),
      this.profileController.changePassword,
    );

    this.router.get(
      "/points",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.profileController.getMyPoints,
    );

    this.router.get(
      "/vouchers",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.profileController.getMyVouchers,
    );
    
    this.router.get(
      "/transactions",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.profileController.getMyTransactions,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
