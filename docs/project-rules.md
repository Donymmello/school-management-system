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
- Planos já modelados em `School.plan`: `FREE`, `BASIC`, `PREMIUM` — **os mesmos 3
  para os dois `academicModel`, sem mudança de schema.** Decisão: não criar um
  catálogo de plano separado por tipo de instituição (ex: enum maior ou tabela de
  planos própria) — o `HIGHER_ED` naturalmente usa mais módulos (Cursos, Ofertas,
  Matrículas, Avaliações) que só ele tem acesso, o que já justifica cobrar mais caro
  por um plano de mesmo nome sem precisar modelar isso no banco.
- **O preço cobrado de fato varia por `academicModel`** — isso é só uma tabela de
  referência pro `SUPER_ADMIN` usar quando ajusta `School.plan`/`status` manualmente
  em `/escolas` (hoje não tem cobrança automatizada, então não tem onde outro lugar
  isso precisaria estar codificado):

  | Plano   | `SECONDARY` | `HIGHER_ED` |
  |---------|-------------|-------------|
  | FREE    | —           | —           |
  | BASIC   | TBD         | TBD (> SECONDARY) |
  | PREMIUM | TBD         | TBD (> SECONDARY) |

  Valores em aberto — ninguém definiu preço concreto ainda. A regra combinada é só
  a *relação* (HIGHER_ED custa mais que SECONDARY no mesmo plano), não os números.
- **Nº de alunos também deve influenciar o plano/preço** — mecanismo exato (teto fixo
  por plano, preço escalonado por faixa de alunos, ou os dois) ainda não decidido, e
  é uma variável independente da tabela acima (as duas — tipo de instituição e nº de
  alunos — precisam ser combinadas quando o billing automatizado for desenhado de
  verdade). Ver item 7.
- Cobrança automatizada (gateway de pagamento) fica para depois do MVP — ver roadmap.

## 4. Papéis e permissões

**Lista final de papéis (decisão registrada — ver seção 7):**

`SUPER_ADMIN, ADMIN, DIRECTOR, TEACHER, STAFF, STUDENT`

- **SUPER_ADMIN** — dono/equipe do SaaS. Enxerga e administra todas as escolas
  (billing, status de conta, suporte). Não pertence a nenhuma `School` específica
  (`schoolId = null`).
- **ADMIN** — administrador máximo de **uma** escola (`schoolId` obrigatório). Não vê
  dados de outras escolas.
- **DIRECTOR** — liderança acadêmica dentro de uma escola (visão ampla, mas sem os
  poderes de conta/billing do ADMIN).
- **STAFF** — pessoal de secretaria: lança nota, trata matrícula/inscrição, trata
  propina/mensalidade do aluno, gerencia Turmas/Cursos/Ofertas/Disciplinas/
  Professores. Único papel de "operação administrativa do dia a dia" — ver
  unificação com SECRETARY abaixo.
- **TEACHER** — lança nota/frequência dos próprios alunos (hoje sem filtro "só as
  minhas turmas" nas telas administrativas — ver Portal do Professor, seção 6,
  item 5).
- **STUDENT** — portal próprio, somente leitura, auto-escopado (Notas, Frequência,
  Matrículas, Propinas — ver seção 6, item 5).

**SECRETARY foi unificado em STAFF.** Os dois papéis faziam exatamente a mesma
coisa administrativa e a distinção nunca foi formalizada — decisão explícita do
usuário: unificar num só papel em vez de manter os dois ou redefini-los
separadamente. Efeito prático:
- `permittedRoles` em `auth.controller.js` (`registerUser`) não oferece mais
  `SECRETARY` pra cadastro de usuário novo.
- Toda rota que antes listava `SECRETARY` nos papéis permitidos agora lista
  `STAFF` no lugar (Professores, Disciplinas, Frequência, Notas, Propinas,
  Resultado, Política Acadêmica, Escola).
