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

-- 1. Largar as constraints erradas. IF EXISTS: se o nome não bater (base
--    criada por outra versão do modelo), a linha é um no-op em vez de erro.
--    A verificação no fim mostra o estado real.
ALTER TABLE subjects   DROP CONSTRAINT IF EXISTS "subjects_schoolId_unique";
ALTER TABLE subjects   DROP CONSTRAINT IF EXISTS "subject_school_name";
ALTER TABLE subjects   DROP CONSTRAINT IF EXISTS "subject_school_code";

ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS "classrooms_schoolId_unique";
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS "classroom_school_name";
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS "classroom_school_code";

ALTER TABLE students   DROP CONSTRAINT IF EXISTS "students_idCard_unique";
ALTER TABLE students   DROP CONSTRAINT IF EXISTS "students_idNumber_unique";

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
