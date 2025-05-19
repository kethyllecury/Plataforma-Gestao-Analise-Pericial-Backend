const express = require("express");

const Caso = require("../models/Caso");
const Usuario = require("../models/Usuario");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/resumo
router.get("/resumo", verifyToken, async (req, res) => {
  try {
    // Total de casos
    const totalCasos = await Caso.countDocuments();

    // Total de peritos
    const totalPeritos = await Usuario.countDocuments({ cargo: "perito" });

    // Casos por tipo
    const casosPorTipoAgg = await Caso.aggregate([
      {
        $group: {
          _id: "$tipo",
          quantidade: { $sum: 1 },
        },
      },
    ]);
    const casosPorTipo = {};
    casosPorTipoAgg.forEach((tipo) => {
      casosPorTipo[tipo._id] = tipo.quantidade;
    });

    // Últimos 5 casos
    const casosRecentes = await Caso.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("peritoResponsavel", "nome");

    const ultimosCasos = casosRecentes.map((caso) => ({
      nome: caso.nome,
      tipo: caso.tipo,
      perito: caso.peritoResponsavel?.nome || "N/A",
      data: caso.data,
    }));

    // Casos por perito
    const casosPorPeritoAgg = await Caso.aggregate([
      {
        $group: {
          _id: "$peritoResponsavel",
          quantidade: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "usuarios",
          localField: "_id",
          foreignField: "_id",
          as: "perito",
        },
      },
      {
        $unwind: "$perito",
      },
      {
        $project: {
          nome: "$perito.nome",
          quantidade: 1,
        },
      },
    ]);

    res.json({
      totalCasos,
      totalPeritos,
      casosPorTipo,
      casosRecentes: ultimosCasos,
      casosPorPerito: casosPorPeritoAgg,
    });
  } catch (error) {
    console.error("Erro ao buscar dados da dashboard:", error.message);
    res.status(500).json({ success: false, error: "Erro ao carregar dashboard" });
  }
});

module.exports = router;
