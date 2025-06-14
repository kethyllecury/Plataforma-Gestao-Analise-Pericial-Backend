const mongoose = require('mongoose');

const laudoSchema = new mongoose.Schema({
    evidenciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidencia', required: true },
    titulo: { type: String, required: true },
    conteudo: { type: String, required: true },
    arquivoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nomeArquivo: { type: String, required: true },
    peritoResponsavel: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    assinatura: { type: String },
    assinado: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Laudo', laudoSchema);