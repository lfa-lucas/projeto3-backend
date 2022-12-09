import { model, Schema } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/gm,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ["usuario", "gestor", "admin"],
    default: "usuario",
  },
  setor: {
    type: Schema.Types.ObjectId,
    ref: "Setor",
  },
  profileImg: {
    type: String,
  },
  tarefas: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tarefa",
    },
  ],
});

const UserModel = model("User", userSchema);

export default UserModel;
