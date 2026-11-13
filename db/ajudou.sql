-- Tabela do "Este artigo te ajudou?" (banco D1 ligado ao Pages com o nome AJUDOU).
-- Uma linha por artigo, só com os totais. A função cria a tabela sozinha no primeiro voto; este arquivo fica como referência.
CREATE TABLE IF NOT EXISTS votos (
  slug TEXT PRIMARY KEY,
  sim INTEGER NOT NULL DEFAULT 0,
  nao INTEGER NOT NULL DEFAULT 0,
  atualizado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
