import { NextFunction, Request, Response } from "express";
import { LoginService } from "./login.service.js";

export class LoginController {
  constructor(private loginService: LoginService) {}

  login = async(req: Request, res: Response, next: NextFunction) => {
    try{
      const result = await this.loginService.login(req.body);

      res.status(200).json({
        message: "Login Success",
        data: result,
      });
    } catch(err){
      next(err)
    }
  }
}
