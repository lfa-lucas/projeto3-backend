import express from "express";
import TarefaModel from "../model/tarefa.model.js";
import AtividadeModel from "../model/atividade.model.js";
import DeducaoModel from "../model/deducao.model.js";
import SetorModel from "../model/setor.model.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isAuth from "../middlewares/isAuth.js";
import UserModel from "../model/user.model.js";

const router = express.Router();

router.get("/", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;
    if (!loggedUser) {
      return response.status(404).json({ msg: "Usuário não encontrado!" });
    }
    console.log(loggedUser);
    const data = await TarefaModel.find({ usuario: loggedUser._id })
      .populate("usuario")
      .populate("atividade")
      .populate("deducao");
    return response.status(200).json(data);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ msg: "Erro interno no servidor!" });
  }
});
router.get("/:id", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;
    if (!loggedUser) {
      return response.status(404).json({ msg: "Usuário não encontrado!" });
    }
    const { id } = request.params;
    if (!loggedUser.tarefas.includes(id)) {
      return response
        .status(401)
        .json({ msg: "Tarefa não pertence ao usuário logado!" });
    }
    const tarefa = await TarefaModel.findById(id)
      .populate("usuario")
      .populate("atividade")
      .populate("deducao");
    if (!tarefa) {
      return response.status(404).json("Tarefa não foi encontrada!");
    }
    return response.status(200).json(tarefa);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ msg: "Erro interno no servidor!" });
  }
});

router.post("/create", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;
    if (!loggedUser) {
      return response.status(404).json({ msg: "Usuário não encontrado!" });
    }

    const newTarefa = await TarefaModel.create({
      ...request.body,
      usuario: loggedUser._id,
    });
    await UserModel.findByIdAndUpdate(
      loggedUser._id,
      {
        $push: { tarefas: newTarefa._id },
      },
      { new: true, runValidators: true }
    );

    return response.status(201).json(newTarefa);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ msg: "Erro interno no servidor!" });
  }
});

router.put(
  "/edit/:id",
  isAuth,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      const { id } = request.params;
      if (!loggedUser.tarefas.includes(id)) {
        return response
          .status(401)
          .json({ msg: "Tarefa não pertence ao usuário logado!" });
      }
      const update = await TarefaModel.findByIdAndUpdate(
        id,
        { ...request.body },
        { new: true, runValidators: true }
      );
      return response.status(200).json(update);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.delete(
  "/delete/:id",
  isAuth,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      const { id } = request.params;
      if (!loggedUser.tarefas.includes(id)) {
        return response
          .status(401)
          .json({ msg: "Tarefa não pertence ao usuário logado!" });
      }
      const deleteTarefa = await TarefaModel.findByIdAndDelete(id);
      //retirar da array do usuario
      await UserModel.findByIdAndUpdate(
        deleteTarefa.usuario,
        {
          $pull: { tarefas: deleteTarefa._id },
        },
        { new: true, runValidators: true }
      );
      return response.status(200).json(deleteTarefa);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

export default router;
