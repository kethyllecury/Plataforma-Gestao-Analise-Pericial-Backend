# API de Gerenciamento de Casos Forenses

## Introdução
Este projeto é uma API RESTful para o backend de um sistema de gerenciamento de casos forenses. Ele permite que usuários (administradores, assistentes e peritos) gerenciem casos forenses ("Casos") e contas de usuários. A API suporta a criação, leitura, atualização e exclusão de casos, além de registro, autenticação e controle de acesso baseado em papéis.

O backend foi construído com Node.js, Express e MongoDB, utilizando JWT para autenticação e Mongoose para interações com o banco de dados.

## Objetivo
O backend é o núcleo de um sistema de gerenciamento de casos forenses, possibilitando:
- **Gerenciamento de Casos**: Criar, ler, atualizar e excluir casos forenses com detalhes como local, data, tipo e status.
- **Gerenciamento de Usuários**: Registrar, autenticar e gerenciar usuários com papéis (admin, assistente, perito).
- **Acesso Baseado em Papéis**: Restringir certas ações (por exemplo, criação de usuários) a administradores.

## Tecnologias
- **Node.js**: Ambiente de execução JavaScript para o backend.
- **Express**: Framework web para Node.js para lidar com rotas e middlewares.
- **MongoDB**: Banco de dados NoSQL para armazenar dados de casos e usuários.
- **Mongoose**: Biblioteca ODM para MongoDB para definir esquemas e interagir com o banco de dados.
- **JWT (jsonwebtoken)**: Para autenticação e autorização de usuários.
- **Bcrypt (bcryptjs)**: Para criptografar senhas de usuários.
- **Express-validator**: Para validação de dados das requisições.
- **CORS**: Para habilitar o compartilhamento de recursos entre origens diferentes.
- **Dotenv**: Para gerenciar variáveis de ambiente.

## Instalação
Siga os passos abaixo para configurar o projeto localmente:

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositório>
   cd <nome-do-repositório>
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto e adicione o seguinte:
   ```plaintext
   MONGO_URI=<sua-string-de-conexão-mongodb>
   PORT=3000
   JWT_SECRET=<sua-chave-secreta-jwt>
   ```
   - `MONGO_URI`: Sua string de conexão com o MongoDB (ex.: `mongodb://localhost/casos-forenses`).
   - `PORT`: A porta onde o servidor será executado (padrão: 3000).
   - `JWT_SECRET`: Uma chave secreta para geração de tokens JWT (ex.: uma string aleatória).

4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor será executado em `http://localhost:3000`.

## Como Usar
1. **Inicie o servidor** conforme descrito na seção de Instalação.
2. Use uma ferramenta como Postman ou cURL para interagir com a API.
3. Autentique-se como usuário para obter um token JWT, e inclua-o no cabeçalho `Authorization` para rotas protegidas:
   ```
   Authorization: Bearer <seu-token-jwt>
   ```

