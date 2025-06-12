const express = require('express');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const axios = require('axios');

const Relatorio = require('../models/Relatorio');
const Caso = require('../models/Caso');
const Evidencia = require('../models/Evidencia');
const Vitima = require('../models/Vitima');
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
 *   name: Relatórios
 *   description: Endpoints para gestão de relatórios
 */

/**
 * Gera conteúdo do relatório usando a API Gemini com retry
 * @param {Object} caso - Dados do caso
 * @param {Array} evidencias - Lista de evidências
 * @param {Array} vitimas - Lista de vítimas
 * @param {number} [retries=3] - Número de tentativas
 * @param {number} [delay=1000] - Atraso inicial em ms
 * @returns {Promise<string>} - Conteúdo gerado
 */
const gerarConteudoRelatorioGemini = async (caso, evidencias, vitimas, retries = 3, delay = 1000) => {
    // Buscar nome do perito se peritoResponsavel for um ID
    let peritoNome = 'N/A';
    if (caso.peritoResponsavel && mongoose.Types.ObjectId.isValid(caso.peritoResponsavel)) {
        const perito = await Usuario.findById(caso.peritoResponsavel).select('nome');
        peritoNome = perito ? perito.nome : 'N/A';
    }

    let prompt = `Gere um relatório pericial detalhado e técnico para o seguinte caso criminal, com foco em análise odonto-pericial:\n\n`;
    prompt += `ID do Caso: ${caso._id || 'N/A'}\n`;
    prompt += `Nome: ${caso.nome || 'N/A'}\n`;
    prompt += `Local: ${caso.local || 'N/A'}\n`;
    prompt += `Descrição: ${caso.descricao || 'N/A'}\n`;
    prompt += `Tipo: ${caso.tipo || 'N/A'}\n`;
    prompt += `Perito Responsável: ${peritoNome}\n`;
    prompt += `Status: ${caso.status || 'N/A'}\n`;
    prompt += `Data/Hora: ${caso.dataHora ? caso.dataHora.toLocaleString('pt-BR') : 'N/A'}\n`;
    prompt += `Criado em: ${caso.createdAt ? caso.createdAt.toLocaleString('pt-BR') : 'N/A'}\n`;
    prompt += `Data de Fechamento: ${caso.dataFechamento ? caso.dataFechamento.toLocaleString('pt-BR') : 'N/A'}\n\n`;

    prompt += `Evidências Associadas:\n`;
    if (evidencias.length === 0) {
        prompt += `Nenhuma evidência registrada.\n`;
    } else {
        evidencias.forEach((ev, index) => {
            prompt += `- Evidência ${index + 1}:\n`;
            prompt += `  Título: ${ev.tituloEvidencia || 'N/A'}\n`;
            prompt += `  Tipo: ${ev.tipoEvidencia || 'N/A'}\n`;
            prompt += `  Descrição: ${ev.descricao || 'N/A'}\n`;
            prompt += `  Coletado Por: ${ev.coletadoPor?.nome || 'N/A'}\n`;
            prompt += `  Data de Criação: ${ev.createdAt ? ev.createdAt.toLocaleString('pt-BR') : 'N/A'}\n`;
            prompt += `  Localização: ${ev.localizacao && ev.localizacao.coordinates ? `[${ev.localizacao.coordinates.join(', ')}]` : 'N/A'}\n`;
        });
    }
    prompt += `\n`;

    prompt += `Vítimas Associadas:\n`;
    if (vitimas.length === 0) {
        prompt += `Nenhuma vítima registrada.\n`;
    } else {
        vitimas.forEach((vitima, index) => {
            prompt += `- Vítima ${index + 1}:\n`;
            prompt += `  NIC: ${vitima.NIC || 'N/A'}\n`;
            prompt += `  Nome: ${vitima.nome || 'N/A'}\n`;
            prompt += `  Gênero: ${vitima.genero || 'N/A'}\n`;
            prompt += `  Idade: ${vitima.idade || 'N/A'}\n`;
            prompt += `  CPF: ${vitima.cpf || 'N/A'}\n`;
            prompt += `  Endereço: ${vitima.endereco || 'N/A'}\n`;
            prompt += `  Etnia: ${vitima.etnia || 'N/A'}\n`;
            prompt += `  Anotação Anatômica: ${vitima.anotacaoAnatomia || 'N/A'}\n`;
            prompt += `  Odontograma:\n`;
            prompt += `    Superior Esquerdo: ${vitima.odontograma?.superiorEsquerdo?.join(', ') || 'N/A'}\n`;
            prompt += `    Superior Direito: ${vitima.odontograma?.superiorDireito?.join(', ') || 'N/A'}\n`;
            prompt += `    Inferior Esquerdo: ${vitima.odontograma?.inferiorEsquerdo?.join(', ') || 'N/A'}\n`;
            prompt += `    Inferior Direito: ${vitima.odontograma?.inferiorDireito?.join(', ') || 'N/A'}\n`;
            prompt += `  Data de Criação: ${vitima.createdAt ? vitima.createdAt.toLocaleString('pt-BR') : 'N/A'}\n`;
        });
    }
    prompt += `\n`;

    prompt += `Com base nessas informações, gere um relatório técnico e objetivo, com ênfase na análise odonto-pericial. Analise as evidências (especialmente radiografias e odontogramas), correlacione com os odontogramas das vítimas, e apresente uma conclusão preliminar sobre a dinâmica provável dos fatos e linhas de investigação a seguir. O relatório deve ser conciso, estruturado e baseado estritamente nos dados fornecidos.`;

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
            if (error.response && [429, 503].includes(error.response.status) && attempt < retries) {
                console.warn(`Erro ${error.response.status} na tentativa ${attempt}. Aguardando ${delay}ms antes de tentar novamente.`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Backoff exponencial
            } else {
                console.error('Erro ao chamar Gemini API:', error.message);
                throw new Error(`Falha ao gerar conteúdo do relatório: ${error.message}`);
            }
        }
    }
};

