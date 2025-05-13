const { body } = require('express-validator');

const validarRegistro = [
    body('cpf')
        .notEmpty().withMessage('CPF é obrigatório')
        .isLength({ min: 11, max: 14 }).withMessage('CPF deve ter entre 11 e 14 caracteres'),
    body('email')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('nome')
        .notEmpty().withMessage('Nome é obrigatório')
        .trim(),
    body('cargo')
        .isIn(['admin', 'assistente', 'perito']).withMessage('Cargo inválido'),
    body('senha')
        .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
];

const validarLogin = [
    body('email')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
        body('senha')
        .notEmpty().withMessage('Senha é obrigatória'),
];

const validarAdmin = (req, res, next) => {
    if(req.usuario == undefined) {
        return res.status(403).json({ message: "Faça o login como administrador para realizar operação!"})
    }

    if (req.usuario.cargo !== "admin") {
    return res.status(403).json({ message: "Acesso restrito à administradores!"})
    }
    next();
};

module.exports = { validarRegistro, validarLogin, validarAdmin };