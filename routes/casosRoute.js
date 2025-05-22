const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Caso = require("../models/Caso");
const Usuario = require("../models/Usuario");
const { validarCriarCaso } = require("../validators/casosValidator");
const { verifyToken } = require("../middleware/auth");
const { verificarErrosValidacao } = require("../utils/validacao");

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
 *                 example: "UsuarioId"
 *               dataHora:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-01-01T14:30:00Z"
 *     responses:
 *       201:
 *         description: Caso criado com sucesso
 *       400:
 *         description: Erro de validação ou nome já existente
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Perito não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/", verifyToken, validarCriarCaso, verificarErrosValidacao, async (req, res) => {
  try {
    const perito = await Usuario.findById(req.body.peritoResponsavel);
    if (!perito) {
      return res.status(404).json({ success: false, error: "Perito não encontrado" });
    }

    if (perito.cargo !== "perito") {
      return res
        .status(400)
        .json({ success: false, error: "O usuário especificado não é um perito" });
    }

    const casoExistente = await Caso.findOne({ nome: req.body.nome });
    if (casoExistente) {
      return res.status(400).json({ success: false, error: "Nome do caso já existe" });
    }

    // Validar e converter dataHora
    const dataHora = converterData(req.body.dataHora);
    if (dataHora === null) {
      return res.status(400).json({ success: false, error: "Data e hora inválidas" });
    }

    const novoCaso = new Caso({
      ...req.body,
      dataHora
    });
    await novoCaso.save();
    res.status(201).json({ success: true, novoCaso });

  } catch (error) {
    console.error("Erro ao criar caso:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "Nome do caso já existe" });
    }

    res.status(500).json({ success: false, error: "Erro ao criar caso", detalhes: error.message });
  }
});

