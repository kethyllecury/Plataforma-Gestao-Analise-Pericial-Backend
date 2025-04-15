const mongoose = require("mongoose");

const CasoSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    local: { type: String, required: true},
    data: { type: Date, required: true },
    hora: { type: String, required: true }, // Armazena a hora como string (ex: "14:30")
    descricao: { type: String, required: true },
    tipo: { 
        type: String, 
        required: true,
        enum: [
            "Lesões Corporais",
            "Identificação por Arcos Dentais",
            "Estimativa de Idade",
            "Exames de Marcas de Mordida",
            "Coletas de DNA"
        ],
    },
    peritoResponsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencia o modelo User
        required: true,
    },
    anexos: [{ type: String }], // Array de strings para arquivos em base64
    status: {
        type: String, 
        enum: ["Em andamento", "Finalizado", "Arquivado"],
        default: "Em andamento" // Definindo como default pois não será solicitado no formlário, mas poderá ser alterado depois
    }
});

module.exports = mongoose.model("Caso", CasoSchema);