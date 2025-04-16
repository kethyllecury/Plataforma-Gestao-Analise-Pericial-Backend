require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB conectado!"))
  .catch((err) => console.log("Erro ao conectar ao MongoDB:", err));

  

app.listen(process.env.PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${process.env.PORT}`)
);


const authRoutes = require("./routes/user-routes");
const casosRoutes = require("./routes/caso-routes")

app.use("/api/auth", authRoutes);
app.use("/api/casos", casosRoutes);


