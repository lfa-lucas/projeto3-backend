import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import connect from "./config/db.config.js";
import userRoute from "./router/user.routes.js";
import atividadeRoute from "./router/atividade.routes.js";
import setorRoute from "./router/setor.routes.js";
import deducaoRoute from "./router/deducao.routes.js";
import tarefaRoute from "./router/tarefa.routes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

connect();

app.use("/user", userRoute);
app.use("/tarefa", tarefaRoute);
app.use("/setor", setorRoute);
app.use("/deducao", deducaoRoute);
app.use("/atividade", atividadeRoute);

app.listen(Number(process.env.PORT), () =>
  console.log(`server running on port ${process.env.PORT}'`)
);
