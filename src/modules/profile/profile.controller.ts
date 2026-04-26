import { NextFunction, Request, Response } from "express";
import { ProfileService } from "./profile.service.js";
import { ApiError } from "../../utils/api-error.js";

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const result = await this.profileService.getProfile(id);
      res.status(200).json({ message: "Profile fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const result = await this.profileService.updateProfile(id, req.body);
      res.status(200).json({ message: "Profile Updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  updateProfilePic = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;

      if (!req.file) {
        throw new ApiError("No file uploaded", 400);
      }

      const result = await this.profileService.updateProfilePic(id, req.file);
      res
        .status(200)
        .json({ message: "Profile picture updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      await this.profileService.changePassword(id, req.body);
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  };

  getMyPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const result = await this.profileService.getMyPoints(id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  getMyVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const result = await this.profileService.getMyVouchers(id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  getMyTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = res.locals.user;
      const result = await this.profileService.getMyTransactions(id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
      const { code } = req.body;
      const result = await this.profileService.validateCoupon(id, code);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}
