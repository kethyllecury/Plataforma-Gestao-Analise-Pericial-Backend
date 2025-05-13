const { validationResult } = require('express-validator');

const verificarErrosValidacao = (req, res, next) => {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
        return res.status(400).json({ success: false, erros: erros.array() });
    }
    next();
};

const validarCPF = (cpf) => {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');

    // CPF precisa ter 11 dígitos
    if (cpf.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = (resto < 2) ? 0 : 11 - resto;
    if (digito1 !== parseInt(cpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = (resto < 2) ? 0 : 11 - resto;
    if (digito2 !== parseInt(cpf.charAt(10))) return false;

    return true;
}

const validarData = (data) => {
    console.log("Data recebida:", data);
    data = new Date(data);
    console.log("Data convertida:", data);
    if (isNaN(data)) {
        return false;
    }
}


module.exports = { verificarErrosValidacao, validarCPF, validarData };