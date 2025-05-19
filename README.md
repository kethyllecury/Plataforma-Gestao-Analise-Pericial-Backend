# GOP - Gestão Odontolegal Pericial - API

## Introdução
Este projeto é uma API RESTful para o backend da **GOP - Gestão Odontolegal Pericial**, um sistema voltado para o gerenciamento de casos forenses odontológicos. A API permite que usuários (administradores, assistentes e peritos) gerenciem casos, evidências, relatórios, vítimas e autenticação de usuários, além da visualização de um dashboard dinâmico. O sistema suporta operações como criação, leitura, atualização e exclusão (CRUD) de casos, upload de evidências, geração e assinatura de relatórios, além de controle de acesso baseado em papéis.

O backend foi construído com Node.js, Express e MongoDB, utilizando JWT para autenticação, Mongoose para interações com o banco de dados, GridFS para armazenamento de arquivos e Swagger para documentação da API.

## Objetivo
O backend é o núcleo da GOP - Gestão Odontolegal Pericial, possibilitando:
- **Gerenciamento de Usuários**: Registro, autenticação e gerenciamento de usuários com papéis (admin, assistente, perito).
- **Gerenciamento de Casos**: Criar, ler, atualizar e excluir casos forenses com detalhes como nome, local, descrição, tipo e status.
- **Gerenciamento de Evidências**: Upload, listagem e recuperação de evidências (ex.: radiografias, odontogramas) associadas a casos.
- **Geração de Relatórios**: Criação e assinatura de relatórios em PDF para os casos.
- **Gerenciamento de Vítimas**: Criar, ler, atualizar e excluir vítimas com detalhes como, nome, idade e observações anatômicas.
- **Acesso Baseado em Papéis**: Restringir ações (ex.: gerenciamento de usuários) a administradores.

## Tecnologias
- **Node.js**: Ambiente de execução JavaScript para o backend.
- **Express**: Framework web para Node.js para lidar com rotas e middlewares.
- **MongoDB**: Banco de dados NoSQL para armazenar dados de usuários, casos, evidências e relatórios.
- **Mongoose**: Biblioteca ODM para MongoDB para definir esquemas e interagir com o banco.
- **GridFS**: Para armazenamento e recuperação de arquivos (evidências e relatórios) no MongoDB.
- **JWT (jsonwebtoken)**: Para autenticação e autorização de usuários.
- **Bcrypt (bcryptjs)**: Para criptografar senhas de usuários.
- **Express-validator**: Para validação de dados das requisições.-
- **CORS**: Para habilitar o compartilhamento de recursos entre origens diferentes.
- **Dotenv**: Para gerenciar variáveis de ambiente.
- **Multer**: Para upload de arquivos.
- **PDFKit**: Para geração de relatórios em PDF.
- **Swagger (swagger-jsdoc e swagger-ui-express)**: Para documentação interativa da API.

## Instalação
Siga os passos abaixo para configurar o projeto localmente:

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositório>
   cd plataforma-gestao-forense
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto e adicione o seguinte:
   ```plaintext
   MONGODB_URI=<sua-string-de-conexão-mongodb>
   PORT=5000
   JWT_SECRET=<sua-chave-secreta-jwt>
   ```
   - `MONGODB_URI`: String de conexão com o MongoDB (ex.: `mongodb://localhost/gestao-forense`).
   - `PORT`: Porta onde o servidor será executado (padrão: 5000).
   - `JWT_SECRET`: Chave secreta para geração de tokens JWT (ex.: uma string aleatória segura).

4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor será executado em `http://localhost:5000`. A documentação da API estará disponível em `http://localhost:5000/api-docs`.

## Como Usar
1. **Inicie o servidor** conforme descrito na seção de Instalação.
2. Acesse a documentação da API em `http://localhost:5000/api-docs` para explorar os endpoints disponíveis.
3. Use uma ferramenta como Postman ou cURL para interagir com a API.
4. Autentique-se via `/api/auth/login` para obter um token JWT e inclua-o no cabeçalho `Authorization` para rotas protegidas:
   ```
   Authorization: Bearer <seu-token-jwt>
   ```

