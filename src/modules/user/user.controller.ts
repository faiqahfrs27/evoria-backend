import { Request, Response } from "express";
import { UserService } from "./user.service.js";

export class UserController {
  constructor(private userService: UserService) {}

  createUser = async (req: Request, res: Response) => {
    const result = await this.userService.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });

    res.status(201).send(result);
  };

  getUsers = async (_req: Request, res: Response) => {
    const result = await this.userService.getUsers();
    res.status(200).send(result);
  };

  getUserById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.userService.getUserById(id);
    res.status(200).send(result);
  };
}