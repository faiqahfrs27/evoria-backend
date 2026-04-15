import express, { Express } from "express";
import { SampleRouter } from "./modules/sample/sample.router.js";
import { globalError, notFoundError } from "./utils/error.js";
import cors from "cors";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModule();
    this.errors();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private registerModule(){
    const sampleRouter = new SampleRouter;

    this.app.use("/samples", sampleRouter.getRouter());
  }

  private errors(){
    this.app.use(globalError);
    this.app.use(notFoundError);
  }

  start() {
    const PORT = process.env.PORT;
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}