- `SECRETARY` continua no ENUM de `User.role` só como legado, pra não quebrar
  linha antiga que já tenha esse valor — não é mais um caminho válido de
  cadastro. Script `backend/scripts/migrate-secretary-to-staff.js` converte
  qualquer usuário `SECRETARY` existente pra `STAFF` (rodar manualmente uma
  vez, não faz parte do boot/sync normal do servidor).
- `USER` continua um valor default genérico do enum, sem uso funcional claro —
  candidato a remover numa limpeza futura do enum (baixa prioridade, não é o
  mesmo tipo de problema que SECRETARY/STAFF).

**Bug corrigido nesta rodada:** o ENUM real de `User.role` no banco não tinha
`"STAFF"` — só `SUPER_ADMIN, ADMIN, TEACHER, DIRECTOR, SECRETARY, STUDENT, USER`
— apesar de `auth.controller.js` e todas as rotas já tratarem STAFF como papel
válido há várias rodadas. Qualquer `User.create({ role: "STAFF" })` teria
falhado na validação do Sequelize antes de chegar no banco. Corrigido em
`backend/models/user.js` ao formalizar essa lista.

**Papéis considerados e adiados de propósito (não especulativos, decisão
explícita do usuário — ver seção 7):** `COORDINATOR` (coordenador de curso,
só faria sentido pra `HIGHER_ED`) e `GUARDIAN`/encarregado de educação
(portal pros pais, nos moldes do Portal do Aluno). Nenhum dos dois tem pedido
concreto ainda; adicionar agora seria especulativo.

Regra geral: toda ação de um usuário não-SUPER_ADMIN é implicitamente restrita ao
próprio `schoolId`.

## 5. Isolamento multi-tenant

