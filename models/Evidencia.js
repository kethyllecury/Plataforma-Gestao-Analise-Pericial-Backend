const mongoose = require('mongoose');

const evidenciaSchema = new mongoose.Schema({
    casoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Caso', 
        required: true 
    },
    tituloEvidencia: {type: String, required: true},
    arquivoId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID do arquivo no GridFS
    nomeArquivo: { type: String, required: true }, // Nome original do arquivo
    tipoArquivo: { type: String, required: true }, // MIME type (ex.: image/jpeg, application/pdf)
    tipoEvidencia: { 
        type: String, 
        enum: [
            'radiografia', 
            'odontograma',
            'outro'
        ], 
        required: true 
    },
    descricao: { type: String },
    coletadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Evidencia', evidenciaSchema);
