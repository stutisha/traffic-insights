import express from "express";
import router from "./modules/traffic/traffic.routes";

const app = express();

app.use(express.json());
app.use("/api/traffic", router);

export default app;