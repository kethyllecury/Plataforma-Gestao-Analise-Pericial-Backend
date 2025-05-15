const mongoose = require("mongoose");

const casoSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    local: { type: String, required: true },
    descricao: { type: String, required: true },
    tipo: {
        type: String,
        required: true,
        enum: [
        "Lesão Corporal",
        "Identificação por Arcos Dentais",
        "Estimativa de Idade",
        "Exame de Marcas de Mordida",
        "Coleta de DNA",
        ],
    },
    peritoResponsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario", // Referencia o modelo User
        required: true,
    },
    status: {
        type: String,
        enum: ["Em andamento", "Finalizado", "Arquivado"],
        default: "Em andamento", // Definindo como default pois não será solicitado no formulário, mas poderá ser alterado depois
    },
    dataHora: {
        type: Date,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Caso", casoSchema);
