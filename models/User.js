const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  cpf: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  cargo: {
    type: String,
    enum: ["admin", "assistente", "perito"],
    required: true
  },
  senha: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
