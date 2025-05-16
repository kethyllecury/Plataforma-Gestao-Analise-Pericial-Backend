const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas
const autenticacaoRotas = require('./routes/autenticacaoRoute');
const casosRotas = require('./routes/casosRoute');
const evidenciasRotas = require('./routes/evidenciasRoute');
const relatoriosRotas = require('./routes/relatoriosRoute');
const peritos = require('./routes/peritos');
const dashboard = require('./routes/dashboard');

app.use('/api/auth', autenticacaoRotas);
app.use('/api/casos', casosRotas);
app.use('/api/evidencias', evidenciasRotas);
app.use('/api/relatorios', relatoriosRotas);
app.use('/api/peritos', peritos);
app.use("/api/dashboard", dashboard);


// Configuração do Swagger
const swaggerConfig = require('./swagger');
swaggerConfig(app);

app.get('/', (req, res) => res.send('Backend da Plataforma de Gestão Forense'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));