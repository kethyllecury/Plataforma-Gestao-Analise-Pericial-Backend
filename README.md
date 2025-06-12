# GOP - Gestão Odontolegal Pericial - API

## Introdução
A **GOP - Gestão Odontolegal Pericial** é uma API RESTful projetada para o gerenciamento de casos forenses odontológicos. O sistema suporta administradores, assistentes e peritos no gerenciamento de casos, vítimas, evidências, laudos, relatórios e autenticação de usuários, além de oferecer um dashboard dinâmico para visualização de dados. A API permite operações CRUD (criação, leitura, atualização e exclusão), upload de evidências, geração e assinatura de documentos em PDF, e controle de acesso baseado em papéis.

O backend é construído com **Node.js**, **Express** e **MongoDB**, utilizando **JWT** para autenticação, **Mongoose** para modelagem de dados, **GridFS** para armazenamento de arquivos e **Swagger** para documentação interativa da API.

## Objetivo
O backend da GOP tem como objetivo:
- **Gerenciar Usuários**: Registro, autenticação e administração de usuários com papéis (admin, assistente, perito).
- **Gerenciar Casos**: Criar, listar, atualizar e excluir casos forenses com detalhes como nome, local, tipo e status.
- **Gerenciar Evidências**: Fazer upload, listar e recuperar evidências (ex.: radiografias, odontogramas) associadas a casos.
- **Gerenciar Vítimas**: Registrar e gerenciar informações de vítimas, incluindo odontogramas e anotações anatômicas.
- **Gerar Laudos e Relatórios**: Criar, assinar e recuperar laudos e relatórios em PDF.
- **Controlar Acesso**: Restringir funcionalidades com base no papel do usuário (ex.: apenas administradores gerenciam usuários).
- **Visualizar Dados**: Fornecer um dashboard com resumos de casos, peritos e estatísticas.

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
   -`GEMINI_API_KEY`: Chave da API Gemini para auxiliar na geração de laudos e relatórios.

4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor será executado em `http://localhost:5000`. A documentação da API estará disponível em `http://localhost:5000/api-docs`.

## Como Usar
1. **Inicie o servidor** conforme descrito na seção de Instalação.
2. Acesse a documentação interativa da API em `http://localhost:5000/api-docs` para explorar os endpoints.
3. Use ferramentas como **Postman** ou **cURL** para testar as rotas.
4. **Autenticação**:
   - Faça login em `/api/auth/login` para obter um token JWT.
   - Inclua o token no cabeçalho `Authorization` para acessar rotas protegidas:
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
   **Resposta**:
   ```json
   {
     "success": true,
     "token": "<seu-token-jwt>",
     "usuario": {
       "_id": "<id-do-usuario>",
       "nome": "Usuário Exemplo",
       "email": "usuario@example.com",
       "cargo": "perito"
     }
   }
   ```

2. **Upload de Evidência** (requer autenticação):
   ```bash
   curl -X POST http://localhost:5000/api/evidencias \
   -H "Authorization: Bearer <seu-token-jwt>" \
   -F "arquivo=@/caminho/para/arquivo.pdf" \
   -F "casoId=<id-do-caso>" \
   -F "tituloEvidencia=Radiografia Exemplo" \
   -F "tipoEvidencia=radiografia" \
   -F "descricao=Radiografia do caso"
   ```
   **Resposta**:
   ```json
   {
     "success": true,
     "evidencia": {
       "_id": "<id-da-evidencia>",
       "casoId": "<id-do-caso>",
       "tituloEvidencia": "Radiografia Exemplo",
       "arquivoId": "<id-do-arquivo>",
       "nomeArquivo": "arquivo.pdf",
       "tipoArquivo": "application/pdf",
       "tipoEvidencia": "radiografia",
       "descricao": "Radiografia do caso",
       "createdAt": "2025-06-12T00:00:00.000Z"
     }
   }
   ```

## Estrutura de Pastas
- **`middleware/`**:
  - `auth.js`: Middleware para autenticação via JWT e validação de papéis.
