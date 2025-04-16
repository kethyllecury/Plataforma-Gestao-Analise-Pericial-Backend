const { body } = require("express-validator");

// Função para validar formato de hora (HH:mm)
const validateHora = (value) => {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        throw new Error("Hora deve estar no formato HH:mm");
    }
    return true;
};

// Validações para POST /casos
const createCasoValidator = [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("local").notEmpty().withMessage("Local é obrigatório"),
    body("data").isISO8601().toDate().withMessage("Data deve ser válida"),
    body("hora").custom(validateHora),
    body("descricao").notEmpty().withMessage("Descrição é obrigatória"),
    body("tipo")
        .isIn([
            "Lesão Corporal",
            "Identificação por Arcos Dentais",
            "Estimativa de Idade",
            "Exame de Marcas de Mordida",
            "Coleta de DNA"
        ])
        .withMessage("Tipo inválido"),
    body("peritoResponsavel")
        .isMongoId()
        .withMessage("Perito responsável deve ser um ID válido"),
];

// Validações para PUT /casos/:id
const updateCasoValidator = [
    body("nome").optional().notEmpty().withMessage("Nome não pode ser vazio"),
    body("local").optional().notEmpty().withMessage("Local não pode ser vazio"),
    body("data").optional().isISO8601().toDate().withMessage("Data inválida"),
    body("hora").optional().custom(validateHora),
    body("descricao")
        .optional()
        .notEmpty()
        .withMessage("Descrição não pode ser vazia"),
    body("tipo")
        .optional()
        .isIn([
            "Lesão Corporal",
            "Identificação por Arcos Dentais",
            "Estimativa de Idade",
            "Exame de Marcas de Mordida",
            "Coleta de DNA"
        ])
        .withMessage("Tipo inválido"),
    body("peritoResponsavel")
        .optional()
        .isMongoId()
        .withMessage("Perito responsável deve ser um ID válido"),
    body("status")
        .optional()
        .isIn(["Em andamento", "Finalizado", "Arquivado"])
        .withMessage("Status inválido"),
];

module.exports = {
    createCasoValidator,
    updateCasoValidator,
};