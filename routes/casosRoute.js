const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Caso = require("../models/Caso");
const User = require("../models/Usuario");
const { validationResult } = require("express-validator");
const { validarCriarCaso } = require("../validators/casosValidator");

/**
 * @swagger
 * tags:
 *   name: Casos
 *   description: Endpoints para gestão de casos forenses
 */

/**
 * @swagger
 * /api/casos:
 *   post:
 *     summary: Cria um novo caso
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Caso 1"
 *               local:
 *                 type: string
 *                 example: "São Paulo"
 *               descricao:
 *                 type: string
 *                 example: "Descrição do caso"
 *               tipo:
 *                 type: string
 *                 enum: ["Lesão Corporal", "Identificação por Arcos Dentais", "Estimativa de Idade", "Exame de Marcas de Mordida", "Coleta de DNA"]
 *                 example: "Lesão Corporal"
 *               peritoResponsavel:
 *                 type: string
 *                 example: "someUserId"
 *               data:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-01"
 *     responses:
 *       201:
 *         description: Caso criado com sucesso
 *       400:
 *         description: Erro de validação ou nome já existente
 *       404:
 *         description: Perito não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/", validarCriarCaso, async (req, res) => {
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
      return res
        .status(400)
        .json({ error: "O usuário especificado não é um perito" });
    }

    const casoExistente = await Caso.findOne({ nome: req.body.nome });
    if (casoExistente) {
      return res.status(400).json({ error: "Nome do caso já existe" });
    }

    if (req.body.data) {
      console.log("Data recebida:", req.body.data);
      req.body.data = new Date(req.body.data);
      console.log("Data convertida:", req.body.data);
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

/**
 * @swagger
 * /api/casos:
 *   get:
 *     summary: Lista todos os casos
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de casos
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/", async (req, res) => {
  try {
    const casos = await Caso.find().populate("peritoResponsavel", "nome email");
    res.json(casos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar casos" });
  }
});

/**
 * @swagger
 * /api/casos/{id}:
 *   get:
 *     summary: Busca um caso por ID
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caso encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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

/**
 * @swagger
 * /api/casos/{id}:
 *   put:
 *     summary: Atualiza um caso
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Caso 1 Atualizado"
 *               local:
 *                 type: string
 *                 example: "São Paulo"
 *               descricao:
 *                 type: string
 *                 example: "Descrição atualizada"
 *               tipo:
 *                 type: string
 *                 enum: ["Lesão Corporal", "Identificação por Arcos Dentais", "Estimativa de Idade", "Exame de Marcas de Mordida", "Coleta de DNA"]
 *                 example: "Lesão Corporal"
 *               peritoResponsavel:
 *                 type: string
 *                 example: "someUserId"
 *     responses:
 *       200:
 *         description: Caso atualizado com sucesso
 *       400:
 *         description: Erro de validação ou nome já existente
 *       404:
 *         description: Caso ou perito não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/:id", validarCriarCaso, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const caso = await Caso.findById(req.params.id);
    if (!caso) {
      return res.status(404).json({ error: "Caso não encontrado" });
    }

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

    if (req.body.nome && req.body.nome !== caso.nome) {
      const casoExistente = await Caso.findOne({ nome: req.body.nome });
      if (casoExistente) {
        return res.status(400).json({ error: "Nome do caso já existe" });
      }
    }

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

/**
 * @swagger
 * /api/casos/{id}:
 *   delete:
 *     summary: Deleta um caso por ID
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caso deletado com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
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