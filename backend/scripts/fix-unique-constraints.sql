-- Corrige as constraints UNIQUE erradas em subjects, classrooms e students,
-- sem apagar dados. Alternativa ao `docker compose down -v`.
--
-- Contexto: a forma `unique: ["a","b"]` (array) num atributo não existe na API
-- do Sequelize v6 e gerava constraints de coluna única em vez das compostas
-- pretendidas. Ver docs/project-rules.md, secção 5.
--
-- Uso:
--   docker compose exec -T school psql -U postgres -d school_system \
--     < backend/scripts/fix-unique-constraints.sql
--
-- Idempotente: pode correr mais que uma vez. Corre dentro de uma transaction,
-- por isso ou passa tudo ou não passa nada.

BEGIN;

-- 1. Largar a unicidade errada. Procura pelas COLUNAS e não por nomes: a
--    primeira versão deste script adivinhava nomes à maneira do Sequelize
--    (`students_idCard_unique`) e falhou em silêncio, porque para um
--    `unique: true` de coluna o Sequelize emite o UNIQUE inline no CREATE
--    TABLE sem lhe dar nome e quem nomeia é o PostgreSQL, com o seu padrão
--    `<tabela>_<coluna>_key`.
--
--    Trata os dois casos: unicidade que existe como CONSTRAINT (nascida de um
--    UNIQUE no CREATE TABLE) e como ÍNDICE solto (nascida de um addIndex).
--
--    Só larga conjuntos de UMA coluna e só os errados. As compostas criadas
--    mais abaixo têm duas colunas e nunca casam. student_code, user_id e as
--    chaves primárias também não casam, logo ficam intactas.
DO $$
DECLARE
  r   record;
  con text;
BEGIN
  FOR r IN
    SELECT i.indexrelid::regclass::text     AS idx,
           t.relname                        AS tbl,
           -- ::text obrigatório: attname é do tipo `name`, e name[] não compara
           -- com os literais text[] do IF abaixo
           array_agg(a.attname::text ORDER BY a.attname::text) AS cols
      FROM pg_index i
      JOIN pg_class t     ON t.oid = i.indrelid
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indisunique
       AND NOT i.indisprimary
       AND t.relname IN ('subjects', 'classrooms', 'students')
     GROUP BY i.indexrelid, t.relname
  LOOP
    IF (r.tbl::text IN ('subjects', 'classrooms')
        AND r.cols IN (ARRAY['school_id'], ARRAY['name'], ARRAY['code']))
       OR (r.tbl::text = 'students'
        AND r.cols IN (ARRAY['id_card'], ARRAY['id_number']))
    THEN
      SELECT c.conname INTO con
        FROM pg_constraint c
       WHERE c.conindid = r.idx::regclass AND c.contype = 'u';

      IF con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.tbl, con);
      ELSE
        EXECUTE format('DROP INDEX %I', r.idx);
      END IF;

      RAISE NOTICE 'largada unicidade em %(%)', r.tbl, array_to_string(r.cols, ',');
    END IF;
  END LOOP;
END $$;

-- 2. Normalizar id_card: passou a guardar o TIPO de documento, não o número.
--    Qualquer valor legado que não seja um dos códigos aceites vai para NULL,
--    senão a primeira edição desse aluno é recusada pelo validate do modelo.
--    O número em si continua em id_number, não se perde nada que lá esteja.
UPDATE students
   SET id_card = NULL
 WHERE id_card IS NOT NULL
   AND id_card NOT IN ('BI', 'PASSPORT', 'OTHER');

-- 3. Criar as constraints corretas, agora compostas por escola.
--    Falha se já existirem linhas duplicadas — nesse caso a transaction inteira
--    reverte e é preciso resolver os duplicados primeiro (a query de
--    verificação no fim ajuda a encontrá-los).
CREATE UNIQUE INDEX IF NOT EXISTS subject_school_name      ON subjects   (school_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS subject_school_code      ON subjects   (school_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS classroom_school_name    ON classrooms (school_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS classroom_school_code    ON classrooms (school_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS student_school_id_number ON students   (school_id, id_number);

COMMIT;

-- 4. Verificação. Deve mostrar as compostas e nenhuma UNIQUE de coluna única
--    em school_id, name, code ou id_card.
SELECT tablename, indexname, indexdef
  FROM pg_indexes
 WHERE tablename IN ('subjects', 'classrooms', 'students')
   AND indexdef LIKE '%UNIQUE%'
 ORDER BY tablename, indexname;
