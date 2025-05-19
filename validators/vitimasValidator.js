const { body } = require('express-validator')

const validarVitima = [
    body('nome')
        .trim(),
    body('genero')
        .notEmpty().withMessage('Gênero é obrigatório')
        .trim(),
    body('idade')
        .trim(),
    body('cpf')
        .notEmpty().withMessage('CPF é obrigatório')
        .isLength({ min: 11, max: 14 }).withMessage('CPF deve ter entre 11 e 14 caracteres'),
    body('endereco')
        .notEmpty().withMessage('Endereço é obrigatório')
        .trim(),
    body('etnia')
        .isIn([
            'Branca', 
            'Preta', 
            'Parda', 
            'Amarela', 
            'Indígena', 
            'Não identificado'])
            .withMessage('Cor/Etnia inválida'),
    body('casoId')
        .notEmpty().withMessage('ID do caso é obrigatório')
        .isMongoId().withMessage('ID do caso deve ser válido'),
];

module.exports = { validarVitima };