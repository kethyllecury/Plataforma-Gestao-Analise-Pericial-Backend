const mongoose = require('mongoose');

// Função para gerar NIC único de 8 dígitos
const gerarNIC = async () => {
    const gerarNumero = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString(); // Gera número de 8 dígitos
    };

    let nic;
    let isUnique = false;
    
    // Obtenha o modelo 'Vitima' uma vez aqui.
    // Isso garante que você está usando a referência correta ao modelo
    // que já foi registrado no Mongoose no momento da execução.
    const VitimaModel = mongoose.model('Vitima'); 

    while (!isUnique) {
        nic = gerarNumero();
        // Use a variável VitimaModel que você já obteve.
        // Isso é mais limpo e evita buscar o modelo novamente para cada iteração.
        const existingVitima = await VitimaModel.findOne({ NIC: nic }); 
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
        unique: true,
        // Removido 'default: gerarNIC' daqui, pois a geração é feita no hook 'pre('save')'
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

// Hook 'pre('save')' para gerar o NIC automaticamente para novos documentos
vitimaSchema.pre('save', async function(next) {
    // 'this' refere-se ao documento Vitima que está sendo salvo.
    // Garante que o NIC só é gerado se for um novo documento e ainda não foi fornecido.
    if (this.isNew && (!this.NIC || this.NIC === '')) {
        try {
            this.NIC = await gerarNIC(); // Aguarda a resolução da Promise de gerarNIC
        } catch (error) {
            console.error("Erro ao gerar NIC no pre-save hook:", error);
            // Se houver um erro, passa para o próximo middleware de erro
            return next(error); 
        }
    }
    next(); // Continua o processo de salvamento do Mongoose
});

module.exports = mongoose.model('Vitima', vitimaSchema);