**Status: implementado em todos os módulos ativos, inclusive os profundos de
matrícula/notas (Student, Teacher, Staff, Course, Classroom, Subject,
CourseOffering, CourseOfferingSubject, Enrollment, Schedule, Assessment,
StudentAssessment, Grade, Attendance, Fee, AcademicPolicy).**

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
5. **Portais por papel (Professor, Aluno, Staff) — em andamento, Portal do Aluno e Portal do Staff feitos, landing pública + troca de senha feitas.**

   O que existia até aqui (Professores, Disciplinas, Cursos, Ofertas,
   Matrículas, Frequência, Notas — seção 6, item 3) eram todas **telas
   administrativas**: ADMIN/DIRECTOR/SECRETARY/STAFF/TEACHER operando o dado
   de terceiros. Não existia a visão "eu, logado como STUDENT, vejo só o que
   é meu" — é um tipo de tela diferente, não só mais um módulo CRUD.

   **Portal do Aluno — feito:**
   - `utils/selfScope.js` (novo) — `resolveOwnStudentId(req)`/
     `resolveOwnTeacherId(req)` resolvem o `Student`/`Teacher` do usuário
     logado a partir do `userId` do token. É o jeito padrão de qualquer
     controller responder "isso é meu?" sem depender do `:id` da URL (que o
     próprio usuário controla e poderia trocar pra ver dado de outro).
   - `GET /api/students/me` (novo, só STUDENT) — o próprio registro
     (`studentCode`, `grade`, etc.), mostrado direto no `DashboardHome`.
   - `getAllGrades`, `getAllAttendance` e `getEnrollments` agora ignoram
     `studentId` da querystring quando quem chama é STUDENT e forçam o
     próprio id — um aluno não consegue mais ver nota/frequência/matrícula de
     outro trocando o parâmetro. `getEnrollmentById` ganhou a mesma trava (a
     rota já deixava STUDENT entrar, mas sem checar dono).
   - Rotas `GET /grades`, `GET /attendance` e `GET /enrollments` (list)
     ganharam STUDENT nos papéis permitidos — só a listagem, não
     criar/editar/excluir nem os `GET /:id` de grade/attendance (que não têm
     esse auto-escopo implementado, de propósito, pra não abrir uma rota sem
     a trava correspondente).
   - Frontend: `GradesListPage`/`AttendanceListPage` escondem "Lançar
     nota"/"Registrar frequência" e as colunas de ação pro papel STUDENT
     (`EnrollmentsListPage` já escondia, reaproveitado sem mudança). Título
     vira "Minhas notas"/"Minha frequência"/"Minhas matrículas". Menu lateral
     e rotas liberados pro STUDENT nos três.

   **Portal do Professor — ainda bloqueado.** A ideia (turmas/disciplinas que
   o professor leciona via `CourseOfferingSubject.teacherId`, lançar
   nota/frequência só dos seus alunos) esbarra em duas coisas: (1) não existe
   nenhuma tela administrativa de `CourseOfferingSubject` ainda — sem alguém
   atribuir professor↔disciplina↔oferta pela UI, "minhas disciplinas" ficaria
   sempre vazio; (2) pra escola `SECONDARY`, não existe *nenhuma* relação
   professor↔turma↔disciplina no modelo de dado — `Teacher.subject` é só um
   texto livre, não uma associação real. Fazer o portal de verdade pro
   professor pede resolver isso primeiro, não só copiar o padrão do aluno.
   `Grade.teacherId` já existe e dava pra usar pra um filtro "só as notas que
   eu lancei" nas telas administrativas atuais — não implementado ainda,
   fica de fácil acréscimo quando isso for prioridade.

   **Portal do Staff — construído.** Decisão explícita: "o staff pode ser o
   pessoal da secretaria responsável por também lançar as notas, tratar das
   inscrições, tratar das propinas etc". Ou seja, STAFF é secretaria — não
   precisa de portal "só leitura" tipo o do aluno, ele já opera as telas
   administrativas normais (ganhou acesso a Notas e Propinas nesta rodada,
   junto com Turmas/Cursos/Ofertas/Matrículas que já tinha). Numa rodada
   posterior, STAFF também herdou tudo que SECRETARY tinha (Professores,
   Disciplinas, Frequência, Resultado, Política Acadêmica) quando os dois
   papéis foram unificados — ver seção 4 e 7.

   **Landing pública + login único + troca de senha — construído.** Primeira
   versão desta rodada tentou um login separado por portal (Aluno/Professor/
   Secretaria/Administração, cada um com sua URL e restrição de papel) — o
   usuário testou a ideia via pergunta e **mudou de decisão antes de
   implementar de vez**: "vai ter [uma landing com] conteúdo que eu ainda
   não sei, mas que terá um botão de login que dependendo das credenciais,
   leva para o perfil certo". Ou seja, login continua único; quem decide o
   que a pessoa vê depois é o papel da conta, não a URL usada pra entrar —
   como já era antes, só que agora com uma porta de entrada pública na raiz
   do site em vez de cair direto num formulário. Estado final:
   - `/` (novo `pages/auth/LandingPage.jsx`) é público — hero simples
     ("Sistema de Gestão Escolar" + botões Entrar/Cadastrar escola).
     Conteúdo de marketing de verdade ainda não definido, propositalmente
     mínimo por enquanto. Se a pessoa já está autenticada, `/` redireciona
     sozinho pra `/painel` (não faz sentido mostrar a landing de novo pra
     quem já tem sessão).
   - `/login` voltou a ser um formulário único (email + senha), sem escolha
     de portal — é o antigo `LoginPage.jsx`, recriado (tinha sido apagado
     na tentativa anterior).
   - **A home autenticada mudou de rota: `/` → `/painel`.** Precisou mudar
     porque `/` agora é a landing pública — não dá pra ter duas telas
     diferentes registradas no mesmo path. Atualizado em todo lugar que
     apontava pra `/`: `NavDrawer` ("Início"), redirect pós-login
     (`LoginPage`), redirect pós-cadastro de escola (`RegisterSchoolPage`),
     os dois fallbacks de acesso negado em `RequireAuth.jsx` (antes
     mandavam pra `/`, que agora rebateria de novo pra `/painel` via
     `LandingPage` — ficou redirecionando direto).
   - `api/client.js` (interceptor de 401) e o "voltar pro início" da
     `NotFoundPage` continuam apontando pra `/login`/`/` sem mudança — já
     estavam corretos nesse desenho.
   - **Troca de senha, self-service (fechado nesta rodada também):** o
     formulário de criar aluno já prometia "pode trocar depois do primeiro
     acesso" mas isso nunca tinha sido construído. Agora existe
     `PATCH /api/auth/change-password` (autenticado, exige senha atual +
     nova, mínimo 6 caracteres) e um `ChangePasswordDialog` acessível pelo
     menu do usuário (`DashboardLayout`), pra qualquer papel logado.
     Diferente de esqueci-senha (que seria pra quem perdeu acesso) — aqui a
     pessoa já está logada, só confirma a senha atual.

   **Propinas/mensalidades — implementado como ledger manual (v1).** Não é o
   mesmo billing do item 4 (que é o SaaS cobrando a *escola*) — isso aqui é a
   escola cobrando o *aluno*. Escopo decidido com o usuário antes de
   modelar (ver decisão registrada na seção 7):
   - Model novo `Fee` (`backend/models/fee.js`): `studentId`, `description`,
     `amount` (DECIMAL), `currency`, `dueDate`, `status`
     (`PENDING`/`PAID`), `paidAt`, `notes`. Sem `schoolId` próprio — isolado
     por escola via join obrigatório no `Student` dono do registro, mesmo
     padrão de `Grade`/`Attendance` (ver seção 5).
   - **Sem status `OVERDUE` guardado.** "Atrasado" é derivado em tela
     (`status === PENDING && dueDate < hoje`), não persistido — evita dado
     parado mentir depois que o relógio passa do vencimento. Ver
     `isOverdue()` em `frontend/src/pages/fees/FeesListPage.jsx`.
   - `School.currency` (default `"AOA"`, editável por ADMIN/SUPER_ADMIN em
     `SchoolFormDialog`) — cada `Fee` copia esse valor no momento da
     criação (não é FK vivo); trocar a moeda da escola depois não altera
     lançamentos antigos.
   - Vínculo em `Student` (não `Enrollment`) de propósito — `Enrollment` só
     existe pra `HIGHER_ED`; `Student` cobre os dois `academicModel`.
   - Sem gateway de pagamento — pagamento acontece fora do sistema, STAFF só
     registra o status via `PATCH /api/fees/:id/status`.
   - Rotas: `POST/GET/PATCH/DELETE /api/fees`, `PATCH /api/fees/:id/status`.
     `MANAGE_ROLES = SUPER_ADMIN, ADMIN, DIRECTOR, STAFF`; exclusão restrita a
     `SUPER_ADMIN, ADMIN, DIRECTOR`. `STUDENT` entra só na listagem,
     auto-escopado (portal do aluno, mesmo padrão de
     Notas/Frequência/Matrículas).
   - Frontend: `/propinas` — `FeesListPage`/`FeeFormDialog`, com toggle
     pago/pendente inline; título e colunas mudam pra "Minhas propinas"
     somente-leitura quando `STUDENT`.

