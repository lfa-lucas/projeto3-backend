import express from "express";
import UserModel from "../model/user.model.js";
import TarefaModel from "../model/tarefa.model.js";
import AtividadeModel from "../model/atividade.model.js";
import DeducaoModel from "../model/deducao.model.js";
import SetorModel from "../model/setor.model.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isAuth from "../middlewares/isAuth.js";
import isGestor from "../middlewares/isGestor.js";

const router = express.Router();

router.get(
  "/all",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const data = await TarefaModel.find()
        .populate("usuario", "-passwordHash")
        .populate("atividade")
        .populate("deducao")
        .populate("setor");
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);
//criei uma nova rota para os gestores consultarrem a lista de tarefas do próprio setor
router.get(
  "/listaSetor",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      console.log(loggedUser);
      const data = await TarefaModel.find({ setor: loggedUser.setor })
        .populate("usuario", "-passwordHash")
        .populate("atividade")
        .populate("deducao")
        .populate("setor");
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.get("/lista", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;
    if (!loggedUser) {
      return response.status(404).json({ msg: "Usuário não encontrado!" });
    }
    console.log(loggedUser);
    const data = await TarefaModel.find({ usuario: loggedUser._id })
      .populate("usuario", "-passwordHash")
      .populate("atividade")
      .populate("deducao")
      .populate("setor");
    return response.status(200).json(data);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ msg: "Erro interno no servidor!" });
  }
});

router.get(
  "/usuario/:idUser",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { idUser } = request.params;
      const data = await TarefaModel.find({ usuario: idUser })
        .populate("usuario", "-passwordHash")
        .populate("atividade")
        .populate("deducao")
        .populate("setor");
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.get(
  "/detalha/:id",
  isAuth,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      const { id } = request.params;
      //esse if impedia o gestor e o admin de consultar a tarefa específica
      if (
        !loggedUser.tarefas.includes(id) &&
        loggedUser.role !== "gestor" &&
        loggedUser.role !== "admin"
      ) {
        return response
          .status(401)
          .json({ msg: "Tarefa não pertence ao usuário logado!" });
      }
      const tarefa = await TarefaModel.findById(id)
        .populate("usuario", "-passwordHash")
        .populate("atividade")
        .populate("deducao")
        .populate("setor");
      if (!tarefa) {
        return response.status(404).json({ msg: "Tarefa não foi encontrada!" });
      }

      //aqui se a tarefa não pertence ao setor do gestor, então ele não pode consultar
      if (
        loggedUser.role === "gestor" &&
        loggedUser.setor.valueOf() !== tarefa.setor.valueOf()
      ) {
        return response
          .status(403)
          .json({ msg: "Gestor não pertence ao setor da tarefa" });
      }

      return response.status(200).json(tarefa);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.post("/create", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;
    if (!loggedUser) {
      return response.status(404).json({ msg: "Usuário não encontrado!" });
    }
    //na criação da tarefa forcei o setor para ser o mesmo do usuário logado, para evitar seja criada tarefa sem setor
    const newTarefa = await TarefaModel.create({
      ...request.body,
      usuario: loggedUser._id,
      setor: loggedUser.setor,
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

      //o gestor vai precisar alterar as tarefas para validar a mesma, então deixei ele e o admin alterarem a tarefa
      if (
        !loggedUser.tarefas.includes(id) &&
        loggedUser.role !== "gestor" &&
        loggedUser.role !== "admin"
      ) {
        return response
          .status(401)
          .json({ msg: "Tarefa não pertence ao usuário logado!" });
      }

      const tarefa = await TarefaModel.findById(id);
      if (!tarefa) {
        return response.status(404).json({ msg: "Tarefa não foi encontrada!" });
      }
      //aqui se o gestor não for do setor da tarefa, ele não deixa alterar
      if (
        loggedUser.role === "gestor" &&
        loggedUser.setor.valueOf() !== tarefa.setor.valueOf()
      ) {
        return response
          .status(403)
          .json({ msg: "Gestor não pertence ao setor da tarefa" });
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
