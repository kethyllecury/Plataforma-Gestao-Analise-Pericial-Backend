const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Acesso negado!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select("-senha");

    if (!req.usuario)
      return res.status(401).json({ success: false, message: "Usuário não encontrado!" });

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token inválido!", error });
  }
};

module.exports = { verifyToken };
