const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Caso = require("../models/Caso");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const {createCasoValidator, updateCasoValidator} = require("../validators/caso-validator");

// POST /casos - Criar um novo caso
router.post("/", createCasoValidator, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const perito = await User.findById(req.body.peritoResponsavel);
        if (!perito) {
            return res.status(404).json({ error: "Perito não encontrado" });
        }
        if (perito.cargo !== "perito") {
            return res.status(400).json({ error: "O usuário especificado não é um perito" });
        }

        const casoExistente = await Caso.findOne({ nome: req.body.nome });
        if (casoExistente) {
            return res.status(400).json({ error: "Nome do caso já existe" });
        }

        if (req.body.data) {
            console.log('Data recebida:', req.body.data); 
            req.body.data = new Date(req.body.data);  
            console.log('Data convertida:', req.body.data);  
        }               

        const novoCaso = new Caso(req.body);
        await novoCaso.save();
        res.status(201).json(novoCaso);

    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Nome do caso já existe" });
        }
        res.status(500).json({ error: "Erro ao criar caso" });
    }
});


// GET /casos - Listar todos os casos
router.get("/", async (req, res) => {
    try {
    const casos = await Caso.find().populate("peritoResponsavel", "nome email");
    res.json(casos);
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar casos" });
    }
});

// GET /casos/:id - Buscar um caso por ID
router.get("/:id", async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const caso = await Caso.findById(req.params.id).populate(
        "peritoResponsavel",
        "nome email"
    );
    if (!caso) {
        return res.status(404).json({ error: "Caso não encontrado" });
    }
    res.json(caso);
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar caso" });
    }
});

// PUT /casos/:id - Atualizar um caso
router.put("/:id", updateCasoValidator, async (req, res) => {
    try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    // Verificar se o caso existe
    const caso = await Caso.findById(req.params.id);
    if (!caso) {
        return res.status(404).json({ error: "Caso não encontrado" });
    }

    // Verificar se o perito existe (se fornecido)
    if (req.body.peritoResponsavel) {
        const perito = await User.findById(req.body.peritoResponsavel);
        if (!perito) {
        return res.status(404).json({ error: "Perito não encontrado" });
        }
        if (perito.cargo !== "perito") {
        return res
            .status(400)
            .json({ error: "O usuário especificado não é um perito" });
        }
    }

    // Verificar unicidade do nome (se alterado)
    if (req.body.nome && req.body.nome !== caso.nome) {
        const casoExistente = await Caso.findOne({ nome: req.body.nome });
        if (casoExistente) {
        return res.status(400).json({ error: "Nome do caso já existe" });
        }
    }

    // Atualizar caso
    const casoAtualizado = await Caso.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );
    res.json(casoAtualizado);
    } catch (error) {
    console.error(error);
    if (error.code === 11000) {
        return res.status(400).json({ error: "Nome do caso já existe" });
    }
    res.status(500).json({ error: "Erro ao atualizar caso" });
    }
});

// DELETE /casos/:id - Deletar um caso
router.delete("/:id", async (req, res) => {
    try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
    }

    const caso = await Caso.findByIdAndDelete(req.params.id);
    if (!caso) {
        return res.status(404).json({ error: "Caso não encontrado" });
    }
    res.json({ message: "Caso deletado com sucesso" });
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar caso" });
    }
});

module.exports = router;