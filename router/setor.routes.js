import express from "express";
import SetorModel from "../model/setor.model.js";
import AtividadeModel from "../model/atividade.model.js";
import DeducaoModel from "../model/deducao.model.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isGestor from "../middlewares/isGestor.js";
import isAuth from "../middlewares/isAuth.js";
import UserModel from "../model/user.model.js";

const router = express.Router();

router.get(
  "/",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const loggedUser = request.currentUser;
      if (!loggedUser) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }

      const data = await SetorModel.find()
        .populate("usuarios")
        .populate("chefe")
        .populate("substituto")
        .populate("atividades")
        .populate("deducoes");
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
      if (
        loggedUser.setor !== id &&
        loggedUser.role !== "admin" &&
        loggedUser.role !== "gestor"
      ) {
        return response
          .status(401)
          .json({ msg: "Setor não pertence ao usuário logado!" });
      }
      const setor = await SetorModel.findById(id)
        .populate("usuarios")
        .populate("chefe")
        .populate("substituto")
        .populate("atividades")
        .populate("deducoes");
      if (!setor) {
        return response.status(404).json("Setor não foi encontrado!");
      }
      return response.status(200).json(setor);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.post(
  "/create",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const newSetor = await SetorModel.create(request.body);
      return response.status(201).json(newSetor);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.put(
  "/edit/:id",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const update = await SetorModel.findByIdAndUpdate(
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
router.put(
  "/insertUser/:idUser/:idSetor",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { idUser, idSetor } = request.params;

      const user = await UserModel.findByIdAndUpdate(
        idUser,
        { setor: idSetor },
        { new: true, runValidators: true }
      );

      if (!user) {
        return response.status(404).json({ msg: "Usuário não encontrado!" });
      }
      await SetorModel.findByIdAndUpdate(
        idSetor,
        {
          $push: { usuarios: user._id },
        },
        { new: true, runValidators: true }
      );

      return response
        .status(200)
        .json({ msg: "Usuário inserido com sucesso!" });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

router.delete(
  "/delete/:id",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (request, response) => {
    try {
      const { id } = request.params;
      const deleteSetor = await SetorModel.findByIdAndDelete(id);
      await AtividadeModel.deleteMany({ setor: id });
      await DeducaoModel.deleteMany({ setor: id });
      return response.status(200).json(deleteSetor);
    } catch (error) {
      console.log(error);
      return response.status(500).json({ msg: "Erro interno no servidor!" });
    }
  }
);

export default router;