- **`models/`**:
  - `Caso.js`: Esquema para casos forenses.
  - `Evidencia.js`: Esquema para evidências.
  - `Laudo.js`: Esquema para laudos periciais.
  - `Relatorio.js`: Esquema para relatórios.
  - `Usuario.js`: Esquema para usuários.
  - `Vitima.js`: Esquema para vítimas.
- **`routes/`**:
  - `autenticacaoRoute.js`: Rotas para autenticação e gerenciamento de usuários.
  - `casosRoute.js`: Rotas para gerenciamento de casos.
  - `dashboard.js`: Rotas para o dashboard.
  - `evidenciasRoute.js`: Rotas para gerenciamento de evidências.
  - `laudosRoute.js`: Rotas para gerenciamento de laudos.
  - `peritosRoute.js`: Rotas para listagem de peritos.
  - `relatoriosRoute.js`: Rotas para geração e assinatura de relatórios.
  - `vitimasRoute.js`: Rotas para gerenciamento de vítimas.
- **`utils/`**:
  - `gridfs.js`: Funções para upload e recuperação de arquivos via GridFS.
  - `validacao.js`: Funções de validação (ex.: CPF).
- **`validators/`**:
  - `autenticacaoValidator.js`: Validações para autenticação e usuários.
  - `casosValidator.js`: Validações para casos.
  - `evidenciasValidator.js`: Validações para evidências.
  - `laudosValidator.js`: Validações para laudos.
  - `relatoriosValidator.js`: Validações para relatórios.
  - `vitimasValidator.js`: Validações para vítimas.
- **`server.js`**: Ponto de entrada do servidor Express.
- **`swagger.js`**: Configuração da documentação Swagger.
- **`package.json`**: Dependências e scripts do projeto.
- **`.env`**: Variáveis de ambiente (não versionado).
- **`.gitignore`**: Arquivos ignorados pelo Git.

## Rotas Disponíveis
A documentação completa está disponível em `/api-docs`. Abaixo está um resumo das principais rotas:

### Rotas de Autenticação (`/api/auth`)
| Método | Caminho         | Descrição                     | Acesso         |
|--------|-----------------|-------------------------------|----------------|
| POST   | `/registrar`    | Registrar novo usuário        | Privado (Admin) |
| POST   | `/login`        | Autenticar e obter token      | Público        |
| GET    | `/usuarios`     | Listar todos os usuários      | Privado (Admin) |
| PUT    | `/usuarios/:id` | Atualizar usuário             | Privado (Admin) |
| DELETE | `/usuarios/:id` | Excluir usuário               | Privado (Admin) |

### Rotas de Casos (`/api/casos`)
| Método | Caminho                      | Descrição                     | Acesso  |
|--------|------------------------------|-------------------------------|---------|
| POST   | `/`                          | Criar novo caso               | Privado |
| GET    | `/`                          | Listar todos os casos         | Privado |
| GET    | `/:id`                       | Obter caso por ID             | Privado |
| GET    | `/paginado/:pagina/:quantidade` | Listar casos paginados    | Privado |
| PUT    | `/:id`                       | Atualizar caso                | Privado |
| DELETE | `/:id`                       | Excluir caso                  | Privado |

### Rotas de Dashboard (`/api/dashboard`)
| Método | Caminho      | Descrição                     | Acesso  |
|--------|--------------|-------------------------------|---------|
| GET    | `/resumo`    | Obter resumo do dashboard     | Privado |

### Rotas de Evidências (`/api/evidencias`)
| Método | Caminho         | Descrição                     | Acesso  |
|--------|-----------------|-------------------------------|---------|
| POST   | `/`             | Fazer upload de evidência     | Privado |
| GET    | `/`             | Listar evidências por caso    | Privado |
| GET    | `/:evidenciaId` | Recuperar metadados da evidência | Privado |
| GET    | `/:arquivoId`   | Baixar arquivo de evidência   | Privado |
| PUT    | `/:evidenciaId` | Atualizar evidência           | Privado |
| DELETE | `/:evidenciaId` | Excluir evidência             | Privado |

