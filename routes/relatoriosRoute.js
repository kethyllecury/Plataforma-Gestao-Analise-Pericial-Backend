const express = require('express');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const Relatorio = require('../models/Relatorio');
const { fazerUploadArquivoGridFS, obterArquivoGridFS } = require('../utils/gridfs');
const { validarGerarRelatorio, validarAssinarRelatorio } = require('../validators/relatoriosValidator');
const { verificarErrosValidacao } = require('../utils/validacao');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Endpoints para gestão de relatórios
 */

const gerarPDF = (conteudo, assinatura = null) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        doc.text(conteudo);
        if (assinatura) {
            doc.text(`Assinado por: ${assinatura}`, { align: 'right' });
        }
        doc.end();
    });
};

/**
 * @swagger
 * /api/relatorios:
 *   post:
 *     summary: Gera um novo relatório
 *     tags: [Relatórios]
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
 *                 example: "someCasoId"
 *               conteudo:
 *                 type: string
 *                 example: "Conteúdo do relatório"
 *     responses:
 *       200:
 *         description: Relatório gerado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', verifyToken, validarGerarRelatorio, verificarErrosValidacao, async (req, res) => {
    const { casoId, conteudo } = req.body;
    try {
        const pdfBuffer = await gerarPDF(conteudo);
        const nomeArquivo = `relatorio-${casoId}-${Date.now()}.pdf`;
        const arquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { casoId });

        const relatorio = await Relatorio.create({
            casoId,
            conteudo,
            arquivoId,
            nomeArquivo,
            assinado: false,
        });

        res.json({ success: true, relatorio });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ success: false, erro: 'Erro ao gerar relatório' });
    }
});

/**
 * @swagger
 * /api/relatorios/{id}/assinar:
 *   put:
 *     summary: Adiciona assinatura a um relatório
 *     tags: [Relatórios]
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
 *               assinatura:
 *                 type: string
 *                 example: "Assinatura do perito"
 *     responses:
 *       200:
 *         description: Relatório assinado com sucesso
 *       404:
 *         description: Relatório não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id/assinar', verifyToken, validarAssinarRelatorio, verificarErrosValidacao, async (req, res) => {
    const { id } = req.params;
    const { assinatura } = req.body;

    try {
        const relatorio = await Relatorio.findById(id);
        if (!relatorio) {
            return res.status(404).json({ success: false, erro: 'Relatório não encontrado' });
        }

        const pdfBuffer = await gerarPDF(relatorio.conteudo, assinatura);
        const nomeArquivo = `relatorio-${relatorio.casoId}-assinado-${Date.now()}.pdf`;
        const novoArquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { casoId: relatorio.casoId });

        relatorio.arquivoId = novoArquivoId;
        relatorio.nomeArquivo = nomeArquivo;
        relatorio.assinatura = assinatura;
        relatorio.assinado = true;
        await relatorio.save();

        res.json({ success: true, relatorio });
    } catch (error) {
        console.error('Erro ao assinar relatório:', error);
        res.status(500).json({ success: false, erro: 'Erro ao assinar relatório' });
    }
});

/**
 * @swagger
 * /api/relatorios/{arquivoId}:
 *   get:
 *     summary: Recupera um arquivo de relatório
 *     tags: [Relatórios]
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
 *         description: Arquivo de relatório recuperado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Relatório não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:arquivoId', verifyToken, async (req, res) => {
    try {
        const arquivoId = new mongoose.Types.ObjectId(req.params.arquivoId);
        const relatorio = await Relatorio.findOne({ arquivoId });

        if (!relatorio) {
            return res.status(404).json({ success: false, erro: 'Relatório não encontrado' });
        }

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${relatorio.nomeArquivo}"`);

        const downloadStream = obterArquivoGridFS(arquivoId);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Erro ao recuperar relatório:', err);
            res.status(500).json({ success: false, erro: 'Erro ao recuperar relatório' });
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ success: false, erro: 'Erro ao recuperar relatório' });
    }
});

module.exports = router;