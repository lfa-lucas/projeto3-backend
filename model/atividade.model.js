import { Schema, model } from "mongoose";

const atividadeSchema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
    },
    descricao: {
      type: String,
    },
    horasEsperadas: {
      type: Number,
    },
    setor: {
      type: Schema.Types.ObjectId,
      ref: "Setor",
    },
    ativa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AtividadeModel = model("Atividade", atividadeSchema);

export default AtividadeModel;
