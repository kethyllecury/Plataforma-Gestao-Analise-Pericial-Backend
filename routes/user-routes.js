const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require("../middleware/user");
const { isAdmin } = require("../validators/user-validator");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Apenas ADMIN pode criar novos usuários (assistente ou perito)
 * @access  Private (somente admin)
 */
router.post("/register", verifyToken, isAdmin, async (req, res) => {
  try {
    const { cpf, email, nome, dataNascimento, cargo, senha } = req.body;

    // Validações
    if (!["assistente", "perito"].includes(cargo)) {
      return res.status(400).json({ message: "Cargo inválido! Escolha entre 'assistente' ou 'perito'." });
    }

    // Verifica se o usuário já existe
    const userExists = await User.findOne({ $or: [{ cpf }, { email }] });
    if (userExists) return res.status(400).json({ message: "Usuário já existe!" });

    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Criar usuário
    const newUser = new User({
      cpf,
      email,
      nome,
      dataNascimento,
      cargo,
      senha: hashedSenha,
    });

    await newUser.save();
    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autenticação do usuário e geração de token JWT
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verifica se o usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "E-mail ou senha inválidos!" });

    // Verifica a senha
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) return res.status(400).json({ message: "E-mail ou senha inválidos!" });

    // Criar token JWT
    const token = jwt.sign({ id: user._id, cargo: user.cargo }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login bem-sucedido!", cargo: user.cargo, token });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error });
  }
});

/**
 * @route   GET /api/auth/users
 * @desc    Apenas ADMIN pode listar todos os usuários
 * @access  Private (somente admin)
 */
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-senha"); // Exclui o campo senha da resposta
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários", error });
  }
});


// EDITAR USUÁRIO - Apenas admin
router.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { email, nome, cargo, dataNascimento } = req.body;

    if (cargo && !["assistente", "perito"].includes(cargo)) {
      return res.status(400).json({ message: "Cargo inválido!" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { email, nome, cargo, dataNascimento },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "Usuário não encontrado!" });

    res.json({ message: "Usuário atualizado com sucesso!", user });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar usuário", error });
  }
});

// EXCLUIR USUÁRIO - Apenas admin
router.delete("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) return res.status(404).json({ message: "Usuário não encontrado!" });

    res.json({ message: "Usuário excluído com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir usuário", error });
  }
});





module.exports = router;
