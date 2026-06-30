-- Limpeza de entradas recorrentes duplicadas
-- Mantém: pago > criado mais recente (por cliente_id + mês)

DELETE FROM financial_entries
WHERE id NOT IN (
  SELECT DISTINCT ON (cliente_id, substring(vencimento::text, 1, 7))
    id
  FROM financial_entries
  WHERE recorrente = true
    AND tipo = 'entrada'
    AND cliente_id IS NOT NULL
  ORDER BY
    cliente_id,
    substring(vencimento::text, 1, 7),
    CASE WHEN status = 'pago' THEN 0 ELSE 1 END,
    created_at DESC NULLS LAST,
    id DESC
)
AND recorrente = true
AND tipo = 'entrada'
AND cliente_id IS NOT NULL;

-- Remove entradas sem cliente_id que sejam duplicatas por nome no mesmo mês
-- (entradas antigas criadas manualmente antes do sistema de auto-criação)
DELETE FROM financial_entries a
WHERE a.cliente_id IS NULL
  AND a.recorrente = true
  AND a.tipo = 'entrada'
  AND a.id NOT IN (
    SELECT DISTINCT ON (lower(trim(nome)), substring(vencimento::text, 1, 7))
      id
    FROM financial_entries
    WHERE cliente_id IS NULL
      AND recorrente = true
      AND tipo = 'entrada'
    ORDER BY
      lower(trim(nome)),
      substring(vencimento::text, 1, 7),
      CASE WHEN status = 'pago' THEN 0 ELSE 1 END,
      created_at DESC NULLS LAST,
      id DESC
  );

-- Constraint único: impede duplicatas futuras por cliente por mês
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_recorrente_cliente_mes
  ON financial_entries (cliente_id, substring(vencimento::text, 1, 7))
  WHERE recorrente = true AND tipo = 'entrada' AND cliente_id IS NOT NULL;

notify pgrst, 'reload schema';
