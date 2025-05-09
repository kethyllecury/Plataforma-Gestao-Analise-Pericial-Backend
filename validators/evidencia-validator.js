const { body } = require("express-validator");
const mongoose = require("mongoose");

const createEvidenciaValidator = [
    body("titulo")
        .notEmpty()
        .withMessage("O título é obrigatório")
        .isString()
        .withMessage("O título deve ser uma string")
        .trim(),
    body("anexo")
        .notEmpty()
        .withMessage("O anexo é obrigatório")
        .isString()
        .withMessage("O anexo deve ser uma string")
];

const updateEvidenciaValidator = [
    body("titulo")
        .optional()
        .isString()
        .withMessage("O título deve ser uma string")
        .trim(),
    body("anexo")
        .optional()
        .isString()
        .withMessage("O anexo deve ser uma string")
];

module.exports = {
    createEvidenciaValidator,
    updateEvidenciaValidator
};