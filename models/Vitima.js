const mongoose = require('mongoose');

// Função para gerar NIC único de 8 dígitos
const gerarNIC = async () => {
    const gerarNumero = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString(); // Gera número de 8 dígitos
    };

    let nic;
    let isUnique = false;
    while (!isUnique) {
        nic = gerarNumero();
        const existingVitima = await mongoose.model('Vitima').findOne({ NIC: nic });
        if (!existingVitima) {
            isUnique = true;
        }
    }
    return nic;
};

const vitimaSchema = new mongoose.Schema({
    casoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Caso', 
        required: true 
    },
    NIC: {
        type: String,
        required: true,
        unique: true,
        default: gerarNIC // Gera NIC único automaticamente
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
