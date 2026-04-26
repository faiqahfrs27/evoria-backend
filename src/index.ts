import "reflect-metadata";
import dotenv from "dotenv";
import { App } from "./app.js";
import { startTransactionJobs } from "./jobs/transaction.job.js";

dotenv.config();

dotenv.config();

const main = () => {
    const app = new App();
    app.start();
};

main();