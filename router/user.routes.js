import express from "express";
import UserModel from "../model/user.model.js";
import TarefaModel from "../model/tarefa.model.js";
import SetorModel from "../model/setor.model.js";
import bcrypt from "bcrypt";
import generateToken from "../config/jwt.config.js";
import isAuth from "../middlewares/isAuth.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import isGestor from "../middlewares/isGestor.js";

const userRoute = express.Router();

const saltRounds = 10;

// const status500 = res.status(500).json({ msg: "Algo deu errado..." });

// registrar novo usuário
userRoute.post("/register", async (req, res) => {
  try {
    const { password, name, email, setor } = req.body;
    if (!name) {
      return res.status(400).json({ msg: "Nome não foi inserido." });
    }
    if (!email) {
      return res.status(400).json({ msg: "Email não foi inserido." });
    }
    if (!password) {
      return res.status(400).json({ msg: "Senha não foi inserida." });
    }
    if (!setor) {
      delete req.body.setor;
    }
    const user = await UserModel.find({ email: email });

    if (user.length !== 0) {
      return res.status(400).json({ msg: "Email já cadastrado" });
    }
    const saltString = await bcrypt.genSalt(saltRounds);
    const hashPassword = await bcrypt.hash(password, saltString);

    const newUser = await UserModel.create({
      ...req.body,
      passwordHash: hashPassword,
    });

    delete newUser._doc.passwordHash;

    return res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Algo deu errado..." });
  }
});

// login
userRoute.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email }).populate("setor");
    if (!email) {
      return res.status(400).json({ msg: "Email não preenchido" });
    }
    if (!password) {
      return res.status(400).json({ msg: "Senha não preenchida" });
    }

    if (!user) {
      return res.status(400).json({ msg: "E-mail/senha inválido." });
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      delete user._doc.passwordHash;
      const token = generateToken(user);

      return res.status(200).json({
        user: { ...user._doc },
        token: token,
      });
    } else {
      return res.status(401).json({ msg: "E-mail/senha inválido." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Algo deu errado..." });
  }
});

// Consultar TODOS os usuários
userRoute.get(
  "/all-users",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (req, res) => {
    try {
      const users = await UserModel.find({}, { passwordHash: 0 });

      return res.status(200).json(users);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Algo deu errado..." });
    }
  }
);

// consultar o próprio perfil - busca o Id do usuário logado
// criei essa rota para diferenciar da consulta de ALGUM usuário
// verificar a funcionalidade isLoggedUser
userRoute.get("/profile", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedUser = req.currentUser._id;
    const userProfile = await UserModel.findById(loggedUser)
      .populate("setor")
      .populate("tarefas");

    delete userProfile._doc.passwordHash;

    return res.status(200).json(userProfile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Algo deu errado..." });
  }
});
// Consultar UM usuário
userRoute.get(
  "/one-user/:id",
  isAuth,
  isGestor,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id)
        .populate("setor")
        .populate("tarefas");

      if (!user) {
        return res.status(404).json({ msg: "Usuário não encontrado!" });
      }

      delete user._doc.passwordHash;

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Algo deu errado..." });
    }
  }
);

// Editar o PRÓPRIO perfil de usuário
userRoute.put("/editprofile", isAuth, attachCurrentUser, async (req, res) => {
  try {
    if (req.currentUser.role !== "admin") {
      delete req.body.name;
      delete req.body.active;
      delete req.body.role;
    }
    if (!req.body.email) {
      return res.status(400).json({ msg: "Email não informado!" });
    }
    const user = await UserModel.find({ email: req.body.email });
    if (user.length !== 0) {
      return res.status(400).json({ msg: "Email já cadastrado" });
    }
    const updateProfile = await UserModel.findByIdAndUpdate(
      req.currentUser._id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    delete updateProfile._doc.passwordHash;
    return res.status(200).json(updateProfile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Algo deu errado..." });
  }
});
// Editar perfil de ALGUM usuário
userRoute.put(
  "/edit/:id",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateUser = await UserModel.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      );
      delete updateUser._doc.passwordHash;
      return res.status(200).json(updateUser);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Algo deu errado..." });
    }
  }
);

// Deletar ALGUM usuário
userRoute.delete(
  "/delete/:id",
  isAuth,
  isAdmin,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedUser = await UserModel.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(400).json({ msg: "Usuário não encontrado!" });
      }

      await TarefaModel.deleteMany({ deletedUser: id });

      await SetorModel.findByIdAndUpdate(
        deletedUser.setor,
        {
          $pull: { usuarios: deletedUser._id },
        },
        { runValidators: true }
      );
      delete deletedUser._doc.passwordHash;
      return res.status(200).json(deletedUser);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Algo deu errado..." });
    }
  }
);

export default userRoute;
