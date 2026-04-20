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

  updateProfilePic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = res.locals.user;
 
      if (!req.file) {
        throw new ApiError("No file uploaded", 400);
      }
 
      const result = await this.profileService.updateProfilePic(id, req.file);
      res.status(200).json({ message: "Profile picture updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response) => {};
}