/**
 * Gera um PDF com título, dados do caso, evidências, vítimas (com odontograma) e assinatura
 * @param {string} titulo - Título do relatório
 * @param {Object} caso - Dados do caso
 * @param {Array} evidencias - Lista de evidências
 * @param {Array} vitimas - Lista de vítimas
 * @param {string} conteudo - Conteúdo gerado pela IA
 * @param {string} [assinatura] - Assinatura do perito (opcional)
 * @returns {Promise<Buffer>} - Buffer do PDF gerado
 */
const gerarPDF = async (titulo, caso, evidencias, vitimas, conteudo, assinatura = null) => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Título do Relatório
        doc.fontSize(20).text(titulo, { align: 'center' });
        doc.moveDown(2);

        // Seção: Detalhes do Caso
        let peritoNome = 'N/A';
        if (caso.peritoResponsavel && mongoose.Types.ObjectId.isValid(caso.peritoResponsavel)) {
            const perito = await Usuario.findById(caso.peritoResponsavel).select('nome');
            peritoNome = perito ? perito.nome : 'N/A';
        }

        doc.fontSize(16).text('Detalhes do Caso', { underline: true });
        doc.moveDown();
        doc.fontSize(12)
            .text(`Nome: ${caso.nome || 'N/A'}`)
            .text(`Local: ${caso.local || 'N/A'}`)
            .text(`Descrição: ${caso.descricao || 'N/A'}`)
            .text(`Tipo: ${caso.tipo || 'N/A'}`)
            .text(`Perito Responsável: ${peritoNome}`)
            .text(`Status: ${caso.status || 'N/A'}`)
            .text(`Data/Hora: ${caso.dataHora ? caso.dataHora.toLocaleString('pt-BR') : 'N/A'}`)
            .text(`Criado em: ${caso.createdAt ? caso.createdAt.toLocaleString('pt-BR') : 'N/A'}`)
            .text(`Data de Fechamento: ${caso.dataFechamento ? caso.dataFechamento.toLocaleString('pt-BR') : 'N/A'}`);
        doc.moveDown(2);

        // Seção: Evidências
        doc.fontSize(16).text('Evidências', { underline: true });
        doc.moveDown();
        if (evidencias.length === 0) {
            doc.fontSize(12).text('Nenhuma evidência registrada.');
        } else {
            evidencias.forEach((ev, index) => {
                doc.fontSize(12)
                    .text(`Evidência ${index + 1}:`)
                    .text(`  Título: ${ev.tituloEvidencia || 'N/A'}`)
                    .text(`  Tipo: ${ev.tipoEvidencia || 'N/A'}`)
                    .text(`  Descrição: ${ev.descricao || 'N/A'}`)
                    .text(`  Coletado Por: ${ev.coletadoPor?.nome || 'N/A'}`)
                    .text(`  Data de Criação: ${ev.createdAt ? ev.createdAt.toLocaleString('pt-BR') : 'N/A'}`)
                    .text(`  Localização: ${ev.localizacao && ev.localizacao.coordinates ? `[${ev.localizacao.coordinates.join(', ')}]` : 'N/A'}`)
                    .moveDown();
            });
        }
        doc.moveDown(2);

        // Seção: Vítimas
        doc.fontSize(16).text('Vítimas', { underline: true });
        doc.moveDown();
        if (vitimas.length === 0) {
            doc.fontSize(12).text('Nenhuma vítima registrada.');
        } else {
            vitimas.forEach((vitima, index) => {
                doc.fontSize(12)
                    .text(`Vítima ${index + 1}:`)
                    .text(`  NIC: ${vitima.NIC || 'N/A'}`)
                    .text(`  Nome: ${vitima.nome || 'N/A'}`)
                    .text(`  Gênero: ${vitima.genero || 'N/A'}`)
                    .text(`  Idade: ${vitima.idade || 'N/A'}`)
                    .text(`  CPF: ${vitima.cpf || 'N/A'}`)
                    .text(`  Endereço: ${vitima.endereco || 'N/A'}`)
                    .text(`  Etnia: ${vitima.etnia || 'N/A'}`)
                    .text(`  Anotação Anatômica: ${vitima.anotacaoAnatomia || 'N/A'}`)
                    .text(`  Odontograma:`)
                    .text(`    Superior Esquerdo: ${vitima.odontograma?.superiorEsquerdo?.join(', ') || 'N/A'}`)
                    .text(`    Superior Direito: ${vitima.odontograma?.superiorDireito?.join(', ') || 'N/A'}`)
                    .text(`    Inferior Esquerdo: ${vitima.odontograma?.inferiorEsquerdo?.join(', ') || 'N/A'}`)
                    .text(`    Inferior Direito: ${vitima.odontograma?.inferiorDireito?.join(', ') || 'N/A'}`)
                    .moveDown();
            });
        }
        doc.moveDown(2);

        // Seção: Relatório Pericial
        doc.fontSize(16).text('Relatório Pericial', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(conteudo);
        doc.moveDown(2);

        // Assinatura
        if (assinatura) {
            doc.fontSize(12).text(`Assinado por: ${assinatura}`, { align: 'right' });
        }

        doc.end();
    });
};