### Exemplo: Login e Criação de um Caso
1. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email": "admin@exemplo.com", "senha": "sua-senha"}'
   ```
   Resposta:
   ```json
   {
     "message": "Login bem-sucedido!",
     "cargo": "admin",
     "token": "<seu-token-jwt>"
   }
   ```

2. **Criar um Caso** (requer autenticação):
   ```bash
   curl -X POST http://localhost:3000/api/casos \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer <seu-token-jwt>" \
   -d '{
     "nome": "Caso 001",
     "local": "São Paulo",
     "data": "2025-04-24",
     "hora": "14:30",
     "descricao": "Investigação de lesão corporal",
     "tipo": "Lesão Corporal",
     "peritoResponsavel": "<id-do-perito>"
   }'
   ```

## Estrutura de Pastas
- **`middleware/`**: Contém funções de middleware.
  - `user.js`: Middleware para verificação de token JWT.
- **`models/`**: Esquemas Mongoose para modelos de dados.
  - `Caso.js`: Esquema para casos forenses.
  - `User.js`: Esquema para usuários.
- **`routes/`**: Definições de rotas da API.
  - `caso-routes.js`: Rotas para gerenciamento de casos.
  - `user-routes.js`: Rotas para autenticação e gerenciamento de usuários.
- **`validators/`**: Lógica de validação para requisições.
  - `caso-validator.js`: Validadores para criação e atualização de casos.
  - `user-validator.js`: Middleware para verificação de papel de administrador.
- **`server.js`**: Ponto de entrada principal para o servidor Express.
- **`package.json`**: Dependências e scripts do projeto.

## Rotas Disponíveis
### Rotas de Autenticação (`/api/auth`)
| Método | Caminho         | Descrição                     | Acesso         |
|--------|-----------------|-------------------------------|----------------|
| POST   | `/login`        | Autenticar usuário e obter token | Público        |
| POST   | `/register`     | Registrar um novo usuário     | Privado (Admin) |
| GET    | `/users`        | Listar todos os usuários      | Privado (Admin) |
| PUT    | `/users/:id`    | Atualizar um usuário          | Privado (Admin) |
| DELETE | `/users/:id`    | Excluir um usuário            | Privado (Admin) |

### Rotas de Casos (`/api/casos`)
| Método | Caminho      | Descrição              | Acesso  |
|--------|--------------|------------------------|---------|
| POST   | `/`          | Criar um novo caso     | Público |
| GET    | `/`          | Listar todos os casos  | Público |
| GET    | `/:id`       | Obter um caso por ID   | Público |
| PUT    | `/:id`       | Atualizar um caso      | Público |
| DELETE | `/:id`       | Excluir um caso        | Público |

**Nota**: Embora as rotas de casos sejam atualmente públicas, você pode adicionar o middleware de autenticação (ex.: `verifyToken`) para restringir o acesso a usuários autenticados.

## Banco de Dados
O projeto utiliza MongoDB como banco de dados, com Mongoose para definição de esquemas e consultas.

### Esquemas
- **Usuário**:
  - `cpf`: String, obrigatório, único
  - `email`: String, obrigatório, único
  - `nome`: String, obrigatório
  - `cargo`: Enum ["admin", "assistente", "perito"], obrigatório
  - `senha`: String, obrigatório (criptografada)

- **Caso**:
  - `nome`: String, obrigatório, único
  - `local`: String, obrigatório
  - `data`: Date, obrigatório
  - `hora`: String, obrigatório (formato: HH:mm)
  - `descricao`: String, obrigatório
  - `tipo`: Enum ["Lesão Corporal", "Identificação por Arcos Dentais", "Estimativa de Idade", "Exame de Marcas de Mordida", "Coleta de DNA"], obrigatório
  - `peritoResponsavel`: Referência a Usuário (ObjectId), obrigatório
  - `anexos`: Array de strings (ex.: arquivos em base64)
  - `status`: Enum ["Em andamento", "Finalizado", "Arquivado"], padrão: "Em andamento"

## Autenticação
A API utiliza JWT para autenticação:
- **Login**: Usuários se autenticam via `/api/auth/login` para receber um token JWT.
- **Rotas Protegidas**: Rotas como registro e listagem de usuários requerem um token JWT válido no cabeçalho `Authorization`.
- **Acesso Baseado em Papéis**: Rotas restritas a administradores (ex.: gerenciamento de usuários) são protegidas pelo middleware `isAdmin`.

## Testes
O projeto atualmente não inclui testes automatizados. Para adicionar testes, você pode usar um framework como **Jest** ou **Mocha** com **Supertest** para testes de API. Exemplo de configuração:

1. Instale as dependências de teste:
   ```bash
   npm install --save-dev jest supertest
   ```

2. Crie um arquivo de teste (ex.: `tests/caso.test.js`) e escreva testes para os endpoints da API.

## Colaboradores
Agradecemos aos seguintes colaboradores pelo seu trabalho neste projeto:
- [Gabriel de Santana](https://github.com/gabrieldsantana).
- [Henrique Fernandes](https://github.com/henriferi).
- [Kethylle Cury](https://github.com/kethyllecury)

## Licença
Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes (se aplicável).
