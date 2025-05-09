const { body, query } = require('express-validator');

const validarUploadEvidencia = [
    body('casoId')
        .notEmpty().withMessage('ID do caso é obrigatório'),
    body('tipoEvidencia')
        .isIn(['radiografia', 'odontograma', 'outro']).withMessage('Tipo de evidência inválido'),
    body('descricao')
        .optional()
        .trim(),
];

const validarListarEvidencias = [
    query('casoId')
        .notEmpty().withMessage('ID do caso é obrigatório'),
];

module.exports = { validarUploadEvidencia, validarListarEvidencias };