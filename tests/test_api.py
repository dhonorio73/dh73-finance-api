from fastapi.testclient import TestClient
import main


def test_transacoes_e_saldo(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DATABASE", str(tmp_path / "teste.db"))
    with TestClient(main.app) as client:
        receita = {"descricao": "Salário fictício", "tipo": "receita", "valor": "100.10", "data": "2026-01-01"}
        despesa = {"descricao": "Livro", "tipo": "despesa", "valor": "25.05", "data": "2026-01-02"}
        primeira = client.post("/transacoes", json=receita)
        assert primeira.status_code == 201
        assert client.post("/transacoes", json=despesa).status_code == 201
        assert client.get("/saldo").json()["saldo"] == "75.05"
        assert len(client.get("/transacoes").json()) == 2
        assert client.delete(f"/transacoes/{primeira.json()['id']}").status_code == 204
        assert client.get("/saldo").json()["saldo"] == "-25.05"
        assert client.delete("/transacoes/999").status_code == 404


def test_valores_invalidos(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DATABASE", str(tmp_path / "teste.db"))
    with TestClient(main.app) as client:
        base = {"descricao": "Teste", "tipo": "receita", "data": "2026-01-01"}
        for valor in ("0", "-1", "1.234"):
            assert client.post("/transacoes", json={**base, "valor": valor}).status_code == 422
        assert client.post("/transacoes", json={**base, "descricao": "   ", "valor": "1"}).status_code == 422
