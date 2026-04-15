import { Router } from "express";
import { SampleController } from "./sample.controller.js";

export class SampleRouter {
  router: Router;

  constructor(private sampleController: SampleController) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get("/", this.sampleController.getSamples);
    this.router.get("/:id", this.sampleController.getSample);
  };

  getRouter = () => {
    return this.router;
  };
}