### Exemplo: Login e Upload de Evidência
1. **Login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email": "usuario@example.com", "senha": "123456"}'
   ```
   Resposta:
   ```json
   { "token": "<seu-token-jwt>" }
   ```

2. **Upload de uma Evidência** (requer autenticação):
   ```bash
   curl -X POST http://localhost:5000/api/evidencias \
   -H "Authorization: Bearer <seu-token-jwt>" \
   -F "arquivo=@/caminho/para/arquivo.pdf" \
   -F "casoId=<id-do-caso>" \
   -F "tipoEvidencia=radiografia" \
   -F "descricao=Radiografia do caso"
   ```
   Resposta:
   ```json
   {
     "casoId": "<id-do-caso>",
     "arquivoId": "<id-do-arquivo>",
     "nomeArquivo": "arquivo.pdf",
     "tipoArquivo": "application/pdf",
     "tipoEvidencia": "radiografia",
     "descricao": "Radiografia do caso",
     "createdAt": "2025-05-09T00:00:00.000Z"
   }
   ```

## Estrutura de Pastas
- **`middleware/`**:
  - `auth.js`: Middleware para verificação de token JWT.
- **`models/`**:
  - `Caso.js`: Esquema para casos forenses.
  - `Evidencia.js`: Esquema para evidências.
  - `Relatorio.js`: Esquema para relatórios.
  - `Usuario.js`: Esquema para usuários.
  - `Vitima.js`: Esquema para vítimas.
- **`routes/`**:
  - `autenticacaoRoute.js`: Rotas para autenticação e gerenciamento de usuários.
  - `casosRoute.js`: Rotas para gerenciamento de casos.
  - `dashboard.js`: Rotas para visualização da dashboard.
  - `evidenciasRoute.js`: Rotas para gerenciamento de evidências.
  - `peritosRoute.js`: Rotas para gerenciamento de peritos.
  - `relatoriosRoute.js`: Rotas para geração e gerenciamento de relatórios.
  - `vitimasRoute.js`: Rotas para gerenciamento de vítimas.
- **`utils/`**:
  - `gridfs.js`: Funções para upload e recuperação de arquivos via GridFS.
  - `validacao.js`: Funções utilitárias para validação, como verificação de CPF.
- **`validators/`**:
  - `autenticacaoValidator.js`: Validadores para autenticação e gerenciamento de usuários.
  - `casosValidator.js`: Validadores para criação e listagem de casos.
  - `evidenciasValidator.js`: Validadores para upload e listagem de evidências.
  - `relatoriosValidator.js`: Validadores para geração e assinatura de relatórios.
  - `vitimasValidator.js`: Validadores para criação de vítimas.
- **`server.js`**: Ponto de entrada principal para o servidor Express.
- **`swagger.js`**: Configuração da documentação Swagger.
- **`package.json`**: Dependências e scripts do projeto.
- **`.env`**: Variáveis de ambiente (não versionado).
- **`.gitignore`**: Oculta arquivos para o git.

## Rotas Disponíveis
A documentação completa está disponível em `/api-docs`. Abaixo está um resumo das principais rotas:

### Rotas de Autenticação (`/api/auth`)
| Método | Caminho         | Descrição                     | Acesso         |
|--------|-----------------|-------------------------------|----------------|
| POST   | `/registrar`    | Registrar um novo usuário     | Privado (Admin) |
| POST   | `/login`        | Autenticar usuário e obter token | Público        |
| GET    | `/usuarios`     | Listar todos os usuários      | Privado (Admin) |
| PUT    | `/usuarios/:id` | Atualizar um usuário          | Privado (Admin) |
| DELETE | `/usuarios/:id` | Excluir um usuário            | Privado (Admin) |

### Rotas de Casos (`/api/casos`)
| Método | Caminho      | Descrição              | Acesso         |
|--------|--------------|------------------------|----------------|
| POST   | `/`          | Criar um novo caso     | Privado        |
| GET    | `/`          | Listar todos os casos  | Privado        |
| GET    | `/:id`       | Obter um caso por ID   | Privado        |
| GET    | `/paginado/:pagina/:quantidade` | Listar casos paginado | Privado        |
| PUT    | `/:id`       | Atualizar um caso      | Privado        |
| DELETE | `/:id`       | Excluir um caso        | Privado        |

### Rotas de Dashboard (`/api/dashboard`)
| Método | Caminho      | Descrição              | Acesso         |
|--------|--------------|------------------------|----------------|
| GET    | `/resumo`    | Listar resumo de todo conteúdo  | Privado |

### Rotas de Evidências (`/api/evidencias`)
| Método | Caminho         | Descrição                     | Acesso         |
|--------|-----------------|-------------------------------|----------------|
| POST   | `/`             | Fazer upload de uma evidência | Privado        |
| GET    | `/`             | Listar evidências por caso    | Privado        |
| GET    | `/:arquivoId`   | Recuperar um arquivo de evidência | Privado    |

### Rotas de Peritos (`/api/peritos`)
| Método | Caminho      | Descrição              | Acesso         |
|--------|--------------|------------------------|----------------|
| GET    | `/`          | Listar todos os perítos  | Privado |

### Rotas de Relatórios (`/api/relatorios`)
| Método | Caminho         | Descrição                     | Acesso         |
|--------|-----------------|-------------------------------|----------------|
| POST   | `/`             | Gerar um novo relatório       | Privado        |
| PUT    | `/:id/assinar`  | Assinar um relatório          | Privado        |
| GET    | `/:arquivoId`   | Recuperar um relatório em PDF | Privado        |

### Rotas de Vítimas (`/api/vitimas`)
| Método | Caminho      | Descrição              | Acesso         |
|--------|--------------|------------------------|----------------|
| POST   | `/`          | Criar uma nova vítima     | Privado     |
| GET    | `/`          | Listar todas as vítimas   | Privado      |
| GET    | `/:id`       | Obter uma vítima por ID   | Privado     |
| GET    | `/paginado/:pagina/:quantidade` | Listar vítimas paginado | Privado        |
| PUT    | `/:id`       | Atualizar uma vítima      | Privad      |
| DELETE | `/:id`       | Excluir uma vítima        | Privado     |

## Banco de Dados
O projeto utiliza MongoDB com Mongoose para definição de esquemas e GridFS para armazenamento de arquivos.

### Esquemas
- **Usuário** (`Usuario.js`):
  - `cpf`: String, obrigatório, único
  - `email`: String, obrigatório, único
  - `nome`: String, obrigatório
  - `cargo`: Enum ["admin", "assistente", "perito"], obrigatório
  - `senha`: String, obrigatório (criptografada)

- **Caso** (`Caso.js`):
  - `nome`: String, obrigatório, único
  - `local`: String, obrigatório
  - `descricao`: String, obrigatório
  - `tipo`: Enum ["Lesão Corporal", "Identificação por Arcos Dentais", "Estimativa de Idade", "Exame de Marcas de Mordida", "Coleta de DNA"], obrigatório
  - `peritoResponsavel`: Referência a Usuário (ObjectId), obrigatório
  - `status`: Enum ["Em andamento", "Finalizado", "Arquivado"], padrão: "Em andamento"
  - `createdAt`: Date, padrão: data atual

- **Evidência** (`Evidencia.js`):
  - `casoId`: Referência a Caso (ObjectId), obrigatório
  - `arquivoId`: ObjectId (GridFS), obrigatório
  - `nomeArquivo`: String, obrigatório
  - `tipoArquivo`: String (MIME type), obrigatório
  - `tipoEvidencia`: Enum ["radiografia", "odontograma", "outro"], obrigatório
  - `descricao`: String, opcional
  - `createdAt`: Date, padrão: data atual

- **Relatório** (`Relatorio.js`):
  - `casoId`: Referência a Caso (ObjectId), obrigatório
  - `conteudo`: String, obrigatório
  - `arquivoId`: ObjectId (GridFS), obrigatório
  - `nomeArquivo`: String, obrigatório
  - `assinatura`: String, opcional
  - `assinado`: Boolean, padrão: false
  - `createdAt`: Date, padrão: data atual

  - **Vítima** (`Vitima.js`):
  - `casoId`: Referência a Caso (ObjectId), obrigatório
  - `nome`: String, opcional (caso não identificado)
  - `genero`: String, opcional (caso não identificado)
  - `idade`: Number, opcional (caso não identificado)
  - `cpf`: String, opcional (caso não identificado)
  - `endereco`: String, opcional (caso não identificado)
  - `etnia`: Enum ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não identificado'], obrigatório
  - `odontograma`: Object { superiorEsquerdo: String, opcional, superiorDireito: String, opcional, inferiorEsquerdo: String, opcional, inferiorDireito: String, opcional }
  - `anotacaoAnatomia`: String, obrigatório
  - `createdAt`: Date, padrão: data atual

## Autenticação
A API utiliza JWT para autenticação:
- **Login**: Usuários se autenticam via `/api/auth/login` para receber um token JWT.
- **Rotas Protegidas**: Todas as rotas (exceto login) requerem um token JWT válido no cabeçalho `Authorization`.
- **Acesso Baseado em Papéis**: Rotas de gerenciamento de usuários (ex.: registrar, listar, atualizar, excluir) são restritas a administradores via middleware `validarAdmin`.

## Colaboradores
Agradecemos aos seguintes colaboradores pelo seu trabalho neste projeto:
- [Gabriel de Santana](https://github.com/gabrieldsantana)
- [Henrique Fernandes](https://github.com/henriferi)
- [Kethylle Cury](https://github.com/kethyllecury)
