import UserModel from "../model/user.model.js";

async function attachCurrentUser(req, res, next) {
  try {
    const loggedUser = req.auth;
    console.log("req.auth is: " + req.auth);

    const user = await UserModel.findOne(
      { _id: loggedUser._id },
      { passwordHash: 0 }
    );

    // isLogged
    if (!user) {
      return res.status(400).json({ msg: "Usuário não encontrado" });
    }

    req.currentUser = user;

    next();
  } catch (error) {
    console.log(error);
    return response.status(400).json("algo deu errado: ", error);
  }
}

export default attachCurrentUser;