/**
 * @swagger
 * /api/casos:
 *   get:
 *     summary: Lista todos os casos com filtros opcionais
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["Em andamento", "Finalizado", "Arquivado"]
 *           example: "Em andamento"
 *       - name: dataHora
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T14:30:00Z"
 *       - name: peritoResponsavel
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "UsuarioId"
 *     responses:
 *       200:
 *         description: Lista de casos
 *       400:
 *         description: Parâmetros de consulta inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/", verifyToken, verificarErrosValidacao, async (req, res) => {
  try {
    const { status, dataHora, peritoResponsavel } = req.query;
    
    // Construir filtro
    const filtro = {};
    if (status) filtro.status = status;
    if (peritoResponsavel) filtro.peritoResponsavel = peritoResponsavel;
    if (dataHora) {
      const dataConvertida = converterData(dataHora);
      if (dataConvertida === null) {
        return res.status(400).json({ success: false, error: "Data e hora inválidas" });
      }
      // Filtrar por data exata (pode ajustar para intervalo se necessário)
      filtro.dataHora = dataConvertida;
    }

    const casos = await Caso.find(filtro).populate("peritoResponsavel", "nome email");
    res.json({ success: true, casos });
  } catch (error) {
    console.error("Erro ao listar casos:", error.message);
    res.status(500).json({ success: false, error: "Erro ao listar casos", detalhes: error.message });
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
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "ID inválido" });
    }

    const caso = await Caso.findById(req.params.id).populate(
      "peritoResponsavel",
      "nome email"
    );
    if (!caso) {
      return res.status(404).json({ success: false, error: "Caso não encontrado" });
    }
    res.json(caso);
  } catch (error) {
    console.error("Erro ao buscar caso:", error.message);
    res.status(500).json({ success: false, error: "Erro ao buscar caso", detalhes: error.message });
  }
});

/**
 * @swagger
 * /api/casos/paginado/{pagina}/{quantidade}:
 *   get:
 *     summary: Lista casos de forma paginada
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pagina
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Número da página
 *       - name: quantidade
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         description: Quantidade de registros por página
 *     responses:
 *       200:
 *         description: Lista de casos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 resultado:
 *                   type: object
 *                   properties:
 *                     totalRegistro:
 *                       type: integer
 *                       example: 50
 *                     registros:
 *                       type: array
 *                       items:
 *                         $ref: '#/models/Caso'
 *       400:
 *         description: Parâmetros de paginação inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Nenhum caso encontrado na página solicitada
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/paginado/:pagina/:quantidade", verifyToken, async (req, res) => {
  try {
    const pagina = parseInt(req.params.pagina);
    const quantidade = parseInt(req.params.quantidade);

    // Validação dos parâmetros
    if (isNaN(pagina) || pagina < 1 || isNaN(quantidade) || quantidade < 1) {
      return res.status(400).json({ success: false, error: "Página e quantidade devem ser números inteiros positivos" });
    }

    // Contar o total de registros
    const totalRegistro = await Caso.countDocuments();

    // Verificar se há registros disponíveis
    if (totalRegistro === 0) {
      return res.status(404).json({ success: false, error: "Nenhum caso encontrado" });
    }

    // Calcular o número de documentos a pular
    const skip = (pagina - 1) * quantidade;

    // Buscar os casos paginados
    const registros = await Caso.find()
      .populate("peritoResponsavel", "nome email")
      .skip(skip)
      .limit(quantidade);

    // Verificar se há registros na página solicitada
    if (registros.length === 0) {
      return res.status(404).json({ success: false, error: `Nenhum caso encontrado na página ${pagina}` });
    }

    res.json({
      success: true,
      resultado: {
        totalRegistro,
        registros,
      },
    });
  } catch (error) {
    console.error("Erro ao listar casos paginados:", error.message);
    res.status(500).json({ success: false, error: "Erro ao listar casos paginados", detalhes: error.message });
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
 *                 example: "someUsuarioId"
 *               dataHora:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-01-01T14:30:00Z"
 *               status:
 *                 type: string
 *                 enum: ["Em andamento", "Finalizado", "Arquivado"]
 *                 example: "Em andamento"
 *     responses:
 *       200:
 *         description: Caso atualizado com sucesso
 *       400:
 *         description: Erro de validação ou nome já existente
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso ou perito não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/:id", verifyToken, validarCriarCaso, verificarErrosValidacao, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "ID inválido" });
    }

    const caso = await Caso.findById(req.params.id);
    if (!caso) {
      return res.status(404).json({ success: false, error: "Caso não encontrado" });
    }

    if (req.body.peritoResponsavel) {
      const perito = await Usuario.findById(req.body.peritoResponsavel);
      if (!perito) {
        return res.status(404).json({ success: false, error: "Perito não encontrado" });
      }
      if (perito.cargo !== "perito") {
        return res
          .status(400)
          .json({ success: false, error: "O usuário especificado não é um perito" });
      }
    }

    if (req.body.nome && req.body.nome !== caso.nome) {
      const casoExistente = await Caso.findOne({ nome: req.body.nome });
      if (casoExistente) {
        return res.status(400).json({ success: false, error: "Nome do caso já existe" });
      }
    }

    // Validar e converter dataHora se fornecido
    if (req.body.dataHora) {
      const dataHora = converterData(req.body.dataHora);
      if (dataHora === null) {
        return res.status(400).json({ success: false, error: "Data e hora inválidas" });
      }
      req.body.dataHora = dataHora;
    }

    const casoAtualizado = await Caso.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json(casoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar caso:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "Nome do caso já existe" });
    }
    res.status(500).json({ success: false, error: "Erro ao atualizar caso", detalhes: error.message });
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
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "ID inválido" });
    }

    const caso = await Caso.findByIdAndDelete(req.params.id);
    if (!caso) {
      return res.status(404).json({ success: false, error: "Caso não encontrado" });
    }
    res.json({ message: "Caso deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar caso:", error.message);
    res.status(500).json({ success: false, error: "Erro ao deletar caso", detalhes: error.message });
  }
});

module.exports = router;