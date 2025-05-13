const { body, query } = require('express-validator');

const validarCriarCaso = [
    body('nome')
        .notEmpty().withMessage('Nome do caso é obrigatório')
        .trim(),
    body('local')
        .notEmpty().withMessage('Local é obrigatório')
        .trim(),
    body('descricao')
        .notEmpty().withMessage('Descrição é obrigatória')
        .trim(),
    body('tipo')
        .isIn([
        'Lesão Corporal',
        'Identificação por Arcos Dentais',
        'Estimativa de Idade',
        'Exame de Marcas de Mordida',
        'Coleta de DNA',
        ]).withMessage('Tipo de caso inválido'),
    body('peritoResponsavel')
        .notEmpty().withMessage('Perito responsável é obrigatório')
        .isMongoId().withMessage('Perito responsável deve ser um ID válido'), // Validação de ObjectId
    body('data')
        .optional()
        .isISO8601().withMessage('Data deve estar no formato ISO 8601 (ex.: 2023-01-01)'),
];

const validarListarCasos = [
    query('status')
        .optional()
        .isIn(['Em andamento', 'Finalizado', 'Arquivado']).withMessage('Status inválido'),
    query('data')
        .optional()
        .isISO8601().withMessage('Data inválida'),
    query('peritoResponsavel')
        .optional()
        .notEmpty().withMessage('ID do perito responsável não pode estar vazio'),
];

module.exports = { validarCriarCaso, validarListarCasos };