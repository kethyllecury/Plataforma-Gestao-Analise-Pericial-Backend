const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Evidencia = require('../models/Evidencia');
const { fazerUploadArquivoGridFS, inicializarGridFS, obterArquivoGridFS } = require('../utils/gridfs');
const { validarUploadEvidencia, validarListarEvidencias } = require('../validators/evidenciasValidator');
const { verificarErrosValidacao } = require('../utils/validacao');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Evidências
 *   description: Endpoints para gestão de evidências
 */

let gfs;
mongoose.connection.once('open', () => {
    gfs = inicializarGridFS();
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
});

/**
 * @swagger
 * /api/evidencias:
 *   post:
 *     summary: Faz upload de uma nova evidência
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *               casoId:
 *                 type: string
 *                 example: "someCasoId"
 *               tipoEvidencia:
 *                 type: string
 *                 enum: ["radiografia", "odontograma", "outro"]
 *                 example: "radiografia"
 *               descricao:
 *                 type: string
 *                 example: "Descrição da evidência"
 *     responses:
 *       201:
 *         description: Evidência criada com sucesso
 *       400:
 *         description: Nenhum arquivo enviado ou erro de validação
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', upload.single('arquivo'), validarUploadEvidencia, verificarErrosValidacao, async (req, res) => {
    const { casoId, tipoEvidencia, descricao } = req.body;
    const arquivo = req.file;

    if (!arquivo) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    try {
        const arquivoId = await fazerUploadArquivoGridFS(arquivo.buffer, arquivo.originalname, { casoId, tipoEvidencia, descricao });
        const evidencia = await Evidencia.create({
            casoId,
            arquivoId,
            nomeArquivo: arquivo.originalname,
            tipoArquivo: arquivo.mimetype,
            tipoEvidencia,
            descricao,
        });
        res.status(201).json(evidencia);
    } catch (error) {
        console.error('Erro ao salvar evidência:', error);
        res.status(500).json({ erro: 'Erro ao fazer upload de evidência' });
    }
});

/**
 * @swagger
 * /api/evidencias:
 *   get:
 *     summary: Lista evidências por caso
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: casoId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "someCasoId"
 *     responses:
 *       200:
 *         description: Lista de evidências
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', validarListarEvidencias, verificarErrosValidacao, async (req, res) => {
    const { casoId } = req.query;
    try {
        const evidencias = await Evidencia.find({ casoId });
        res.json(evidencias);
    } catch (error) {
        console.error('Erro ao listar evidências:', error);
        res.status(500).json({ erro: 'Erro ao listar evidências' });
    }
});

/**
 * @swagger
 * /api/evidencias/{arquivoId}:
 *   get:
 *     summary: Recupera um arquivo de evidência
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: arquivoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arquivo de evidência recuperado
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Evidência não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:arquivoId', async (req, res) => {
    try {
        const arquivoId = new mongoose.Types.ObjectId(req.params.arquivoId);
        const arquivo = await Evidencia.findOne({ arquivoId });

        if (!arquivo) {
            return res.status(404).json({ erro: 'Evidência não encontrada' });
        }

        res.set('Content-Type', arquivo.tipoArquivo);
        res.set('Content-Disposition', `inline; filename="${arquivo.nomeArquivo}"`);

        const downloadStream = obterArquivoGridFS(arquivoId);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Erro ao recuperar arquivo:', err);
            res.status(500).json({ erro: 'Erro ao recuperar arquivo' });
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ erro: 'Erro ao recuperar arquivo' });
    }
});

module.exports = router;