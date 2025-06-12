const express = require('express');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const axios = require('axios');

const Laudo = require('../models/Laudo');
const Evidencia = require('../models/Evidencia');
const Caso = require('../models/Caso');
const Usuario = require('../models/Usuario');
const Auditoria = require('../models/Auditoria');
const { fazerUploadArquivoGridFS, obterArquivoGridFS } = require('../utils/gridfs');
const { verificarErrosValidacao } = require('../utils/validacao');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * @swagger
 * tags:
 *   name: Laudos
 *   description: Endpoints para gestão de laudos periciais
 */

/**
 * Gera conteúdo do laudo usando a API Gemini com retry
 * @param {Object} evidencia - Dados da evidência
 * @param {Object} caso - Dados do caso associado
 * @param {number} [retries=3] - Número de tentativas
 * @param {number} [delay=1000] - Atraso inicial em ms
 * @returns {Promise<string>} - Conteúdo gerado
 */
const gerarConteudoLaudoGemini = async (evidencia, caso, retries = 3, delay = 1000) => {
    let prompt = `Gere um laudo pericial técnico e detalhado para a seguinte evidência criminal, com foco em análise odonto-pericial, considerando o contexto do caso associado:\n\n`;
    prompt += `Contexto do Caso:\n`;
    prompt += `ID do Caso: ${caso._id}\n`;
    prompt += `Nome: ${caso.nome}\n`;
    prompt += `Tipo: ${caso.tipo}\n`;
    prompt += `Local: ${caso.local}\n`;
    prompt += `Descrição: ${caso.descricao}\n\n`;

    prompt += `Detalhes da Evidência:\n`;
    prompt += `ID da Evidência: ${evidencia._id}\n`;
    prompt += `Título: ${evidencia.tituloEvidencia}\n`;
    prompt += `Tipo: ${evidencia.tipoEvidencia}\n`;
    prompt += `Descrição: ${evidencia.descricao || 'N/A'}\n`;
    prompt += `Coletado Por: ${evidencia.coletadoPor}\n`;
    prompt += `Data de Criação: ${evidencia.createdAt.toLocaleString('pt-BR')}\n`;
    prompt += `Nome do Arquivo: ${evidencia.nomeArquivo}\n`;
    prompt += `Tipo do Arquivo: ${evidencia.tipoArquivo}\n`;
    prompt += `Localização: ${evidencia.localizacao && evidencia.localizacao.coordinates ? `[${evidencia.localizacao.coordinates.join(', ')}]` : 'N/A'}\n\n`;

    prompt += `Com base nessas informações, analise a evidência (especialmente se for radiografia ou odontograma) no contexto do caso e forneça uma avaliação técnica detalhada, incluindo possíveis implicações forenses e recomendações para investigações adicionais. O laudo deve ser conciso, objetivo e baseado estritamente nos dados fornecidos.`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(GEMINI_API_URL, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
            });

            if (response.data.candidates && response.data.candidates[0].content && response.data.candidates[0].content.parts) {
                return response.data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Resposta da API Gemini não contém o conteúdo esperado.');
            }
        } catch (error) {
            if (error.response && error.response.status === 429 && attempt < retries) {
                console.warn(`Erro 429 na tentativa ${attempt}. Aguardando ${delay}ms antes de tentar novamente.`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Backoff exponencial
            } else {
                console.error('Erro ao chamar Gemini API:', error.message);
                throw new Error(`Falha ao gerar conteúdo do laudo: ${error.message}`);
            }
        }
    }
};

/**
 * Gera um PDF com título, dados da evidência, imagem (se aplicável), conteúdo e assinatura
 * @param {string} titulo - Título do laudo
 * @param {Object} evidencia - Dados da evidência
 * @param {string} conteudo - Conteúdo gerado pela IA
 * @param {string} [assinatura] - Assinatura do perito (opcional)
 * @returns {Promise<Buffer>} - Buffer do PDF gerado
 */
