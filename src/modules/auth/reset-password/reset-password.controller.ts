import { Request, Response } from "express";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ResetPasswordService } from "./reset-password.service.js";

export class ResetPasswordController {
  constructor(private resetPasswordService: ResetPasswordService) {}

  resetPassword = async (req: Request, res: Response) => {
    const token = req.params.token as string;

    const result = await this.resetPasswordService.resetPassword(
      token,
      req.body,
    );

    res.json(result);
  };
}