## 7. Decisões em aberto

- ~~Se cada escola poderá alternar entre "modo escola" e "modo faculdade", ou se
  isso é fixo no cadastro.~~ **Decidido:** fixo no cadastro (`School.academicModel`,
  imutável). Ver seção 2 e 5.
- ~~Se o enum `role` deve ganhar papel específico para faculdade (ex: `COORDINATOR`) ou
  os papéis atuais bastam.~~ **Decidido:** lista final fechada em
  `SUPER_ADMIN, ADMIN, DIRECTOR, TEACHER, STAFF, STUDENT` (SECRETARY unificado em
  STAFF — ver seção 4). `COORDINATOR` (coordenador de curso, só faria sentido pra
  `HIGHER_ED`) e `GUARDIAN`/encarregado de educação (portal pros pais) foram
  considerados e adiados de propósito — nenhum pedido concreto ainda,
  adicionar agora seria especulativo. Reabrir quando/se um cliente pedir.
- Estratégia de billing (gateway, moeda, país) — fica para quando chegarmos no item 4.
- Como o nº de alunos influencia o plano/preço (teto por plano vs. preço escalonado vs.
  ambos) — decidir antes de implementar o item 4 do roadmap (billing).
- ~~Se plano/preço deveria variar por tipo de instituição.~~ **Decidido:** sim, mas sem
  mudar schema — mesmos 3 planos (`FREE/BASIC/PREMIUM`), preço de fato varia por
  `academicModel` numa tabela de referência manual pro SUPER_ADMIN (ver seção 3).
  Os valores concretos da tabela continuam TBD — falta decidir junto com o item
  acima (nº de alunos) antes de fechar o item 4 do roadmap.
