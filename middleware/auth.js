const jwt = require("jsonwebtoken");
const User = require("../models/Usuario");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Acesso negado!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-senha");

    if (!req.user)
      return res.status(401).json({ message: "Usuário não encontrado!" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido!", error });
  }
};

module.exports = { verifyToken };
