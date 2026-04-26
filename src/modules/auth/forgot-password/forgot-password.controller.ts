import { Request, Response } from "express";
import { ForgotPasswordService } from "./forgot-password.service.js";

export class ForgotPasswordController{
    constructor(private forgotPasswordService: ForgotPasswordService){}

    forgotPassword = async (req: Request, res: Response) => {
    const result = await this.forgotPasswordService.forgotPassword(req.body);
    res.status(200).send(result);
  };
}