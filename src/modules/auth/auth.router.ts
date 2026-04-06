import { Router } from "express";
import { RegisterController } from "./register/register.controller.js";

export class AuthRouter{
    router: Router;

    constructor(private registerController: RegisterController){
        this.router = Router();
        this.initRoutes();
    }

    private initRoutes = () => {
        this.router.post("/register", this.registerController.createUser);
        
    }

    getRouter = () => {
        return this.router;
    }
}