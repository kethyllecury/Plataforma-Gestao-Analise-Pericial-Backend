const mongoose = require('mongoose');

const vitimaSchema = new mongoose.Schema({
    casoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Caso', 
        required: true 
    },
    nome: { type: String, default: "Não identificado" },
    genero: { type: String, default: "Não identificado" },
    idade: { type: Number, default: null },
    cpf: { type: String, default: "Não identificado" },
    endereco: { type: String, default: "Não identificado" },
    etnia: { 
        type: String, 
        enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não identificado'], 
        default: "Não identificado" 
    },
    odontograma: {
        superiorEsquerdo: [{ type: String, default: "" }],
        superiorDireito: [{ type: String, default: "" }],
        inferiorEsquerdo: [{ type: String, default: "" }],
        inferiorDireito: [{ type: String, default: "" }]
    },
    anotacaoAnatomia: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vitima', vitimaSchema);
