// routes/peritos.js
const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");

// GET /api/peritos
router.get("/", async (req, res) => {
  try {
    const peritos = await Usuario.find({ cargo: "perito" }, "_id nome email");
    res.json({ success: true, peritos });
  } catch (error) {
    console.error("Erro ao buscar peritos:", error.message);
    res.status(500).json({ success: false, error: "Erro ao buscar peritos" });
  }
});

module.exports = router;
