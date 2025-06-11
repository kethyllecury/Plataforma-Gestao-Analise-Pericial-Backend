const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    acao: { type: String, required: true }, // Ex.: "Criação de Relatório", "Assinatura de Laudo"
    entidade: { type: String, required: true }, // Ex.: "Relatorio", "Laudo"
    entidadeId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID do relatório ou laudo
    detalhes: { type: String }, // Informações adicionais (ex.: título, casoId, evidenciaId)
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Auditoria', auditoriaSchema);