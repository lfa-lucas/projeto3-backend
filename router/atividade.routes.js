import express from "express";
import SetorModel from "../model/setor.model.js";
import AtividadeModel from "../model/atividade.model.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isGestor from "../middlewares/isGestor.js";
import isAuth from "../middlewares/isAuth.js";
import UserModel from "../model/user.model.js";

const router = express.Router();

router.get("/", isAuth, attachCurrentUser, async (request, response) => {
  try {
    const loggedUser = request.currentUser;

    let data = [];
    if (loggedUser.role === "gestor" || loggedUser.role === "usuario") {
      data = await AtividadeModel.find({
        setor: loggedUser.setor,
      }).populate("setor");
    } else {
      data = await AtividadeModel.find().populate("setor");
    }
    return response.status(200).json(data);
  } catch (error) {
    console.log(error);
    return response.status(500).json({ msg: "Erro interno no servidor!" });
  }
});
router.get(
  "/:id",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const loggedUser = request.currentUser;

      const atividade = await AtividadeModel.findById(id).populate("setor");

      if (!atividade) {
        return response
          .status(404)
          .json({ msg: "Atividade não foi encontrada!" });
      }
      if (
        loggedUser.setor.valueOf() !== atividade.setor._id.valueOf() &&
        loggedUser.role !== "admin"
      ) {
        return response
          .status(401)
          .json({ msg: "Atividade não pertence ao setor do usuário logado!" });
      }
      return response.status(200).json(atividade);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.post(
  "/create/:idSetor",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { idSetor } = request.params;
      const loggedUser = request.currentUser;

      if (
        loggedUser.role === "gestor" &&
        loggedUser.setor.valueOf() !== idSetor
      ) {
        return response.status(403).json({
          msg: "Setor da requisição difere do setor do gestor logado!",
        });
      }
      const newAtividade = await AtividadeModel.create({
        ...request.body,
        setor: idSetor,
      });
      //inserir na array do setor
      await SetorModel.findByIdAndUpdate(
        idSetor,
        {
          $push: { atividades: newAtividade._id },
        },
        { new: true, runValidators: true }
      );
      return response.status(201).json(newAtividade);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.put(
  "/edit/:id",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const loggedUser = request.currentUser;

      const atividade = await AtividadeModel.findById(id);
      if (!atividade) {
        return response
          .status(404)
          .json({ msg: "Atividade não foi encontrada!" });
      }
      if (
        loggedUser.setor.valueOf() !== atividade.setor.valueOf() &&
        loggedUser.role !== "admin"
      ) {
        return response.status(403).json({
          msg: "Setor da requisição difere do setor do usuário logado!",
        });
      }
      const update = await AtividadeModel.findByIdAndUpdate(
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
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const loggedUser = request.currentUser;

      const atividade = await AtividadeModel.findById(id);
      if (!atividade) {
        return response
          .status(404)
          .json({ msg: "Atividade não foi encontrada!" });
      }
      if (
        loggedUser.setor.valueOf() !== atividade.setor.valueOf() &&
        loggedUser.role !== "admin"
      ) {
        return response.status(401).json({
          msg: "Setor da requisição difere do setor do usuário logado!",
        });
      }
      const deleteAtividade = await AtividadeModel.findByIdAndDelete(id);
      //retirar do array do setor
      await SetorModel.findByIdAndUpdate(
        deleteAtividade.setor,
        {
          $pull: { atividades: deleteAtividade._id },
        },
        { new: true, runValidators: true }
      );
      return response.status(200).json(deleteAtividade);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

export default router;
