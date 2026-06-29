-- Adiciona coluna de ordenação nos anexos
alter table attachments add column if not exists ordem integer default 0;

-- Inicializa ordem baseada no created_at por demanda
update attachments a
set ordem = sub.rn
from (
  select id,
    row_number() over (partition by demand_id order by created_at asc)::integer as rn
  from attachments
) sub
where a.id = sub.id;

notify pgrst, 'reload schema';
