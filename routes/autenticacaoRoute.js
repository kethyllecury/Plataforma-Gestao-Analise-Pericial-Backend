const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const { verifyToken } = require("../middleware/auth");
const { validarAdmin, validarLogin, validarRegistro } = require("../validators/autenticacaoValidator");
const { verificarErrosValidacao, validarCPF } = require("../utils/validacao");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Endpoints para autenticação e gestão de usuários
 */

/**
 * @swagger
 * /api/auth/registrar:
 *   post:
 *     summary: Registra um novo usuário (somente admin)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpf:
 *                 type: string
 *                 example: "12345678901"
 *               email:
 *                 type: string
 *                 example: "usuario@example.com"
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               cargo:
 *                 type: string
 *                 enum: ["assistente", "perito"]
 *                 example: "perito"
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Erro de validação ou cargo inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registrar', verifyToken, validarAdmin, validarRegistro, verificarErrosValidacao, async (req, res) => {
  const { cpf, email, nome, cargo, senha } = req.body;
  try {
    if (!["assistente", "perito"].includes(cargo)) {
      return res.status(400).json({
        success: false,
        message: "Cargo inválido! Escolha entre 'assistente' ou 'perito'."
      });
    }

    if (!validarCPF(cpf)) {
      return res.status(400).json({
        success: false,
        message: "CPF inválido!"
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({
      cpf,
      email,
      nome,
      cargo,
      senha: senhaCriptografada
    });

    res.status(201).json({success: true, usuario});
  } catch (error) {
    res.status(400).json({ success: false, erro: 'Erro ao registrar usuário', detalhes: error.message  });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@example.com"
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Erro ao fazer login
 */
router.post('/login', validarLogin, verificarErrosValidacao, async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (usuario && await bcrypt.compare(senha, usuario.senha)) {
      const token = jwt.sign(
        { id: usuario._id, cargo: usuario.cargo },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      const { senha, ...usuarioSemsenha } = usuario._doc;
      res.json({ success: true, token, usuario: usuarioSemsenha });
    } else {
      res.status(401).json({ success: false, erro: 'Credenciais inválidas' });
    }
  } catch (error) {
    res.status(400).json({ success: false, erro: 'Erro ao fazer login', detalhes: error.message  });
  }
});

/**
 * @swagger
 * /api/auth/usuarios:
 *   get:
 *     summary: Lista todos os usuários (somente admin)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso restrito a administradores
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/usuarios", verifyToken, validarAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, "-senha");
    res.json({success: true, usuarios});
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao buscar usuários", detalhes: error.message  });
  }
});

/**
 * @swagger
 * /api/auth/usuarios/{id}:
 *   put:
 *     summary: Atualiza um usuário (somente admin)
 *     tags: [Autenticação]
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
 *               email:
 *                 type: string
 *                 example: "usuario@example.com"
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               cargo:
 *                 type: string
 *                 enum: ["assistente", "perito"]
 *                 example: "perito"
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Erro de validação ou cargo inválido
 *       403:
 *         description: Acesso restrito a administradores
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/usuarios/:id", verifyToken, validarAdmin, async (req, res) => {
  try {
    const { email, nome, cargo, dataNascimento } = req.body;

    if (cargo && !["assistente", "perito"].includes(cargo)) {
      return res.status(400).json({ success: false, message: "Cargo inválido!" });
    }

    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      { email, nome, cargo, dataNascimento },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado!" });

    res.json({ success: true, message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar usuário", detalhes: error.message  });
  }
});

/**
 * @swagger
 * /api/auth/usuarios/{id}:
 *   delete:
 *     summary: Deleta um usuário (somente admin)
 *     tags: [Autenticação]
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
 *         description: Usuário excluído com sucesso
 *       403:
 *         description: Acesso restrito a administradores
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete("/usuarios/:id", verifyToken, validarAdmin, async (req, res) => {
  try {
    const deletedUser = await Usuario.findByIdAndDelete(req.params.id);

    if (!deletedUser) return res.status(404).json({ success: false, message: "Usuário não encontrado!" });

    res.json({ success: true, message: "Usuário excluído com sucesso!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao excluir usuário", detalhes: error.message  });
  }
});

module.exports = router;