### Rotas de Laudos (`/api/laudos`)
| Método | Caminho         | Descrição                     | Acesso  |
|--------|-----------------|-------------------------------|---------|
| POST   | `/`             | Criar novo laudo              | Privado |
| GET    | `/`             | Listar laudos por caso        | Privado |
| GET    | `/:id`          | Obter laudo por ID            | Privado |
| PUT    | `/:id/assinar`  | Assinar laudo                 | Privado |
| GET    | `/pdf/:arquivoId` | Baixar laudo em PDF         | Privado |

### Rotas de Peritos (`/api/peritos`)
| Método | Caminho      | Descrição                     | Acesso  |
|--------|--------------|-------------------------------|---------|
| GET    | `/`          | Listar todos os peritos       | Privado |

### Rotas de Relatórios (`/api/relatorios`)
| Método | Caminho         | Descrição                     | Acesso  |
|--------|-----------------|-------------------------------|---------|
| POST   | `/`             | Criar novo relatório          | Privado |
| PUT    | `/:id/assinar`  | Assinar relatório             | Privado |
| GET    | `/:arquivoId`   | Baixar relatório em PDF       | Privado |

### Rotas de Vítimas (`/api/vitimas`)
| Método | Caminho                      | Descrição                     | Acesso  |
|--------|------------------------------|-------------------------------|---------|
| POST   | `/`                          | Criar nova vítima             | Privado |
| GET    | `/`                          | Listar todas as vítimas       | Privado |
| GET    | `/:id`                       | Obter vítima por ID           | Privado |
| GET    | `/paginado/:pagina/:quantidade` | Listar vítimas paginadas  | Privado |
| PUT    | `/:id`                       | Atualizar vítima              | Privado |
| DELETE | `/:id`                       | Excluir vítima                | Privado |

## Banco de Dados
O projeto utiliza **MongoDB** com **Mongoose** para definição de esquemas e **GridFS** para armazenamento de arquivos (evidências, laudos e relatórios).

### Esquemas
Os esquemas abaixo definem a estrutura dos dados no MongoDB e são documentados no Swagger em `/api-docs`.