/**
 * @swagger
 * /api/relatorios:
 *   post:
 *     summary: Gera um novo relatório com conteúdo gerado por IA para um caso
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
 *                 example: "CasoId"
 *               titulo:
 *                 type: string
 *                 example: "Relatório Forense"
 *               peritoResponsavel:
 *                 type: string
 *                 example: "UsuarioId"
 *     responses:
 *       201:
 *         description: Relatório gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 relatorio:
 *                   $ref: '#/components/schemas/Relatorio'
 *       400:
 *         description: Erro de validação, perito inválido ou caso não encontrado
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', verifyToken, verificarErrosValidacao, async (req, res) => {
    const { casoId, titulo, peritoResponsavel } = req.body;
    try {
        // Validar peritoResponsavel
        const perito = await Usuario.findById(peritoResponsavel).select('nome cargo');
        if (!perito) {
            return res.status(400).json({ success: false, erro: 'Perito não encontrado' });
        }
        if (perito.cargo !== 'perito') {
            return res.status(400).json({ success: false, erro: 'O usuário especificado não é um perito' });
        }

        // Buscar dados do caso
        const caso = await Caso.findById(casoId);
        if (!caso) {
            return res.status(400).json({ success: false, erro: 'Caso não encontrado' });
        }

        // Buscar evidências
        const evidencias = await Evidencia.find({ casoId }).populate('coletadoPor', 'nome email');

        // Buscar vítimas
        const vitimas = await Vitima.find({ casoId });

        // Gerar conteúdo com Gemini
        let conteudo;
        try {
            conteudo = await gerarConteudoRelatorioGemini(caso, evidencias, vitimas);
        } catch (error) {
            console.warn('Usando conteúdo fallback devido a falha na API Gemini:', error.message);
            // Buscar nome do perito para o fallback
            let peritoNome = 'N/A';
            if (caso.peritoResponsavel && mongoose.Types.ObjectId.isValid(caso.peritoResponsavel)) {
                const perito = await Usuario.findById(caso.peritoResponsavel).select('nome');
                peritoNome = perito ? perito.nome : 'N/A';
            }
            conteudo = `Relatório pericial não pôde ser gerado automaticamente devido a uma falha na API de geração de conteúdo. Detalhes do caso:\n\n` +
                       `Nome: ${caso.nome || 'N/A'}\n` +
                       `Local: ${caso.local || 'N/A'}\n` +
                       `Descrição: ${caso.descricao || 'N/A'}\n` +
                       `Tipo: ${caso.tipo || 'N/A'}\n` +
                       `Perito Responsável: ${peritoNome}\n` +
                       `Recomenda-se análise manual pelo perito responsável.`;
        }

        // Gerar PDF
        const pdfBuffer = await gerarPDF(titulo, caso, evidencias, vitimas, conteudo);
        const nomeArquivo = `relatorio-${casoId}-${Date.now()}.pdf`;
        const arquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { casoId });

        // Criar relatório
        const relatorio = await Relatorio.create({
            casoId,
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
            acao: 'Criação de Relatório',
            entidade: 'Relatorio',
            entidadeId: relatorio._id,
            detalhes: `Relatório "${titulo}" criado para o caso ${casoId}`,
        });

        res.status(201).json({ success: true, relatorio });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ success: false, erro: 'Erro ao gerar relatório', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/relatorios/{id}/assinar:
 *   post:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 relatorio:
 *                   $ref: '#/components/schemas/Relatorio'
 *       400:
 *         description: Erro de validação ou ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Relatório não encontrado
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

        const relatorio = await Relatorio.findById(id);
        if (!relatorio) {
            return res.status(404).json({ success: false, erro: 'Relatório não encontrado' });
        }

        // Buscar dados do caso
        const caso = await Caso.findById(relatorio.casoId);
        if (!caso) {
            return res.status(400).json({ success: false, erro: 'Caso não encontrado' });
        }

        // Buscar evidências
        const evidencias = await Evidencia.find({ casoId: relatorio.casoId }).populate('coletadoPor', 'nome email');

        // Buscar vítimas
        const vitimas = await Vitima.find({ casoId: relatorio.casoId });

        // Regenerar conteúdo com Gemini
        let conteudo;
        try {
            conteudo = await gerarConteudoRelatorioGemini(caso, evidencias, vitimas);
        } catch (error) {
            console.warn('Usando conteúdo fallback devido a falha na API Gemini:', error.message);
            // Buscar nome do perito para o fallback
            let peritoNome = 'N/A';
            if (caso.peritoResponsavel && mongoose.Types.ObjectId.isValid(caso.peritoResponsavel)) {
                const perito = await Usuario.findById(caso.peritoResponsavel).select('nome');
                peritoNome = perito ? perito.nome : 'N/A';
            }
            conteudo = `Relatório pericial não pôde ser gerado automaticamente devido a uma falha na API de geração de conteúdo. Detalhes do caso:\n\n` +
                       `Nome: ${caso.nome || 'N/A'}\n` +
                       `Local: ${caso.local || 'N/A'}\n` +
                       `Descrição: ${caso.descricao || 'N/A'}\n` +
                       `Tipo: ${caso.tipo || 'N/A'}\n` +
                       `Perito Responsável: ${peritoNome}\n` +
                       `Recomenda-se análise manual pelo perito responsável.`;
        }

        // Regenerar PDF com assinatura
        const pdfBuffer = await gerarPDF(relatorio.titulo, caso, evidencias, vitimas, conteudo, assinatura);
        const nomeArquivo = `relatorio-${relatorio.casoId}-assinado-${Date.now()}.pdf`;
        const novoArquivoId = await fazerUploadArquivoGridFS(pdfBuffer, nomeArquivo, { casoId: relatorio.casoId });

        // Atualizar relatório
        relatorio.conteudo = conteudo;
        relatorio.arquivoId = novoArquivoId;
        relatorio.nomeArquivo = nomeArquivo;
        relatorio.assinatura = assinatura;
        relatorio.assinado = true;
        await relatorio.save();

        // Registrar log de auditoria
        await Auditoria.create({
            usuarioId: req.usuario.id,
            acao: 'Assinatura de Relatório',
            entidade: 'Relatorio',
            entidadeId: relatorio._id,
            detalhes: `Relatório "${relatorio.titulo}" assinado para o caso ${relatorio.casoId}`,
        });

        res.json({ success: true, relatorio });
    } catch (error) {
        console.error('Erro ao assinar relatório:', error);
        res.status(500).json({ success: false, erro: 'Erro ao assinar relatório', detalhes: error.message });
    }
});

/**
 * @swagger
 * /api/relatorios/{arquivoId}:
 *   get:
 *     summary: Recupera um arquivo de relatório por arquivoId
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
 *         description: Arquivo de relatório recuperado com sucesso
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
 *         description: Relatório não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:arquivoId', verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.arquivoId)) {
            return res.status(400).json({ success: false, erro: 'ID inválido' });
        }

        const arquivoId = new mongoose.Types.ObjectId(req.params.arquivoId);
        const relatorio = await Relatorio.findOne({ arquivoId });

        if (!relatorio) {
            return res.status(404).json({ success: false, erro: 'Relatório não encontrado' });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${relatorio.nomeArquivo}"`
        });

        const downloadStream = obterArquivoGridFS(arquivoId);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Erro ao recuperar arquivo:', err);
            res.status(500).json({ success: false, erro: 'Erro ao recuperar arquivo', detalhes: err.message });
        });
    } catch (error) {
        console.error('Erro ao buscar relatório:', error);
        res.status(500).json({ success: false, erro: 'Erro ao recuperar relatório', detalhes: error.message });
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Relatorio:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         casoId:
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