import { Schema, model } from "mongoose";

const setorSchema = new Schema(
  {
    nome: {
      type: String,
      require: true,
    },
    sigla: {
      type: String,
      require: true,
      unique: true,
    },
    usuarios: [
      {
        type: Schema.Types.ObjectId,
        ref: "Usuario",
      },
    ],
    chefe: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },
    substituto: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },
    atividades: [
      {
        type: Schema.Types.ObjectId,
        ref: "Atividade",
      },
    ],
    deducoes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Deducao",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SetorModel = model("Setor", setorSchema);

export default SetorModel;
