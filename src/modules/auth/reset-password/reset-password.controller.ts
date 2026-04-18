import { Request, Response } from "express";
import { ResetPasswordService } from "./reset-password.service.js";

export class ResetPasswordController{
    constructor(private resetPasswordService: ResetPasswordService){}

   resetPassword = async (req: Request, res: Response) => {
    const result = await this.resetPasswordService.resetPassword(req.body);
    res.status(200).send(result);
  };
}