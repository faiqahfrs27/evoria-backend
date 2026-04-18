import "reflect-metadata";
import dotenv from "dotenv";
import { App } from "./app.js";


dotenv.config();

const main = () => {
    const app = new App();
    app.start();
};

main();