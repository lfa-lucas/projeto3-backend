import express from "express";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.listen(Number(process.env.PORT), () =>
  console.log(`server running on port ${process.env.PORT}!'`)
);
