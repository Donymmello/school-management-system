# Regras do jogo — School/Faculty Management SaaS

> Documento vivo. Atualizar sempre que uma decisão de produto ou arquitetura mudar.

## 0. Padrão de código

- **ACID não é opcional.** Toda escrita que precisa ser única (email, código gerado,
  nome dentro da escola) tem que ter uma `UNIQUE constraint` de verdade no MySQL por
  trás — checagem "já existe?" em JS antes do `create()` é só UX (evita um round-trip
  desnecessário), nunca a garantia real, porque duas requisições concorrentes podem
  passar pela checagem ao mesmo tempo. A constraint é quem garante isolamento; o
  catch de `SequelizeUniqueConstraintError` (`utils/dbErrors.js`) é quem transforma
  isso numa resposta 409 decente em vez de um 500 cru. Escritas multi-tabela usam
  `sequelize.transaction()` (managed transaction, como já era feito em
  `auth.controller.js`) para atomicidade.
  Docs: [Sequelize Transactions](https://sequelize.org/docs/v6/other-topics/transactions/),
  [UniqueConstraintError](https://sequelize.org/api/v6/class/src/errors/validation/unique-constraint-error.ts~uniqueconstrainterror),
  [MySQL InnoDB isolation levels](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html).
- Antes de assumir como uma lib/framework se comporta, checar a documentação oficial
  da versão que o projeto usa (não confiar de memória).
- Consertar na raiz, não no sintoma: um bug num padrão repetido em vários controllers
  (import errado, filtro que falta) vira um helper/middleware compartilhado, não N
  patches iguais espalhados.

## 1. Visão

SaaS de gestão escolar/acadêmica multi-tenant: cada cliente (escola ou faculdade) é um
tenant isolado dentro da mesma aplicação, pagando uma assinatura para usar o sistema.

## 2. Público-alvo

**Multi-segmento, mas cada escola opera em só um modelo — decidido no cadastro.**
Decisão explícita: "quero algo misto que vai depender de como o perfil é
cadastrado... se for para escolas de ensino secundário que apresente as
características de um, e se for técnico ou superior que se comporte como
tal, são poucos os casos de instituições que sejam as duas coisas". Ou seja,
**não é uma plataforma que muda de cara pro mesmo tenant** — é uma
plataforma com dois produtos internos, e o cadastro decide qual dos dois a
escola usa, pra sempre:

- `School.academicModel` (`SECONDARY` ou `HIGHER_ED`), obrigatório no
  cadastro (`/registrar-escola` e `createSchool` do SUPER_ADMIN),
  **imutável depois** — não é editável nem pela tela `/escolas`. Motivo:
  os dois modelos de dado são incompatíveis o suficiente (turma fixa vs.
  créditos/ofertas) pra uma troca sem migração real deixar dado órfão. Ver
  seção 5 pra detalhes de implementação.
- `HIGHER_ED` (técnico/superior) usa `Course`/`CourseOffering`/
  `CourseOfferingSubject`/`Enrollment`/`Schedule`/`Assessment`/
  `StudentAssessment`/`AcademicPolicy` (sistema de ofertas e créditos).
  Bloqueado (403) via middleware pra escolas `SECONDARY`.
- `SECONDARY` (ensino secundário) usa `Classroom` + `Student.grade` (turma
  fixa por série) — sem entrar nas rotas acima.
- `Subject`, `Teacher`, `Classroom`, `Grade` e `Attendance` são
  compartilhados pelos dois modelos (infraestrutura básica que qualquer
  instituição precisa, independente de operar por turma fixa ou por
  oferta/crédito).

## 3. Modelo de negócio

- Assinatura **mensal ou anual por escola/faculdade** (não por aluno).
- Planos já modelados em `School.plan`: `FREE`, `BASIC`, `PREMIUM`.
- **Nº de alunos também deve influenciar o plano/preço** — mecanismo exato (teto fixo
  por plano, preço escalonado por faixa de alunos, ou os dois) ainda não decidido. Ver
  item 7.
- Cobrança automatizada (gateway de pagamento) fica para depois do MVP — ver roadmap.

## 4. Papéis e permissões

Enum atual em `User.role`: `SUPER_ADMIN, ADMIN, DIRECTOR, SECRETARY, TEACHER, STUDENT, STAFF, USER`.

Não era a intenção original, mas a direção combinada é evoluir para:

- **SUPER_ADMIN** — dono/equipe do SaaS. Enxerga e administra todas as escolas
  (billing, status de conta, suporte). Não pertence a nenhuma `School` específica
  (`schoolId = null`).
- **ADMIN** — administrador máximo de **uma** escola (`schoolId` obrigatório). Não vê
  dados de outras escolas.
- **DIRECTOR / SECRETARY / TEACHER / STAFF / STUDENT** — papéis operacionais dentro de
  uma escola, com permissões mais restritas que ADMIN.
- `USER` é um valor default genérico do enum, sem uso funcional claro — candidato a
  remover quando formos revisar o enum.

Regra geral: toda ação de um usuário não-SUPER_ADMIN é implicitamente restrita ao
próprio `schoolId`.

## 5. Isolamento multi-tenant

**Status: implementado em todos os módulos ativos, inclusive os profundos de
matrícula/notas (Student, Teacher, Staff, Course, Classroom, Subject,
CourseOffering, CourseOfferingSubject, Enrollment, Schedule, Assessment,
StudentAssessment, Grade, Attendance, AcademicPolicy).**

- `schoolId` em `User`, `Student`, `Teacher`, `Staff`, `Course`, `Classroom`, `Subject`,
  todos associados a `School`.
- Middleware `middleware/tenant.middleware.js` (`requireSchool`) roda depois do
  `authMiddleware`: preenche `req.schoolId` a partir do token do usuário; `SUPER_ADMIN`
  pode ver todas as escolas ou filtrar via `?schoolId=`.
- Helper `utils/tenantScope.js` (`tenantWhere`) usado em todas as queries de
  student/course/classroom/subject controllers, e no `create()` de cada um.
- `classroom.code`/`classroom.name` e `subject.code` deixaram de ser únicos
  globalmente e passaram a ser únicos por escola (`schoolId + code`).
- `School` ganhou CRUD mínimo (`controllers/school.controller.js`,
  `routes/schools.routes.js`) — só `SUPER_ADMIN` cria/lista escolas.
- `POST /api/auth/bootstrap-admin` agora cria o `SUPER_ADMIN` (dono da plataforma, sem
  escola) em vez de um `ADMIN`. `POST /api/auth/register-user` aceita `SUPER_ADMIN`
  (que deve informar `schoolId` no body) ou `ADMIN` (herda a própria escola). `POST
  /api/auth/register-student` (rota pública) agora exige `schoolId` no body.

**Controllers que estavam vazios/quebrados, agora implementados:**

- `teacher.controller.js` e `staff.controller.js` — estavam vazios (Staff nem
  existia; `staff.routes.js` era código Mongoose herdado de outro projeto,
  nunca funcionou com Sequelize). Agora têm list/get/update/delete com
  `tenantWhere`, ligados em `server.js` (`/api/teachers`, `/api/staff`).
  Criação continua passando por `POST /api/auth/register-user` (role
  TEACHER/STAFF), igual ao padrão de Student.
- `attendance.controller.js` e `grade.controller.js` — também vazios, rotas
  sem `module.exports`. Implementados com isolamento por escola via join
  obrigatório no `Student` (essas tabelas não têm `schoolId` próprio — ver
  abaixo). De quebra, corrigi bugs no model `Attendance`: nome interno
  "Attendace" (typo), opções `createAt`/`updateAt` erradas (deveriam ser
  `createdAt`/`updatedAt`, por isso nunca pegavam), e o campo `present`
  (STRING solto) virou `status` (ENUM PRESENT/ABSENT/LATE/JUSTIFIED) com
  índice único (`student_id`, `date`) pra não duplicar frequência do mesmo
  dia.
- `email.routes.js` continua incompleto (sem `module.exports`, sem rotas) —
  fora do escopo desta rodada, não é bem um "controller".

**Vazamento cross-tenant fechado nas tabelas profundas (matrícula/notas):**

Uma auditoria pedida explicitamente ("foca nos imperiosos para o sistema
funcionar") achou que `CourseOffering`, `Enrollment`, `CourseOfferingSubject`,
`Schedule`, `Assessment` e `StudentAssessment` tinham **zero** isolamento por
escola — qualquer usuário autenticado de uma escola conseguia ler/escrever
matrícula, nota e horário de outra escola só adivinhando o `id`. Fechado com
o mesmo padrão de join já usado em `Grade`/`Attendance` (nenhuma tabela nova
ganhou `schoolId` próprio — são todas 1-2 saltos de uma tabela que já tem
`schoolId`, duplicar a coluna criaria risco de dessincronia):

- `CourseOffering` → isolado via join obrigatório em `Course`.
- `Enrollment` → isolado via join no `Student`; `courseOfferingId` informado
  na criação é validado contra `Course` da mesma escola também.
- `CourseOfferingSubject` → isolado via join no `Subject` (`subjectId` nunca
  é nulo); `courseOfferingId` e `teacherId` também validados contra a escola.
- `Schedule` → isolado via join em `CourseOfferingSubject → Subject`
  (não dava pra confiar em `Classroom` porque `classroomId` é opcional).
- `Assessment` e `StudentAssessment` → mesmo caminho de join via
  `CourseOfferingSubject → Subject`.
- Todas as rotas correspondentes (`courseOfferings`, `enrollment`,
  `courseOfferingSubjects`, `schedules`, `assessments`, `studentAssessments`,
  `results`) ganharam o middleware `requireSchool`, que antes faltava por
  completo nelas — sem isso `req.schoolId` nunca era setado e os controllers
  não tinham como filtrar.
- De quebra, três checagens de duplicidade que só existiam como
  "já existe? então erro" em JS (sem `UNIQUE constraint` real por trás,
  violando a regra ACID da seção 0) ganharam a constraint: matrícula
  duplicada (`enrollments`: `student_id + course_offering_id`), disciplina
  duplicada numa oferta (`course_offering_subjects`: `course_offering_id +
  subject_id`) e nota duplicada pra mesma avaliação (`student_assessments`:
  `enrollment_id + assessment_id`).

**Cálculo de resultado final (`/api/results/:enrollmentId/:courseOfferingSubjectId`)
estava completamente quebrado, agora funcional:**

- `AcademicPolicy` (nota de dispensa de exame, nota de aprovação) tinha o
  model pronto mas **nunca foi importado em `models/index.js`** — qualquer
  chamada batia em `Cannot read properties of undefined`. Corrigido, e o
  model ganhou `schoolId` (cada escola pode ter sua própria política; antes
  seria uma política global compartilhada por todas as escolas). Toda escola
  nova (`registerSchool`/`createSchool`) já cria sua `AcademicPolicy` default
  numa transaction, senão a rota de resultado nunca teria dado pra usar.
  Endpoint mínimo pra consultar/ajustar depois: `GET/PATCH
  /api/academic-policies/active`.
- `gradeCalculation.service.js` tinha três bugs que impediam qualquer cálculo:
  parâmetro `courseOfferingSemesterId` declarado mas o código usava a
  variável inexistente `courseOfferingSubjectId` (ReferenceError imediato);
  a query buscava `Assessment` com um include auto-referenciado
  (`{ model: Assessment, as: "assessment" }`, associação que não existe) em
  vez de buscar `StudentAssessment` (que é quem tem `enrollmentId` +
  `assessmentId`) incluindo `Assessment`; e `exameScore = ...` (typo) criava
  uma global implícita em vez de setar `examScore`, então a nota de exame
  nunca aparecia no resultado mesmo que a query funcionasse. Reescrito do
  zero seguindo o padrão de isolamento acima (matrícula e disciplina
  validadas contra a escola do chamador antes de calcular).
- `result.controller.js` desestruturava `req.params.courseOfferingStudentId`,
  mas a rota declara `:courseOfferingSubjectId` — sempre `undefined`.
  Corrigido o nome do parâmetro.

**Segregação por tipo de instituição (`School.academicModel`):**

Além de isolar dado *entre* escolas (multi-tenant), agora existe uma segunda
dimensão de isolamento *dentro* do que uma escola pode acessar, baseada em
`academicModel`:

- `models/school.js` ganhou `academicModel` (`ENUM("SECONDARY", "HIGHER_ED")`,
  `allowNull: false`). Exigido em `registerSchool` e `createSchool`
  (`school.controller.js`), nunca aceito em `updateSchool` — imutável de
  propósito (ver seção 2).
- `middleware/academicModel.middleware.js` (`requireAcademicModel(model)`,
  novo) roda depois do `requireSchool`: busca `School.academicModel` por
  `req.schoolId` e responde 403 se não bater. Pula a checagem quando
  `req.schoolId` é `null` (SUPER_ADMIN sem `?schoolId=`), mesma semântica do
  `tenantWhere`. Diferente do resto do isolamento multi-tenant (que lê
  `req.user` do JWT sem tocar o banco), esse aqui consulta `School` a cada
  request — necessário porque o SUPER_ADMIN escolhe a escola por
  `?schoolId=`, não dá pra fixar num claim do token.
- Aplicado como `requireHigherEd` em todas as rotas de
  `courses`/`courseOfferings`/`courseOfferingSubjects`/`enrollment`/
  `schedules`/`assessments`/`studentAssessments`/`results`/
  `academicPolicies` — todas exclusivas de escolas `HIGHER_ED`.
- `Grade` e `Attendance` **não foram bloqueadas** pra `HIGHER_ED` ainda, de
  propósito: o frontend de `Assessment`/`StudentAssessment`/`Results` (a
  alternativa "certa" pra faculdade) ainda não existe (ver seção 6, item 3).
  Bloquear agora deixaria escola `HIGHER_ED` sem nenhuma forma de lançar
  nota/frequência. Decidir separação definitiva quando esse frontend for
  construído.
- `mapUserToResponse`/`login`/`registerStudent`/`getMe` (`auth.controller.js`)
  agora devolvem `academicModel` dentro de `user.school` — é como o frontend
  (`NavDrawer`, `RequireAuth`, `App.jsx`) decide esconder Cursos/Ofertas/
  Matrículas do menu e bloquear a rota pra escolas `SECONDARY`.

**Pendências conhecidas:**

- `registerStudent` (auto-cadastro público) pede `schoolId` cru no body — não tem
  resolução por slug/subdomínio ainda. Ver item 7.
- Não foi possível rodar um teste de ponta a ponta com banco real neste ambiente (sem
  Docker/MySQL disponível aqui). Validado só estaticamente (sintaxe, cadeia de
  `require`, boot do `server.js`, aliases do Sequelize). Recomendo rodar
  `docker-compose up` localmente e testar o fluxo bootstrap → criar escola → registrar
  admin → login → criar turma em duas escolas diferentes → confirmar que uma escola não
  vê a turma da outra, antes de considerar isso pronto.

## 6. Roadmap MVP (proposta)

Ordem sugerida, do que destrava o quê:

1. ~~**Isolamento multi-tenant real**~~ — feito para todos os módulos ativos, incluindo
   as tabelas profundas de matrícula/notas (ver seção 5). Falta só validar com banco
   real (docker-compose) — não foi possível testar aqui.
2. ~~**Onboarding de escola**~~ — `POST /api/schools/register` (público): cria a
   `School` + o primeiro `ADMIN` dela numa transaction só, já devolve token de login.
   Falta decidir preço por nº de alunos (item 7) antes de ligar isso a cobrança de
   verdade, e resolver `registerStudent` por slug em vez de `schoolId` cru (pendência
   da seção 5).
3. **Frontend MVP — em andamento.** Feito nesta rodada (fatia vertical fina):
   - Migração do scaffold de create-react-app pra Vite de verdade (o
     `docker-compose`/`Dockerfile` já esperavam Vite na porta 5173, mas o projeto
     ainda era CRA — `npx vite` ia falhar). Agora `package.json`, `vite.config.js`,
     `index.html` e `src/main.jsx` estão consistentes, com proxy `/api` configurável
     por env (`VITE_API_PROXY_TARGET`, já setado no `docker-compose.yml` pra apontar
     pro serviço `api_backend`).
   - `AuthContext` + `apiClient` (axios com token no header, logout automático em
     401), rotas protegidas por papel (`RequireAuth`), layout com nav lateral
     (`DashboardLayout`).
   - Páginas: cadastro de escola (`/registrar-escola` → `POST /schools/register`),
     login, dashboard inicial, e o módulo de **Alunos** completo (listar, criar,
     editar, excluir) com loading/empty/error state.
   - Protótipo antigo (formulários soltos sem auth, `StudentForm`/`TeacherForm`/
     `StaffForm`/`GradeForm`/`AttendanceForm`/`EmailForm` e os `services/*.js`
     correspondentes) removido — incompatível com o backend atual (sem token, URL
     hardcoded, campos desatualizados).
   - Validado com `vite build` (produção) e `vite dev` rodando sem erro neste
     ambiente. **Não testado num navegador de verdade** — precisa abrir a mão na
     prática (`docker-compose up` ou `npm run dev`) e conferir visualmente.

   **Módulos adicionados nesta rodada** (mesmo padrão do módulo de Alunos —
   listar/criar/editar/excluir com loading/empty/error state): Professores
   (`/professores`), Disciplinas (`/disciplinas`), Cursos (`/cursos`), Ofertas
   de curso (`/ofertas`, com desativar em vez de excluir), Matrículas
   (`/matriculas`, com fluxo aprovar/rejeitar/cancelar e motivo de rejeição),
   Frequência (`/frequencia`) e Notas (`/notas`). Menu lateral
   (`NavDrawer.jsx`) e rotas protegidas (`App.jsx`) filtram cada item pelos
   mesmos papéis que o backend já exige em `authorizeRoles(...)`, pra não
   mostrar um link que vai dar 403. `vite build` validado sem erros.

   **Falta para o MVP completo:** matrícula/nota/frequência ainda dependem de
   selects simples (aluno, oferta, disciplina) sem busca/paginação — ok pra
   poucas dezenas de registros, vira problema em escolas grandes. Não há
   telas de Ofertas→Disciplinas (`CourseOfferingSubject`), Horário
   (`Schedule`), Avaliações (`Assessment`/`StudentAssessment`) nem Resultado
   final — ficaram de fora desta fatia por serem mais avançados (modelo
   faculdade); o backend deles já está pronto e isolado por escola (ver seção
   5), só falta o frontend se algum cliente precisar. Também não há
   autoatendimento do aluno (ver a própria matrícula/nota/frequência
   logado como STUDENT) — hoje só papéis administrativos operam essas telas.
4. **Billing — em andamento, começou pela parte manual.** O CRUD de `School`
   (criar/listar/editar plano e status) já existia no backend
   (`school.controller.js`) mas não tinha frontend nenhum — agora tem, em
   `/escolas` (só SUPER_ADMIN vê o item no menu). E o "bloqueio de acesso por
   inadimplência" que o roadmap pedia **não existia de verdade**: `School.status`
   já existia no model (`ACTIVE`/`INACTIVE`) mas nada no backend olhava pra ele —
   um SUPER_ADMIN podia marcar uma escola como `INACTIVE` e os usuários dela
   continuavam logando normalmente. Corrigido em `auth.controller.js`: `login()`
   agora rejeita (403) se `user.school.status !== "ACTIVE"` (SUPER_ADMIN nunca
   cai nessa checagem, não tem escola própria).
   **Limitação conhecida, aceita conscientemente:** a checagem roda só no
   `login()`, não em cada request (`requireSchool` não consulta o banco, só lê o
   token). Isso significa que uma sessão já aberta continua funcionando até o
   JWT expirar (24h) mesmo depois da escola ser desativada — troca deliberada de
   simplicidade por uma janela de até 1 dia, em vez de consultar `School` em
   toda requisição autenticada. Se isso virar problema real (ex: precisar
   suspender acesso na hora por abuso), a solução é reduzir o TTL do token ou
   adicionar uma lista de revogação — não fazer essa troca agora.
   **Falta pra fechar o item 4 de verdade:** gateway de pagamento automatizado
   e a decisão de precificação por nº de alunos (item 7) continuam pendentes —
   por ora o SUPER_ADMIN muda plano/status manualmente pela tela `/escolas`.
   **Pausado por decisão explícita ("os pagamentos pode esperar") — a
   prioridade agora é o item 5.**
5. **Portais por papel (Professor, Aluno, Staff) — próximo, ainda não iniciado.**
   Anotado por pedido explícito ("temos que organizar o portal dos
   docentes/professores/alunos/e staff, anota só"), implementação fica pra
   depois.

   O que existe hoje (Professores, Disciplinas, Cursos, Ofertas, Matrículas,
   Frequência, Notas — seção 6, item 3) são todas **telas administrativas**:
   ADMIN/DIRECTOR/SECRETARY/STAFF operando o dado de terceiros. Não existe
   ainda a visão "eu, logado como TEACHER/STUDENT/STAFF, vejo e opero só o que
   é meu". É um tipo de tela diferente, não só mais um módulo CRUD:

   - **Portal do Professor**: turmas/disciplinas que ele leciona (via
     `CourseOfferingSubject.teacherId`), lançar frequência/nota só dos seus
     próprios alunos e disciplinas. Hoje os formulários de Frequência/Notas
     deixam qualquer TEACHER escolher qualquer aluno num select aberto — não
     restringem ao escopo do professor logado.
   - **Portal do Aluno**: ver as próprias notas, frequência e status de
     matrícula (pendente/aprovada/rejeitada), só leitura. Hoje STUDENT nem
     está nas roles que acessam `/notas`, `/frequencia` ou `/matriculas`.
   - **Portal do Staff**: ainda não dá pra desenhar — o papel STAFF hoje só
     tem `position`/`department` no model, sem nenhuma função específica
     atrelada. Precisa decidir o que um STAFF deveria ver/fazer antes de
     desenhar a tela (ver item 7).
   - Tecnicamente isso pede coisa que ainda não existe: um jeito de resolver
     "qual é o meu registro operacional" a partir do usuário logado (hoje
     `getMe` só devolve o `User` cru, não o `Teacher`/`Student`/`Staff`
     vinculado), endpoints "meus dados" que filtrem por dono e não só por
     escola, e um dashboard por papel em vez do `DashboardHome` genérico
     atual.

## 7. Decisões em aberto

- ~~Se cada escola poderá alternar entre "modo escola" e "modo faculdade", ou se
  isso é fixo no cadastro.~~ **Decidido:** fixo no cadastro (`School.academicModel`,
  imutável). Ver seção 2 e 5.
- Se o enum `role` deve ganhar papel específico para faculdade (ex: `COORDINATOR`) ou os
  papéis atuais bastam.
- Estratégia de billing (gateway, moeda, país) — fica para quando chegarmos no item 4.
- Como o nº de alunos influencia o plano/preço (teto por plano vs. preço escalonado vs.
  ambos) — decidir antes de implementar o item 4 do roadmap (billing).
- O que um STAFF genérico deveria ver/fazer no próprio portal — hoje o papel só tem
  `position`/`department` no model, sem função específica atrelada. Decidir antes de
  desenhar o portal do item 5.
