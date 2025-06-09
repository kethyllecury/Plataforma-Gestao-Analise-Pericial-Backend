const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const Evidencia = require('../models/Evidencia');
const { fazerUploadArquivoGridFS, inicializarGridFS, obterArquivoGridFS } = require('../utils/gridfs');
const { validarUploadEvidencia } = require('../validators/evidenciasValidator');
const { verificarErrosValidacao } = require('../utils/validacao');
const { verifyToken } = require('../middleware/auth');

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
 *                 example: "CasoId"
 *               tituloEvidencia:
 *                 type: string
 *                 example: "Radiografia frontal"
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
router.post('/', verifyToken, upload.single('arquivo'), validarUploadEvidencia, verificarErrosValidacao, async (req, res) => {
    const { casoId, tituloEvidencia, tipoEvidencia, descricao } = req.body;
    const arquivo = req.file;

    if (!arquivo) {
        return res.status(400).json({ success: false, erro: 'Nenhum arquivo enviado' });
    }

    try {
        const arquivoId = await fazerUploadArquivoGridFS(arquivo.buffer, arquivo.originalname, { casoId, tipoEvidencia, descricao });
        const evidencia = await Evidencia.create({
            casoId,
            tituloEvidencia,
            arquivoId,
            nomeArquivo: arquivo.originalname,
            tipoArquivo: arquivo.mimetype,
            tipoEvidencia,
            descricao,
            coletadoPor: req.usuario._id, // Preenchido com o ID do usuário autenticado
        });
        res.status(201).json({ success: true, evidencia });
    } catch (error) {
        console.error('Erro ao salvar evidência:', error);
        res.status(500).json({ success: false, erro: 'Erro ao fazer upload de evidência', detalhes: error.message });
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
 *           example: "CasoId"
 *     responses:
 *       200:
 *         description: Lista de evidências
 *       400:
 *         description: Erro de validação
 *       403:
 *         description: Acesso não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', verifyToken, verificarErrosValidacao, async (req, res) => {
    const { casoId } = req.query;
    try {
        const evidencias = await Evidencia.find({ casoId });
        res.json({ success: true, evidencias });
    } catch (error) {
        console.error('Erro ao listar evidências:', error);
        res.status(500).json({ success: false, erro: 'Erro ao listar evidências', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/evidencias/arquivo/{arquivoId}:
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
 *       403:
 *         description: Acesso não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/arquivo/:arquivoId', verifyToken, async (req, res) => {
    try {
        const arquivoId = new mongoose.Types.ObjectId(req.params.arquivoId);
        const arquivo = await Evidencia.findOne({ arquivoId });

        if (!arquivo) {
            return res.status(404).json({ success: false, erro: 'Evidência não encontrada' });
        }

        res.set('Content-Type', arquivo.tipoArquivo);
        res.set('Content-Disposition', `inline; filename="${arquivo.nomeArquivo}"`);

        const downloadStream = obterArquivoGridFS(arquivoId);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Erro ao recuperar arquivo:', err);
            res.status(500).json({ success: false, erro: 'Erro ao recuperar arquivo', detalhes: err.message });
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ success: false, erro: 'Erro ao recuperar arquivo', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/evidencias/{evidenciaId}:
 *   get:
 *     summary: Recupera os metadados de uma evidência específica
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evidenciaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "EvidenciaId"
 *     responses:
 *       200:
 *         description: Metadados da evidência recuperados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 evidencia:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     casoId:
 *                       type: string
 *                     tituloEvidencia:
 *                       type: string
 *                     arquivoId:
 *                       type: string
 *                     nomeArquivo:
 *                       type: string
 *                     tipoArquivo:
 *                       type: string
 *                     tipoEvidencia:
 *                       type: string
 *                       enum: ["radiografia", "odontograma", "outro"]
 *                     descricao:
 *                       type: string
 *                     coletadoPor:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Evidência não encontrada
 *       403:
 *         description: Acesso não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:evidenciaId', verifyToken, async (req, res) => {
    const { evidenciaId } = req.params;
    try {
        const evidencia = await Evidencia.findById(evidenciaId);
        if (!evidencia) {
            return res.status(404).json({ success: false, erro: 'Evidência não encontrada' });
        }
        res.json({ success: true, evidencia });
    } catch (error) {
        console.error('Erro ao buscar evidência:', error);
        res.status(500).json({ success: false, erro: 'Erro ao buscar evidência', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/evidencias/{evidenciaId}:
 *   put:
 *     summary: Atualiza uma evidência
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evidenciaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Novo arquivo (opcional)
 *               tituloEvidencia:
 *                 type: string
 *                 example: "Nova radiografia frontal"
 *               tipoEvidencia:
 *                 type: string
 *                 enum: ["radiografia", "odontograma", "outro"]
 *                 example: "radiografia"
 *               descricao:
 *                 type: string
 *                 example: "Nova descrição da evidência"
 *     responses:
 *       200:
 *         description: Evidência atualizada com sucesso
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Evidência não encontrada
 *       403:
 *         description: Acesso não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:evidenciaId', verifyToken, upload.single('arquivo'), validarUploadEvidencia, verificarErrosValidacao, async (req, res) => {
    const { evidenciaId } = req.params;
    const { tituloEvidencia, tipoEvidencia, descricao } = req.body;
    const arquivo = req.file;

    try {
        const evidencia = await Evidencia.findById(evidenciaId);
        if (!evidencia) {
            return res.status(404).json({ success: false, erro: 'Evidência não encontrada' });
        }

        evidencia.tituloEvidencia = tituloEvidencia || evidencia.tituloEvidencia;
        evidencia.tipoEvidencia = tipoEvidencia || evidencia.tipoEvidencia;
        evidencia.descricao = descricao || evidencia.descricao;
        evidencia.coletadoPor = req.usuario._id; // Atualiza o coletadoPor com o usuário autenticado

        if (arquivo) {
            await gfs.delete(new mongoose.Types.ObjectId(evidencia.arquivoId));
            const novoArquivoId = await fazerUploadArquivoGridFS(arquivo.buffer, arquivo.originalname, {
                casoId: evidencia.casoId,
                tipoEvidencia,
                descricao
            });
            evidencia.arquivoId = novoArquivoId;
            evidencia.nomeArquivo = arquivo.originalname;
            evidencia.tipoArquivo = arquivo.mimetype;
        }

        await evidencia.save();
        res.json({ success: true, evidencia });
    } catch (error) {
        console.error('Erro ao atualizar evidência:', error);
        res.status(500).json({ success: false, erro: 'Erro ao atualizar evidência', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/evidencias/{evidenciaId}:
 *   delete:
 *     summary: Deleta uma evidência e seu arquivo associado
 *     tags: [Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evidenciaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evidência deletada com sucesso
 *       404:
 *         description: Evidência não encontrada
 *       403:
 *         description: Acesso não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:evidenciaId', verifyToken, async (req, res) => {
    const { evidenciaId } = req.params;
    try {
        const evidencia = await Evidencia.findById(evidenciaId);
        if (!evidencia) {
            return res.status(404).json({ success: false, erro: 'Evidência não encontrada' });
        }

        await gfs.delete(new mongoose.Types.ObjectId(evidencia.arquivoId));
        await Evidencia.findByIdAndDelete(evidenciaId);

        res.json({ success: true, message: 'Evidência e arquivo deletados com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar evidência:', error);
        res.status(500).json({ success: false, erro: 'Erro ao deletar evidência', detalhes: error.message });
    }
});

module.exports = router;