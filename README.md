Projeto Web: Mentora Tupperware

Este pacote contém o código fonte para o Backend e instruções para o Frontend do sistema de mentoria e vendas.

📂 Conteúdo dos Arquivos

package.json: Definição das dependências do Node.js.

server.js: API RESTful construída com Express.

schema.sql: Estrutura do banco de dados MySQL.

App.tsx: (Deve ser copiado da visualização do projeto) Código do Frontend em React.

🚀 Como Instalar e Rodar

Passo 1: Banco de Dados

Instale o MySQL.

Execute o script schema.sql para criar o banco tupperware_db e as tabelas.

Passo 2: Backend (Servidor)

Crie uma pasta chamada backend.

Coloque os arquivos package.json e server.js dentro dela.

Abra o terminal na pasta e execute:

npm install


Configure a senha do banco de dados no arquivo server.js (linha 18).

Inicie o servidor:

npm start


O servidor rodará em http://localhost:3001.

Passo 3: Frontend (Site)

Crie um projeto React com Vite e Tailwind CSS:

npm create vite@latest frontend -- --template react
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


Instale as dependências de ícones:

npm install lucide-react


Configure o tailwind.config.js para ler os arquivos .jsx/.tsx.

Copie o código do arquivo App.tsx fornecido no projeto e substitua o conteúdo de src/App.jsx (ou .tsx).

Rode o frontend:

npm run dev


🔗 Endpoints da API

POST /api/consultoras: Recebe JSON {nome, email, telefone, cidade}.

GET /api/rifas: Retorna lista de rifas ativas.

POST /api/mentoria: Recebe JSON {nome, telefone, nivel, dificuldade}.