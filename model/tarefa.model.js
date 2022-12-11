import { Schema, model } from "mongoose";

const tarefaSchema = new Schema(
  {
    setor: {
      type: Schema.Types.ObjectId,
      ref: "Setor",
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    atividade: {
      type: Schema.Types.ObjectId,
      ref: "Atividade",
    },
    deducao: {
      type: Schema.Types.ObjectId,
      ref: "Deducao",
    },
    horas: {
      type: Number,
    },
    concluida: {
      type: Boolean,
      default: false,
    },
    observacao: {
      type: String,
    },
    validada: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const TarefaModel = model("Tarefa", tarefaSchema);

export default TarefaModel;
