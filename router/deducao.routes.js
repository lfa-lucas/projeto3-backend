import express from "express";
import SetorModel from "../model/setor.model.js";
import AtividadeModel from "../model/atividade.model.js";
import DeducaoModel from "../model/deducao.model.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isGestor from "../middlewares/isGestor.js";
import isAuth from "../middlewares/isAuth.js";
const router = express.Router();

router.get(
  "/",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      let data = [];
      if (loggedUser.role === "gestor") {
        data = await DeducaoModel.find({
          setor: loggedUser.setor,
        }).populate("setor");
      } else {
        data = await DeducaoModel.find().populate("setor");
      }
      return response.status(200).json(data);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);
router.get(
  "/:id",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }

      const deducao = await DeducaoModel.findById(id).populate("setor");

      if (
        loggedUser.setor !== deducao.setor._id &&
        loggedUser.role !== "admin"
      ) {
        return response
          .status(401)
          .json({ msg: "Dedução não pertence ao setor do usuário logado!" });
      }
      if (!deducao) {
        return response.status(404).json("Dedução não foi encontrada!");
      }
      return response.status(200).json(deducao);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.post(
  "/create/:idSetor",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { idSetor } = request.params;
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      // if (loggedUser.role === "gestor" && loggedUser.setor !== idSetor) {
      //   return response.status(401).json({
      //     msg: "Setor da requisição difere do setor do gestor logado!",
      //   });
      // }
      const newDeducao = await DeducaoModel.create({
        ...request.body,
        setor: idSetor,
      });
      //inserir na array do setor
      await SetorModel.findByIdAndUpdate(
        idSetor,
        {
          $push: { deducoes: newDeducao._id },
        },
        { new: true, runValidators: true }
      );
      return response.status(201).json(newDeducao);
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
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      const deducao = await DeducaoModel.findById(id);
      if (loggedUser.setor !== deducao.setor && loggedUser.role !== "admin") {
        return response.status(401).json({
          msg: "Setor da requisição difere do setor do usuário logado!",
        });
      }
      const update = await DeducaoModel.findByIdAndUpdate(
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
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      const deducao = await DeducaoModel.findById(id);
      if (loggedUser.setor !== deducao.setor && loggedUser.role !== "admin") {
        return response.status(401).json({
          msg: "Setor da requisição difere do setor do usuário logado!",
        });
      }
      const deleteDeducao = await DeducaoModel.findByIdAndDelete(id);
      //retirar do array do setor
      await SetorModel.findByIdAndUpdate(
        deleteDeducao.setor,
        {
          $pull: { deducoes: deleteDeducao._id },
        },
        { new: true, runValidators: true }
      );
      return response.status(200).json(deleteDeducao);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

export default router;
