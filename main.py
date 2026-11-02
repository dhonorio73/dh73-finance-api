from contextlib import asynccontextmanager
from datetime import date
from decimal import Decimal
from enum import Enum
import os
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

DATABASE = os.environ.get("FINANCE_DATABASE", "finance.db")


def connect():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL, tipo TEXT NOT NULL,
            valor_centavos INTEGER NOT NULL, data TEXT NOT NULL
        )""")
    yield


app = FastAPI(title="Dh73 Finance API", version="0.1.0", lifespan=lifespan)
STATIC = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")


class Tipo(str, Enum):
    receita = "receita"
    despesa = "despesa"


class Transacao(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    descricao: str = Field(min_length=1, max_length=150)
    tipo: Tipo
    valor: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    data: date


def formatar(row):
    return {"id": row["id"], "descricao": row["descricao"], "tipo": row["tipo"],
            "valor": f'{Decimal(row["valor_centavos"]) / 100:.2f}', "data": row["data"]}


@app.get("/")
def inicio():
    return FileResponse(STATIC / "index.html")


@app.post("/transacoes", status_code=status.HTTP_201_CREATED)
def criar_transacao(transacao: Transacao):
    with connect() as db:
        cursor = db.execute(
            "INSERT INTO transacoes (descricao, tipo, valor_centavos, data) VALUES (?, ?, ?, ?)",
            (transacao.descricao, transacao.tipo.value, int(transacao.valor * 100), transacao.data.isoformat()),
        )
        row = db.execute("SELECT * FROM transacoes WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return formatar(row)


@app.get("/transacoes")
def listar_transacoes():
    with connect() as db:
        rows = db.execute("SELECT * FROM transacoes ORDER BY data DESC, id DESC").fetchall()
    return [formatar(row) for row in rows]


@app.get("/saldo")
def consultar_saldo():
    with connect() as db:
        total = db.execute("""SELECT COALESCE(SUM(CASE WHEN tipo = 'receita'
            THEN valor_centavos ELSE -valor_centavos END), 0) FROM transacoes""").fetchone()[0]
    return {"saldo": f"{Decimal(total) / 100:.2f}", "moeda": "BRL"}


@app.delete("/transacoes/{transacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_transacao(transacao_id: int):
    with connect() as db:
        cursor = db.execute("DELETE FROM transacoes WHERE id = ?", (transacao_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
