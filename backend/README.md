# Backend Slim Framework para Super Productivity

Este diretório contém a API backend em PHP (Slim Framework) para persistência das tarefas, projetos, etc. no MySQL.

## Instalação

1. Instale as dependências:

   ```bash
   cd backend
   composer install
   ```

2. Configure o banco de dados em `.env`.

3. Crie as tabelas necessárias:

   ```bash
   mysql -u root -p super_productivity < tasks.sql
   ```

4. Rode o servidor embutido para desenvolvimento:

   ```bash
   php -S localhost:8080 -t public
   ```

## Endpoints

- `GET /ping` — Teste de saúde
- `GET /tasks` — Lista todas as tarefas

Adicione endpoints conforme necessário para projetos, tags, etc.
