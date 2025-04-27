const mongoose = require("mongoose");

const Evidencia = new mongoose.Schema({
    titulo: { type: String, required: true },
    anexo: { type: String, required: true }
})

module.exports = mongoose.model("Evidencia", CasoSchema);