- **Usuário** (`Usuario.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID do usuário }
    cpf: { type: string, description: CPF único }
    email: { type: string, description: Email único }
    nome: { type: string, description: Nome do usuário }
    cargo: { type: string, enum: ["admin", "assistente", "perito"], description: Papel do usuário }
  ```

- **Caso** (`Caso.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID do caso }
    nome: { type: string, description: Nome único do caso }
    local: { type: string, description: Local do caso }
    descricao: { type: string, description: Descrição do caso }
    tipo: { type: string, enum: ["Lesão Corporal", "Identificação por Arcos Dentais", "Estimativa de Idade", "Exame de Marcas de Mordida", "Coleta de DNA"], description: Tipo do caso }
    peritoResponsavel: { type: string, description: ID do perito }
    status: { type: string, enum: ["Em andamento", "Finalizado", "Arquivado"], description: Status do caso }
    dataHora: { type: string, format: date-time, description: Data e hora do caso }
    createdAt: { type: string, format: date-time, description: Data de criação }
    dataFechamento: { type: string, format: date-time, nullable: true, description: Data de fechamento }
  ```

- **Evidência** (`Evidencia.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID da evidência }
    casoId: { type: string, description: ID do caso }
    tituloEvidencia: { type: string, description: Título da evidência }
    arquivoId: { type: string, description: ID do arquivo no GridFS }
    nomeArquivo: { type: string, description: Nome do arquivo }
    tipoArquivo: { type: string, description: Tipo MIME }
    tipoEvidencia: { type: string, enum: ["radiografia", "odontograma", "outro"], description: Tipo da evidência }
    descricao: { type: string, nullable: true, description: Descrição }
    localizacao: 
      type: object
      properties:
        type: { type: string, enum: ["Point"], default: "Point" }
        coordinates: { type: array, items: { type: number }, description: [longitude, latitude] }
      nullable: true
    coletadoPor: { type: string, description: ID do usuário que coletou }
    createdAt: { type: string, format: date-time, description: Data de criação }
  ```

- **Laudo** (`Laudo.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID do laudo }
    evidenciaId: { type: string, description: ID da evidência }
    titulo: { type: string, description: Título do laudo }
    conteudo: { type: string, description: Conteúdo do laudo }
    arquivoId: { type: string, description: ID do arquivo no GridFS }
    nomeArquivo: { type: string, description: Nome do arquivo PDF }
    peritoResponsavel: { type: string, description: ID do perito }
    assinatura: { type: string, nullable: true, description: Assinatura do perito }
    assinado: { type: boolean, description: Indica se está assinado }
    createdAt: { type: string, format: date-time, description: Data de criação }
  ```

- **Relatório** (`Relatorio.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID do relatório }
    casoId: { type: string, description: ID do caso }
    titulo: { type: string, description: Título do relatório }
    conteudo: { type: string, description: Conteúdo do relatório }
    arquivoId: { type: string, description: ID do arquivo no GridFS }
    nomeArquivo: { type: string, description: Nome do arquivo PDF }
    peritoResponsavel: { type: string, description: ID do perito }
    assinatura: { type: string, nullable: true, description: Assinatura do perito }
    assinado: { type: boolean, description: Indica se está assinado }
    createdAt: { type: string, format: date-time, description: Data de criação }
  ```

- **Vítima** (`Vitima.js`):
  ```yaml
  type: object
  properties:
    _id: { type: string, description: ID da vítima }
    casoId: { type: string, description: ID do caso }
    NIC: { type: string, description: Número de Identificação Criminal }
    nome: { type: string, description: Nome da vítima }
    genero: { type: string, description: Gênero da vítima }
    idade: { type: number, nullable: true, description: Idade }
    cpf: { type: string, description: CPF }
    endereco: { type: string, description: Endereço }
    etnia: { type: string, enum: ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não identificado"], description: Etnia }
    odontograma:
      type: object
      properties:
        superiorEsquerdo: { type: array, items: { type: string } }
        superiorDireito: { type: array, items: { type: string } }
        inferiorEsquerdo: { type: array, items: { type: string } }
        inferiorDireito: { type: array, items: { type: string } }
    anotacaoAnatomia: { type: string, description: Anotações anatômicas }
    createdAt: { type: string, format: date-time, description: Data de criação }
  ```

- **DashboardResumo** (específico para `/api/dashboard/resumo`):
  ```yaml
  type: object
  properties:
    totalCasos: { type: integer, description: Total de casos }
    totalPeritos: { type: integer, description: Total de peritos }
    casosPorTipo: { type: object, additionalProperties: { type: integer }, description: Casos por tipo }
    casosRecentes:
      type: array
      items:
        type: object
        properties:
          nome: { type: string, description: Nome do caso }
          tipo: { type: string, description: Tipo do caso }
          perito: { type: string, description: Nome do perito }
          data: { type: string, format: date-time, description: Data do caso }
    casosPorPerito:
      type: array
      items:
        type: object
        properties:
          nome: { type: string, description: Nome do perito }
          quantidade: { type: integer, description: Quantidade de casos }
  ```

## Autenticação
A API utiliza **JWT** para autenticação:
- **Login**: Usuários se autenticam via `/api/auth/login` para receber um token JWT.
- **Rotas Protegidas**: Todas as rotas, exceto `/api/auth/login`, requerem um token JWT no cabeçalho `Authorization`.
- **Acesso por Papel**: Rotas administrativas (ex.: `/api/auth/registrar`) são restritas a usuários com `cargo: "admin"` via middleware `validarAdmin`.

## Documentação Swagger
A API é documentada com **Swagger**, acessível em `/api-docs`. A documentação inclui:
- Descrição de todos os endpoints.
- Esquemas de dados para requisições e respostas.
- Exemplos de payloads.
- Códigos de status HTTP e mensagens de erro.
- Requisitos de autenticação por rota.

## Colaboradores
Agradecemos aos seguintes colaboradores pelo seu trabalho neste projeto:
- [Gabriel de Santana](https://github.com/gabrieldsantana)
- [Henrique Fernandes](https://github.com/henriferi)
- [Kethylle Cury](https://github.com/kethyllecury)