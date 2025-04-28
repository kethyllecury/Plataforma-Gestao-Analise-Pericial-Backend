const mongoose = require("mongoose");

const CasoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    local: { type: String, required: true},
    dataAbertura: { type: Date, required: true },  // Alterar o nome aqui para dataAbertura
    hora: { type: String, required: true }, 
    descricao: { type: String, required: true },
    tipo: { 
        type: String, 
        required: true,
        enum: [
            "Lesão Corporal",
            "Identificação por Arcos Dentais",
            "Estimativa de Idade",
            "Exame de Marcas de Mordida",
            "Coleta de DNA"
        ],
    },
    peritoResponsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencia o modelo User
        required: true,
    },
    anexos: [{ type: String}],
    // anexos: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Evidencia" // Referencia o modelo Evidencia
    // }], 
    status: {
        type: String, 
        enum: ["Em andamento", "Finalizado", "Arquivado"],
        default: "Em andamento" // Definindo como default pois não será solicitado no formulário, mas poderá ser alterado depois
    }
});
