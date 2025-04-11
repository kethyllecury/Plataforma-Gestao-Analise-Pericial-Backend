const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost/casosDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

const casoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    local: { type: String, required: true },
    data: { type: Date, required: true },
    hora: { type: String, required: true },
    descricao: { type: String, required: true },
    tipo: { type: String, required: true },
    perito: { type: String, required: true },
    anexos: { type: Array, default: [] }
});

const Caso = mongoose.model('Caso', casoSchema);

app.post('/api/casos', async (req, res) => {
    try {
        const novoCaso = new Caso(req.body);
        const resultado = await novoCaso.save();
        res.status(201).json({ message: 'Caso cadastrado com sucesso', resultado });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/casos', async (req, res) => {
    try {
        const casos = await Caso.find();
        res.status(200).json(casos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Servidor rodando em http://127.0.0.1:${PORT}/api/casos`));

