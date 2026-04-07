import { Router } from "express";
import { UserController } from "./user.controller.js";

export class UserRouter {
  router: Router;

  constructor(private userController: UserController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post("/", this.userController.createUser);
    this.router.get("/", this.userController.getUsers);
    this.router.get("/:id", this.userController.getUserById);
  };

  getRouter = () => {
    return this.router;
  };
}