- ~~O que um STAFF genérico deveria ver/fazer.~~ **Decidido:** é secretaria —
  lança nota, trata inscrição, trata propina. Ver seção 4.
- ~~Escopo de propinas/mensalidades.~~ **Decidido e implementado (v1):** ledger
  manual (sem cálculo automático de multa), pendurado em `Student` (não
  `Enrollment`, pra cobrir `SECONDARY` também), sem gateway de pagamento
  (controle interno, pagamento acontece fora do sistema), moeda configurável
  por escola (`School.currency`). Ver seção 6, item 5. Fica em aberto pra
  quando/se fizer sentido evoluir: cobrança automática com vencimento/multa,
  integração com gateway (Multicaixa/M-Pesa/cartão dependendo do país),
  periodicidade recorrente automática em vez de lançamento manual por
  período.
- **Tela de criar STAFF — ainda não existe.** `staff.routes.js` só tem
  GET/PATCH/DELETE, nenhum POST ligado a frontend (diferente de Teacher e
  Student, que têm `TeacherFormDialog`/`StudentFormDialog` criando via
  `/auth/register-user`). Hoje a única forma de criar uma conta STAFF é
  chamar a API direto. Adiado de propósito nesta rodada (decisão explícita:
  "fica pra depois") — próxima rodada de portal/acesso deve incluir isso.
- **Auto-cadastro (self-service) — nenhum papel operacional se cadastra
  sozinho hoje**, só a escola em si (`/registrar-escola`, que cria a escola
  + o primeiro ADMIN). Levantado ao decidir a landing page:
  - `POST /api/auth/register-student` já existe e é público, mas está
    incompleto (exige `schoolId` explícito no body — sem resolução por
    slug/subdomínio da escola) e **não tem nenhuma tela no frontend**
    consumindo. Aluno hoje é sempre cadastrado por um ADMIN/DIRECTOR.
  - Professor e Staff não têm nenhum caminho de self-registro, nem
    incompleto — sempre criados por quem já tem acesso administrativo.
  - Não decidido ainda se vale a pena terminar o auto-cadastro de aluno
    (métrica de esforço: resolver escola por slug + tela pública) ou se o
    fluxo "admin cadastra todo mundo" é suficiente pro produto.
- **Esqueci minha senha — só existe o esqueleto no backend.**
  `forgotPassword`/`resetPassword` geram e validam token real (expira em 15
  min), mas a entrega do link de reset é só um `console.log` no servidor —
  não tem envio de email de verdade (`email.routes.js` nunca foi terminado,
  ver seção 5) — e não existe nenhuma tela no frontend pra iniciar o pedido
  nem pra colar o token. "Trocar minha senha" (logado, com a senha atual)
  foi implementado nesta rodada e resolve o caso "lembro a senha atual, só
  quero trocar" — mas "esqueci de verdade" continua sem solução até ter um
  serviço de email real por trás.
