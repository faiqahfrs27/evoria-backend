import { LogoutService } from "./logout.service.js";
import { cookieOptions } from "../../../config/cookie.js";
import { Request, Response } from "express";

export class LogoutController {
  constructor(private logoutService: LogoutService) {}

  logout = async (req: Request, res: Response) => {
    const result = await this.logoutService.logout(req.cookies.refreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).send({ result });
  };
}
