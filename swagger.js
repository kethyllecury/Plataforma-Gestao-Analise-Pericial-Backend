const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'API GOP - Gestão OdontoLegal Pericial',
        version: '1.0.0',
        description: 'Documentação da API para plataforma GOP - Gestão OdontoLegal Pericial',
        },
        servers: [
        {
            url: 'http://localhost:5000',
            description: 'Servidor local',
        },
        {
            url: 'https://plataforma-gestao-analise-pericial.onrender.com',
            description: 'Servidor em nuvem',
        },
        ],
        components: {
        securitySchemes: {
            bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            },
        },
        },
        security: [
        {
            bearerAuth: [],
        },
        ],
    },
    apis: ['./routes/*.js'], // Escaneia todos os arquivos .js na pasta routes
};

const specs = swaggerJSDoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};