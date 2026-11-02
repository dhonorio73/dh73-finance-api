# Dh73 Finance API

API de controle financeiro fictício para praticar Python, FastAPI, SQL e testes. Criada para compor o portfólio de Douglas Honório.

## Autoria e uso

© 2026 Douglas Honório. Todos os direitos reservados sobre o conteúdo original do projeto. Para uso, reprodução ou distribuição, solicite autorização ao titular. As bibliotecas de terceiros permanecem sujeitas às respectivas licenças.

## Primeiros passos no Windows

No terminal, dentro desta pasta:

```powershell
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --reload
```

Abra http://127.0.0.1:8000/ para acessar o painel e http://127.0.0.1:8000/docs para experimentar a documentação interativa. Use POST /transacoes para registrar uma receita ou despesa; GET /transacoes para listar e GET /saldo para consultar o total. DELETE /transacoes/{id} remove um registro.

O painel apresenta totais gerais de receitas e despesas, permite filtrar a lista por tipo e período e excluir movimentações após confirmação. Os totais não mudam com os filtros.

Exemplo de transação:

```json
{"descricao": "Livro", "tipo": "despesa", "valor": "25.05", "data": "2026-01-02"}
```

Rode os testes com `.\.venv\Scripts\python -m pytest -q`.

## Como funciona

FastAPI recebe e valida os pedidos. O SQLite guarda os registros em `finance.db`, criado automaticamente. Valores são guardados em centavos inteiros para evitar erros de arredondamento. O saldo é a soma das receitas menos as despesas.

Esta primeira etapa é local, usa dados fictícios e **não possui login nem isolamento de usuários**. Não exponha a API na internet nem use dados reais. Autenticação, PostgreSQL e Docker são evoluções futuras.
