const express = require('express');
const mongoose = require('mongoose');

const Vitima = require('../models/Vitima');
const Caso = require('../models/Caso');
const { validarVitima } = require('../validators/vitimasValidator');
const { verificarErrosValidacao } = require('../utils/validacao');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vítimas
 *   description: Endpoints para gestão de vítimas
 */

/**
 * @swagger
 * /api/vitimas:
 *   post:
 *     summary: Cria uma nova vítima
 *     tags: [Vítimas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               casoId:
 *                 type: string
 *                 example: "CasoId"
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               genero:
 *                 type: string
 *                 example: "Masculino"
 *               idade:
 *                 type: number
 *                 example: 30
 *               cpf:
 *                 type: string
 *                 example: "12345678900"
 *               endereco:
 *                 type: string
 *                 example: "Rua Exemplo, 123"
 *               etnia:
 *                 type: string
 *                 enum: ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não identificado"]
 *                 example: "Branca"
 *               anotacaoAnatomia:
 *                 type: string
 *                 example: "Observações sobre anatomia"
 *               odontograma:
 *                 type: object
 *                 properties:
 *                   superiorEsquerdo:
 *                     type: array
 *                     items:
 *                       type: string
 *                   superiorDireito:
 *                     type: array
 *                     items:
 *                       type: string
 *                   inferiorEsquerdo:
 *                     type: array
 *                     items:
 *                       type: string
 *                   inferiorDireito:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       201:
 *         description: Vítima criada com sucesso
 *       400:
 *         description: Erro de validação ou caso inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', verifyToken, validarVitima, verificarErrosValidacao, async (req, res) => {
    try {
        const { casoId } = req.body;

        // Verificar se o caso existe
        const caso = await Caso.findById(casoId);
        if (!caso) {
            return res.status(404).json({ success: false, error: 'Caso não encontrado' });
        }

        const novaVitima = new Vitima(req.body);
        await novaVitima.save();
        res.status(201).json({ success: true, novaVitima });
    } catch (error) {
        console.error('Erro ao criar vítima:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao criar vítima', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/vitimas:
 *   get:
 *     summary: Lista vítimas por caso
 *     tags: [Vítimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: casoId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "CasoId"
 *     responses:
 *       200:
 *         description: Lista de vítimas
 *       400:
 *         description: ID do caso inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { casoId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(casoId)) {
            return res.status(400).json({ success: false, error: 'ID do caso inválido' });
        }

        const caso = await Caso.findById(casoId);
        if (!caso) {
            return res.status(404).json({ success: false, error: 'Caso não encontrado' });
        }

        const vitimas = await Vitima.find({ casoId });
        res.json({ success: true, vitimas });
    } catch (error) {
        console.error('Erro ao listar vítimas:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao listar vítimas', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/vitimas/{id}:
 *   get:
 *     summary: Busca uma vítima por ID
 *     tags: [Vítimas]
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
 *         description: vítima encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Vítima não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID inválido' });
        }

        const vitima = await Vitima.findById(req.params.id);
        if (!vitima) {
            return res.status(404).json({ success: false, error: 'Vítima não encontrada' });
        }
        res.json({ success: true, vitima });
    } catch (error) {
        console.error('Erro ao buscar vítima:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao buscar vítima', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/vitimas/paginado/{pagina}/{quantidade}:
 *   get:
 *     summary: Lista vítimas de forma paginada
 *     tags: [Vítimas]
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
 *       - name: casoId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "CasoId"
 *     responses:
 *       200:
 *         description: Lista de vítimas paginada
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
 *                         $ref: '#/models/Vitima'
 *       400:
 *         description: Parâmetros de paginação ou casoId inválidos
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Caso ou vítimas não encontrados
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/paginado/:pagina/:quantidade', verifyToken, async (req, res) => {
    try {
        const pagina = parseInt(req.params.pagina);
        const quantidade = parseInt(req.params.quantidade);
        const { casoId } = req.query;

        // Validação dos parâmetros
        if (isNaN(pagina) || pagina < 1 || isNaN(quantidade) || quantidade < 1) {
            return res.status(400).json({ success: false, error: 'Página e quantidade devem ser números inteiros positivos' });
        }

        if (!mongoose.Types.ObjectId.isValid(casoId)) {
            return res.status(400).json({ success: false, error: 'ID do caso inválido' });
        }

        const caso = await Caso.findById(casoId);
        if (!caso) {
            return res.status(404).json({ success: false, error: 'Caso não encontrado' });
        }

        // Contar o total de registros
        const totalRegistro = await Vitima.countDocuments({ casoId });

        // Verificar se há registros disponíveis
        if (totalRegistro === 0) {
            return res.status(404).json({ success: false, error: 'Nenhuma vítima encontrada para o caso' });
        }

        // Calcular o número de documentos a pular
        const skip = (pagina - 1) * quantidade;

        // Buscar as vítimas paginadas
        const registros = await Vitima.find({ casoId })
            .skip(skip)
            .limit(quantidade);

        // Verificar se há registros na página solicitada
        if (registros.length === 0) {
            return res.status(404).json({ success: false, error: `Nenhuma vítima encontrada na página ${pagina}` });
        }

        res.json({
            success: true,
            resultado: {
                totalRegistro,
                registros,
            },
        });
    } catch (error) {
        console.error('Erro ao listar vítimas paginadas:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao listar vítimas paginadas', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/vitimas/{id}:
 *   put:
 *     summary: Atualiza uma vítima
 *     tags: [Vítimas]
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
 *               casoId:
 *                 type: string
 *                 example: "CasoId"
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               genero:
 *                 type: string
 *                 example: "Masculino"
 *               idade:
 *                 type: number
 *                 example: 30
 *               cpf:
 *                 type: string
 *                 example: "123.456.789-00"
 *               endereco:
 *                 type: string
 *                 example: "Rua Exemplo, 123"
 *               etnia:
 *                 type: string
 *                 enum: ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não identificado"]
 *                 example: "Branca"
 *               anotacaoAnatomia:
 *                 type: string
 *                 example: "Observações sobre anatomia"
 *               odontograma:
 *                 type: object
 *                 properties:
 *                   superiorEsquerdo:
 *                     type: array
 *                     items:
 *                       type: string
 *                   superiorDireito:
 *                     type: array
 *                     items:
 *                       type: string
 *                   inferiorEsquerdo:
 *                     type: array
 *                     items:
 *                       type: string
 *                   inferiorDireito:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Vítima atualizada com sucesso
 *       400:
 *         description: Erro de validação ou ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Vítima ou caso não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', verifyToken, validarVitima, verificarErrosValidacao, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID inválido' });
        }

        const vitima = await Vitima.findById(req.params.id);
        if (!vitima) {
            return res.status(404).json({ success: false, error: 'Vítima não encontrada' });
        }

        if (req.body.casoId) {
            const caso = await Caso.findById(req.body.casoId);
            if (!caso) {
                return res.status(404).json({ success: false, error: 'Caso não encontrado' });
            }
        }

        const vitimaAtualizada = await Vitima.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        res.json({ success: true, vitimaAtualizada });
    } catch (error) {
        console.error('Erro ao atualizar vítima:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao atualizar vítima', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/vitimas/{id}:
 *   delete:
 *     summary: Deleta uma vítima por ID
 *     tags: [Vítimas]
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
 *         description: Vítima deletada com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Vítima não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'ID inválido' });
        }

        const vitima = await Vitima.findByIdAndDelete(req.params.id);
        if (!vitima) {
            return res.status(404).json({ success: false, error: 'Vítima não encontrada' });
        }
        res.json({ success: true, message: 'Vítima deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar vítima:', error.message);
        res.status(500).json({ success: false, error: 'Erro ao deletar vítima', detalhes: error.message });
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Vitima:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID da vítima
 *         casoId:
 *           type: string
 *           description: ID do caso associado
 *         NIC:
 *           type: string
 *           description: Número de Identificação Criminal (único, gerado automaticamente)
 *         nome:
 *           type: string
 *           description: Nome da vítima
 *         genero:
 *           type: string
 *           description: Gênero da vítima
 *         idade:
 *           type: number
 *           nullable: true
 *           description: Idade da vítima
 *         cpf:
 *           type: string
 *           description: CPF da vítima
 *         endereco:
 *           type: string
 *           description: Endereço da vítima
 *         etnia:
 *           type: string
 *           enum: ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não identificado"]
 *           description: Etnia da vítima
 *         odontograma:
 *           type: object
 *           properties:
 *             superiorEsquerdo:
 *               type: array
 *               items:
 *                 type: string
 *             superiorDireito:
 *               type: array
 *               items:
 *                 type: string
 *             inferiorEsquerdo:
 *               type: array
 *               items:
 *                 type: string
 *             inferiorDireito:
 *               type: array
 *               items:
 *                 type: string
 *           description: Odontograma da vítima
 *         anotacaoAnatomia:
 *           type: string
 *           description: Anotações anatômicas da vítima
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 */

module.exports = router;