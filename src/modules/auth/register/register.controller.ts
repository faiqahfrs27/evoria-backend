import { Request, Response } from "express";
import { RegisterService } from "./register.service.js";

export class RegisterController {
  constructor(private registerService: RegisterService) {}

  createUser = async (req: Request, res: Response) => {
    const result = await this.registerService.register(req.body);
    res.status(200).send(result);
  };
}