const gerarPDF = async (titulo, evidencia, conteudo, assinatura = null) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Título do Laudo
        doc.fontSize(20).text(titulo, { align: 'center' });
        doc.moveDown(2);

        // Seção: Detalhes da Evidência
        doc.fontSize(16).text('Detalhes da Evidência', { underline: true });
        doc.moveDown();
        doc.fontSize(12)
            .text(`Título: ${evidencia.tituloEvidencia}`)
            .text(`Tipo: ${evidencia.tipoEvidencia}`)
            .text(`Descrição: ${evidencia.descricao || 'N/A'}`)
            .text(`Coletado Por: ${evidencia.coletadoPor}`)
            .text(`Data de Criação: ${evidencia.createdAt.toLocaleString('pt-BR')}`)
            .text(`Nome do Arquivo: ${evidencia.nomeArquivo}`)
            .text(`Tipo do Arquivo: ${evidencia.tipoArquivo}`)
            .text(`Localização: ${evidencia.localizacao && evidencia.localizacao.coordinates ? `[${evidencia.localizacao.coordinates.join(', ')}]` : 'N/A'}`);
        doc.moveDown(2);

        // Sessão: Imagem da Evidência (se for imagem)
        if (['image/jpeg', 'image/png'].includes(evidencia.tipoArquivo)) {
            const downloadStream = obterArquivoGridFS(evidencia.arquivoId);
            let imageBuffer = Buffer.alloc(0);

            downloadStream.on('data', (chunk) => {
                imageBuffer = Buffer.concat([imageBuffer, chunk]);
            });

            downloadStream.on('end', () => {
                try {
                    doc.fontSize(16).text('Imagem da Evidência', { underline: true });
                    doc.moveDown();
                    doc.image(imageBuffer, { fit: [400, 400], align: 'center' });
                    doc.moveDown(2);
                } catch (error) {
                    console.error('Erro ao inserir imagem no PDF:', error);
                    doc.fontSize(12).text('Erro ao carregar imagem da evidência.', { align: 'center' });
                    doc.moveDown(2);
                }
                // Continuar com as seções restantes
                finalizarPDF(doc, conteudo, assinatura);
            });

            downloadStream.on('error', (err) => {
                console.error('Erro ao recuperar imagem:', err);
                doc.fontSize(12).text('Erro ao carregar imagem da evidência.', { align: 'center' });
                doc.moveDown(2);
                // Continuar com as seções restantes
                finalizarPDF(doc, conteudo, assinatura);
            });

            return;
        }

        // Se não for imagem, continuar normalmente
        finalizarPDF(doc, conteudo, assinatura);
    });

    function finalizarPDF(doc, conteudo, assinatura) {
        // Seção: Laudo Pericial
        doc.fontSize(16).text('Laudo Pericial', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(conteudo);
        doc.moveDown(2);

        // Assinatura
        if (assinatura) {
            doc.fontSize(12).text(`Assinado por: ${assinatura}`, { align: 'right' });
        }

        doc.end();
    }
};

