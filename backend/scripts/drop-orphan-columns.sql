-- Larga as colunas órfãs em camelCase deixadas por associações cujo
-- foreignKey nunca teve atributo correspondente no modelo.
--
-- Sem `field:` no atributo, o Sequelize usa o nome do foreignKey tal e qual
-- como nome de coluna — daí "courseId"/"classroomId"/"approvedBy" no meio de
-- um schema todo em snake_case. Ver docs/project-rules.md, secção 5.
--
-- O que sai:
--   subjects."courseId"                  associação Course<->Subject, removida
--   students."courseId"                  associação Student<->Course, removida
--   course_offering_subjects."classroomId"  associação Classroom<->COS, removida
--   enrollments."approvedBy"             duplicado de approved_by (ver abaixo)
--
-- O caso de enrollments é diferente dos outros três: o modelo declarava o
-- atributo como "aprovedBy" (um "p"), que não casava com o
-- `foreignKey: "approvedBy"` da associação. O Sequelize criava então um
-- segundo atributo, e o controller escrevia nesse — a coluna approved_by, a
-- que o modelo julgava estar a usar, ficava sempre vazia. Corrigida a grafia
-- no modelo, "approvedBy" passa a apontar para approved_by e a coluna
-- inventada deixa de ter uso.
--
-- Uso:
--   docker compose exec -T school psql -U postgres -d school_system \
--     -v ON_ERROR_STOP=1 < backend/scripts/drop-orphan-columns.sql

BEGIN;

-- Salvaguarda: recusa-se a largar qualquer coluna que tenha dados. Estas
-- estavam todas a zero quando isto foi escrito, mas noutro ambiente podem não
-- estar — e aí é preciso decidir para onde vai o dado antes, não durante.
DO $$
DECLARE
  alvo record;
  n    bigint;
BEGIN
  FOR alvo IN
    SELECT * FROM (VALUES
      ('subjects',                 'courseId'),
      ('students',                 'courseId'),
      ('course_offering_subjects', 'classroomId'),
      ('enrollments',              'approvedBy')
    ) AS t(tbl, col)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = alvo.tbl
                  AND column_name = alvo.col)
    THEN
      EXECUTE format('SELECT count(%I) FROM %I', alvo.col, alvo.tbl) INTO n;

      IF n > 0 THEN
        RAISE EXCEPTION 'A coluna %.% tem % valores preenchidos — nada foi largado. Decide o destino do dado primeiro.',
          alvo.tbl, alvo.col, n;
      END IF;

      EXECUTE format('ALTER TABLE %I DROP COLUMN %I', alvo.tbl, alvo.col);
      RAISE NOTICE 'largada %.% (estava vazia)', alvo.tbl, alvo.col;
    ELSE
      RAISE NOTICE 'ignorada %.% (já não existe)', alvo.tbl, alvo.col;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Verificação: não deve sobrar nenhuma coluna em camelCase no schema.
SELECT table_name, column_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND column_name ~ '[a-z][A-Z]'
 ORDER BY table_name, column_name;
