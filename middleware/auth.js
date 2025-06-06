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
    // MODIFICAÇÃO AQUI: Extraia name, message e, se for TokenExpiredError, expiredAt
    const errorResponse = {
      name: error.name,
      message: error.message,
    };
    if (error.name === 'TokenExpiredError' && error.expiredAt) {
      errorResponse.expiredAt = error.expiredAt;
    }

    // Log para depuração no console do servidor
    console.error('JWT Verification Error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired at:', error.expiredAt);
    }
    
    res.status(401).json({ success: false, message: "Token inválido!", error: errorResponse });
  }
};

module.exports = { verifyToken };