const { body } = require('express-validator');

const validarGerarRelatorio = [
    body('casoId')
        .notEmpty().withMessage('ID do caso é obrigatório'),
    body('conteudo')
        .notEmpty().withMessage('Conteúdo do relatório é obrigatório')
        .trim(),
];

const validarAssinarRelatorio = [
    body('assinatura')
        .notEmpty().withMessage('Assinatura é obrigatória')
        .trim(),
];

module.exports = { validarGerarRelatorio, validarAssinarRelatorio };