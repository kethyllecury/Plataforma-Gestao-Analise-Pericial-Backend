const mongoose = require('mongoose');

const relatorioSchema = new mongoose.Schema({
    casoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caso', required: true },
    conteudo: { type: String, required: true },
    arquivoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nomeArquivo: { type: String, required: true },
    assinatura: { type: String },
    assinado: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Relatorio', relatorioSchema);