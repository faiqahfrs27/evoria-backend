import { Request, Response } from "express";
import { cookieOptions } from "../../../config/cookie.js";
import { RefreshService } from "./refresh.service.js";

export class RefreshController{
    constructor(private refreshService: RefreshService){}

    refresh = async (req: Request, res: Response) => {
    const result = await this.refreshService.refresh(req.cookies.refreshToken);
    
    res.cookie("accessToken", result.accessToken, cookieOptions);
    
    
    res.status(200).send({ message: "Refresh success" });
  };
}