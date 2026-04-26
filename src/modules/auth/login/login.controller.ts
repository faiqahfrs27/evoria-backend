import { NextFunction, Request, Response } from "express";
import { LoginService } from "./login.service.js";
import { cookieOptions } from "../../../config/cookie.js";

export class LoginController {
  constructor(private loginService: LoginService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, accessToken, refreshToken } = await this.loginService.login(
        req.body,
      );

      res.cookie("accessToken", accessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);

      res.status(200).send({user});
    } catch (err) {
      next(err);
    }
  };
}
