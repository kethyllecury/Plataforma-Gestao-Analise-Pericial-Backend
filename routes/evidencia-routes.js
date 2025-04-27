const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Evidencia = require("../models/Evidencia");
const Caso = require("../models/Caso");
const { validationResult } = require("express-validator");
const { createEvidenciaValidator, updateEvidenciaValidator } = require("../validators/evidencia-validator");

// POST /evidencias - Criar uma nova evidencia
router.post("/", createEvidenciaValidator, async (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Verificar se o caso existe
        const caso = await Caso.findById(req.body.caso);
        if (!caso) {
            return res.status(404).json({ error: "Caso não encontrado" });
        }

        // Criar nova evidencia
        const novaEvidencia = new Evidencia(req.body);
        await novaEvidencia.save();

        // Adicionar evidencia ao caso
        caso.anexos.push(novaEvidencia._id);
        await caso.save();

        res.status(201).json(novaEvidencia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar evidência" });
    }
});

// GET /evidencias - Listar todas as evidencias
router.get("/", async (req, res) => {
    try {
        const evidencias = await Evidencia.find().populate("caso", "nome");
        res.json(evidencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao listar evidências" });
    }
});

// GET /evidencias/:id - Buscar uma evidencia por ID
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const evidencia = await Evidencia.findById(req.params.id).populate("caso", "nome");
        if (!evidencia) {
            return res.status(404).json({ error: "Evidência não encontrada" });
        }
        res.json(evidencia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar evidência" });
    }
});

// PUT /evidencias/:id - Atualizar uma evidencia
router.put("/:id", updateEvidenciaValidator, async (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        // Verificar se a evidencia existe
        const evidencia = await Evidencia.findById(req.params.id);
        if (!evidencia) {
            return res.status(404).json({ error: "Evidência não encontrada" });
        }

        // Verificar se o caso existe (se fornecido)
        if (req.body.caso) {
            const caso = await Caso.findById(req.body.caso);
            if (!caso) {
                return res.status(404).json({ error: "Caso não encontrado" });
            }
        }

        // Atualizar evidencia
        const evidenciaAtualizada = await Evidencia.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        res.json(evidenciaAtualizada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar evidência" });
    }
});

// DELETE /evidencias/:id - Deletar uma evidencia
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const evidencia = await Evidencia.findById(req.params.id);
        if (!evidencia) {
            return res.status(404).json({ error: "Evidência não encontrada" });
        }

        // Remover evidencia do caso
        await Caso.updateOne(
            { _id: evidencia.caso },
            { $pull: { anexos: evidencia._id } }
        );

        // Deletar evidencia
        await Evidencia.findByIdAndDelete(req.params.id);
        res.json({ message: "Evidência deletada com sucesso" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao deletar evidência" });
    }
});

module.exports = router;