/**
 * @swagger
 * /api/laudos:
 *   get:
 *     summary: Lista todos os laudos com filtro opcional por evidenciaId
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evidenciaId
 *         in: query
 *         schema:
 *           type: string
 *         description: ID da evidência para filtrar os laudos
 *     responses:
 *       200:
 *         description: Lista de laudos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 laudos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Laudo'
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { evidenciaId } = req.query;
        const filtro = {};
        if (evidenciaId && mongoose.Types.ObjectId.isValid(evidenciaId)) {
            filtro.evidenciaId = evidenciaId;
        }
        const laudos = await Laudo.find(filtro).populate('peritoResponsavel', 'nome');
        res.json({ success: true, laudos });
    } catch (error) {
        console.error('Erro ao listar laudos:', error);
        res.status(500).json({ success: false, erro: 'Erro ao listar laudos', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/laudos/{id}:
 *   get:
 *     summary: Obtém um laudo por ID
 *     tags: [Laudos]
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
 *         description: Laudo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 laudo:
 *                   $ref: '#/components/schemas/Laudo'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Laudo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, erro: 'ID inválido' });
        }
        const laudo = await Laudo.findById(id).populate('peritoResponsavel', 'nome');
        if (!laudo) {
            return res.status(404).json({ success: false, erro: 'Laudo não encontrado' });
        }
        res.json({ success: true, laudo });
    } catch (error) {
        console.error('Erro ao obter laudo:', error);
        res.status(500).json({ success: false, erro: 'Erro ao obter laudo', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/laudos:
 *   post:
 *     summary: Gera um novo laudo pericial com conteúdo gerado por IA para uma evidência
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               evidenciaId:
 *                 type: string
 *                 example: "EvidenciaId"
 *               titulo:
 *                 type: string
 *                 example: "Laudo Forense"
 *               peritoResponsavel:
 *                 type: string
 *                 example: "UsuarioId"
 *     responses:
 *       201:
 *         description: Laudo gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 laudo:
 *                   $ref: '#/components/schemas/Laudo'
 *       400:
 *         description: Erro de validação, perito inválido ou evidência não encontrada
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', verifyToken, verificarErrosValidacao, async (req, res) => {
    const { evidenciaId, titulo, peritoResponsavel } = req.body;
    try {
        // Validar perito
        const perito = await Usuario.findById(peritoResponsavel).select('nome cargo');
        if (!perito) {
            return res.status(400).json({ success: false, erro: 'Perito não encontrado' });
        }
        if (perito.cargo !== 'perito') {
            return res.status(400).json({ success: false, erro: 'O usuário especificado não é um perito' });
        }

        // Buscar evidência
        const evidencia = await Evidencia.findById(evidenciaId).populate('coletadoPor', 'nome email');
        if (!evidencia) {
            return res.status(400).json({ success: false, erro: 'Evidência não encontrada' });
        }

        // Buscar caso associado
        const caso = await Caso.findById(evidencia.casoId);
        if (!caso) {
            return res.status(400).json({ success: false, erro: 'Caso associado não encontrado' });
        }

        // Gerar conteúdo com Gemini
        let conteudo;
        try {
            conteudo = await gerarConteudoLaudoGemini(evidencia, caso);
        } catch (error) {
            console.warn('Usando conteúdo fallback devido a falha na API Gemini:', error.message);
            conteudo = `Laudo pericial não pôde ser gerado automaticamente devido a uma falha na API de geração de conteúdo. Detalhes da evidência:\n\n` +
                       `Título: ${evidencia.tituloEvidencia}\n` +
                       `Tipo: ${evidencia.tipoEvidencia}\n` +
                       `Descrição: ${evidencia.descricao || 'N/A'}\n` +
                       `Coletado Por: ${evidencia.coletadoPor}\n` +
                       `Localização: ${evidencia.localizacao && evidencia.localizacao.coordinates ? `[${evidencia.localizacao.coordinates.join(', ')}]` : 'N/A'}\n` +
                       `Recomenda-se análise manual pelo perito responsável.`;
        }

        // Gerar PDF
        const pdfBuffer = await gerarPDF(titulo, evidencia, conteudo);
        const nomeArquivo = `laudo-${evidenciaId}-${Date.now()}.pdf`;
        const arquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { evidenciaId });

        // Criar laudo
        const laudo = await Laudo.create({
            evidenciaId,
            titulo,
            conteudo,
            arquivoId,
            nomeArquivo,
            peritoResponsavel,
            assinado: false,
        });

        // Registrar log de auditoria
        await Auditoria.create({
            usuarioId: req.usuario.id,
            acao: 'Criação de Laudo',
            entidade: 'Laudo',
            entidadeId: laudo._id,
            detalhes: `Laudo "${titulo}" criado para a evidência ${evidenciaId}`,
        });

        res.status(201).json({ success: true, laudo });
    } catch (error) {
        console.error('Erro ao gerar laudo:', error);
        res.status(500).json({ success: false, erro: 'Erro ao gerar laudo', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/laudos/{id}/assinar:
 *   post:
 *     summary: Adiciona assinatura a um laudo
 *     tags: [Laudos]
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
 *         description: Laudo assinado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 laudo:
 *                   $ref: '#/components/schemas/Laudo'
 *       400:
 *         description: Erro de validação ou ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Laudo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/assinar', verifyToken, verificarErrosValidacao, async (req, res) => {
    const { id } = req.params;
    const { assinatura } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, erro: 'ID inválido' });
        }

        const laudo = await Laudo.findById(id);
        if (!laudo) {
            return res.status(404).json({ success: false, erro: 'Laudo não encontrado' });
        }

        // Buscar evidência
        const evidencia = await Evidencia.findById(laudo.evidenciaId).populate('coletadoPor', 'nome email');
        if (!evidencia) {
            return res.status(400).json({ success: false, erro: 'Evidência não encontrada' });
        }

        // Buscar caso associado
        const caso = await Caso.findById(evidencia.casoId);
        if (!caso) {
            return res.status(400).json({ success: false, erro: 'Caso associado não encontrado' });
        }

        // Regenerar conteúdo com Gemini
        let conteudo;
        try {
            conteudo = await gerarConteudoLaudoGemini(evidencia, caso);
        } catch (error) {
            console.warn('Usando conteúdo fallback devido a falha na API Gemini:', error.message);
            conteudo = `Laudo pericial não pôde ser gerado automaticamente devido a uma falha na API de geração de conteúdo. Detalhes da evidência:\n\n` +
                       `Título: ${evidencia.tituloEvidencia}\n` +
                       `Tipo: ${evidencia.tipoEvidencia}\n` +
                       `Descrição: ${evidencia.descricao || 'N/A'}\n` +
                       `Coletado Por: ${evidencia.coletadoPor}\n` +
                       `Localização: ${evidencia.localizacao && evidencia.localizacao.coordinates ? `[${evidencia.localizacao.coordinates.join(', ')}]` : 'N/A'}\n` +
                       `Recomenda-se análise manual pelo perito responsável.`;
        }

        // Regenerar PDF com assinatura
        const pdfBuffer = await gerarPDF(laudo.titulo, evidencia, conteudo, assinatura);
        const nomeArquivo = `laudo-${laudo.evidenciaId}-assinado-${Date.now()}.pdf`;
        const novoArquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { evidenciaId: laudo.evidenciaId });

        // Atualizar laudo
        laudo.conteudo = conteudo;
        laudo.arquivoId = novoArquivoId;
        laudo.nomeArquivo = nomeArquivo;
        laudo.assinatura = assinatura;
        laudo.assinado = true;
        await laudo.save();

        // Registrar log de auditoria
        await Auditoria.create({
            usuarioId: req.usuario.id,
            acao: 'Assinatura de Laudo',
            entidade: 'Laudo',
            entidadeId: laudo._id,
            detalhes: `Laudo "${laudo.titulo}" assinado para a evidência ${laudo.evidenciaId}`,
        });

        res.json({ success: true, laudo });
    } catch (error) {
        console.error('Erro ao assinar laudo:', error);
        res.status(500).json({ success: false, erro: 'Erro ao assinar laudo', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/laudos/{arquivoId}:
 *   get:
 *     summary: Recupera um arquivo de laudo por arquivoId
 *     tags: [Laudos]
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
 *         description: Arquivo de laudo recuperado com sucesso
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Laudo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:arquivoId', verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.arquivoId)) {
            return res.status(400).json({ success: false, erro: 'ID inválido' });
        }

        const arquivoId = new mongoose.Types.ObjectId(req.params.arquivoId);
        const laudo = await Laudo.findOne({ arquivoId });

        if (!laudo) {
            return res.status(404).json({ success: false, erro: 'Laudo não encontrado' });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${laudo.nomeArquivo}"`
        });

        const downloadStream = obterArquivoGridFS(arquivoId);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Erro ao recuperar arquivo:', err);
            res.status(500).json({ success: false, erro: 'Erro ao recuperar arquivo', detalhes: err.message });
        });
    } catch (error) {
        console.error('Erro ao buscar laudo:', error);
        res.status(500).json({ success: false, erro: 'Erro ao recuperar laudo', detalhes: error.message });
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Laudo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         evidenciaId:
 *           type: string
 *         titulo:
 *           type: string
 *         conteudo:
 *           type: string
 *         arquivoId:
 *           type: string
 *         nomeArquivo:
 *           type: string
 *         peritoResponsavel:
 *           type: string
 *         assinatura:
 *           type: string
 *           nullable: true
 *         assinado:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
module.exports = router;