# Regras do jogo — School/Faculty Management SaaS

> Documento vivo. Atualizar sempre que uma decisão de produto ou arquitetura mudar.

## 0. Padrão de código

- **ACID não é opcional.** Toda escrita que precisa ser única (email, código gerado,
  nome dentro da escola) tem que ter uma `UNIQUE constraint` de verdade no PostgreSQL por
  trás — checagem "já existe?" em JS antes do `create()` é só UX (evita um round-trip
  desnecessário), nunca a garantia real, porque duas requisições concorrentes podem
  passar pela checagem ao mesmo tempo. A constraint é quem garante isolamento; o
  catch de `SequelizeUniqueConstraintError` (`utils/dbErrors.js`) é quem transforma
  isso numa resposta 409 decente em vez de um 500 cru. Escritas multi-tabela usam
  `sequelize.transaction()` (managed transaction, como já era feito em
  `auth.controller.js`) para atomicidade.
  Docs: [Sequelize Transactions](https://sequelize.org/docs/v6/other-topics/transactions/),
  [UniqueConstraintError](https://sequelize.org/api/v6/class/src/errors/validation/unique-constraint-error.ts~uniqueconstrainterror),
  [PostgreSQL transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html).
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
- `classroom.code`/`classroom.name` e `subject.code`/`subject.name` são únicos
  **por escola** (`school_id + code`, `school_id + name`), declarados em
  `indexes` no nível do modelo. Esta linha afirmou durante muito tempo que
  assim era sem que fosse verdade — ver o bug abaixo.
- `School` ganhou CRUD mínimo (`controllers/school.controller.js`,
  `routes/schools.routes.js`) — só `SUPER_ADMIN` cria/lista escolas.
- `POST /api/auth/bootstrap-admin` agora cria o `SUPER_ADMIN` (dono da plataforma, sem
  escola) em vez de um `ADMIN`. `POST /api/auth/register-user` aceita `SUPER_ADMIN`
  (que deve informar `schoolId` no body) ou `ADMIN` (herda a própria escola). `POST
  /api/auth/register-student` (rota pública) agora exige `schoolId` no body.

**Bug de segurança real encontrado e corrigido numa auditoria do fluxo de
autenticação (`auth.controller.js login()`):** os checks de `user.active` e
`school.status !== "ACTIVE"` rodavam **antes** da validação da senha
(`bcrypt.compare`). Na prática, isso significava que qualquer pessoa — sem
saber a senha, só o email — conseguia descobrir via `POST /auth/login` se
aquele email pertence a uma conta desativada (403 "User is inactive") ou a
uma escola suspensa (403 "school not active"), porque esses 403 chegavam
antes de qualquer validação de credencial. Um oracle de enumeração de
contas clássico. Corrigido invertendo a ordem: senha primeiro (401
genérico se errada), status da conta/escola só depois de confirmar que a
senha está certa. O 404 "User not found" pra email inexistente continua
antes da senha (inevitável — sem usuário não tem hash pra comparar), mas
esse é um padrão bem mais comum/aceito do que revelar o status interno de
uma conta que existe.

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

**Bug real encontrado ao criar a segunda disciplina de uma escola, já contra
PostgreSQL (`models/subject.js`, `models/classroom.js`):** a criação falhava
com 409 `A record with this school_id already exists.` A causa era a
declaração de unicidade na coluna `schoolId`:

```js
schoolId: { ..., unique: ["subject_school_code", "subject_school_name"] }
```

A forma em array **não existe** na API do Sequelize v6. A opção `unique` de um
atributo aceita booleano, string (nome da constraint) ou objeto com `name`.
Perante um array, o Sequelize testa `typeof === "string"` (falha), depois
`typeof === "object" && tem .name` (um array também falha, `.name` é de
funções, não de arrays) e cai no nome por omissão
`${tableName}_${key}_unique`. Resultado: em vez das duas constraints compostas
pretendidas, gerava **três constraints de coluna única**:

| Gerado | Pretendido |
| --- | --- |
| `UNIQUE(school_id)` | `UNIQUE(school_id, name)` |
| `UNIQUE(name)` — global | `UNIQUE(school_id, code)` |
| `UNIQUE(code)` — global | |

São dois bugs, não um. O `UNIQUE(school_id)` limitava cada escola a **uma
única** disciplina (e uma única sala). E o `UNIQUE(name)`/`UNIQUE(code)` global
é furo de isolamento entre inquilinos: a escola B não conseguiria criar uma
"Matemática" porque a escola A já tinha uma.

Corrigido movendo as constraints para `indexes` no nível do modelo, a única
forma de exprimir uma coluna que participa em duas constraints compostas
diferentes. `models/turma.js` e `models/course.js` já usavam o padrão certo (a
mesma string em todas as colunas do grupo) e nunca estiveram afetados.

**Por que só apareceu agora:** no MySQL a tabela `subjects` vinha de antes
destas declarações existirem e o `alter` nunca reconciliou as constraints. O
PostgreSQL criou a tabela do zero a partir da definição atual e materializou
fielmente o que o modelo pedia. A migração não causou o bug — revelou-o. Vale
como aviso geral: qualquer outra divergência entre o modelo e o schema legado
do MySQL vai aparecer da mesma maneira, na primeira vez que a tabela nascer
limpa.

**Fica em aberto, decisão de negócio, não mexido:** `Course.code` e
`CourseOffering.code` têm `unique: true`, ou seja, são únicos globalmente — se a
escola A usar `ENG101`, a escola B não o pode usar. Pode ser intencional ou ser
o mesmo descuido. `Fee.reference` também é global e esse parece correto: uma
referência de pagamento não deve colidir entre escolas.

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

   **"Meu horário" — feito (Fase 9a do roadmap de execução).** O aluno
   apontou (com razão) que faltava ver horário, além de faltas/notas já
   existirem. Duas partes bem diferentes de tamanho:
   - **HIGHER_ED — bug de isolamento corrigido.** `Schedule` já existia
     (Fase 5) e `GET /schedules` já listava STUDENT nos papéis permitidos,
     mas **sem nenhum auto-escopo** — um aluno conseguia ver o horário de
     disciplinas de ofertas em que nem estava matriculado, bastava a rota
     estar liberada pro papel (mesma classe de bug já corrigida antes em
     `getAllGrades`/`getAllAttendance`, mas que passou batido aqui porque
     `Schedule` nunca tinha sido exposto de fato pro aluno). Corrigido:
     `getAllSchedules`/`getScheduleById` agora filtram pelas
     `courseOfferingId` das matrículas com `status: "APPROVED"` do próprio
     aluno (via `Enrollment`) — mesmo aluno sem matrícula aprovada nenhuma
     recebe `[]`/404 em vez do horário da escola inteira. De quebra, o
     include ganhou o professor (`Teacher`) — antes só trazia a disciplina,
     sem dizer quem leciona.
   - **SECONDARY — conceito novo do zero.** `Turma`/`TurmaSubject` (Fase 6)
     não tinham nenhuma noção de dia/hora. Novo model `TurmaSchedule`
     (`backend/models/turmaSchedule.js`) espelhando `Schedule`, criado como
     entidade paralela em vez de reaproveitar `Schedule` com um segundo FK
     opcional — mesmo padrão já usado em Turma/TurmaSubject vs.
     Classroom/CourseOfferingSubject na Fase 6, evita FK mutuamente
     exclusivo e não arrisca a lógica de conflito de sala do HIGHER_ED já
     em produção. Rotas `/api/turma-schedules`, gated
     `requireAcademicModel("SECONDARY")`, com o mesmo auto-escopo por
     matrícula (aqui, pela `Turma` do aluno via `Student.turmaId`) desde o
     início — não precisou de um fix separado depois. Conflito de sala
     checado só dentro de `TurmaSchedule` (uma escola opera num único
     `academicModel`, então as salas dela nunca são usadas por `Schedule` e
     `TurmaSchedule` ao mesmo tempo).
   - **Frontend:** `/meu-horario` (`MySchedulePage`, só STUDENT) — mesma
     tela pros dois modelos, troca só a API de origem conforme
     `school.academicModel`, normaliza os dois formatos de resposta pra um
     shape só, agrupado por dia da semana. Gestão de horário pro lado
     SECONDARY ganhou `TurmaScheduleManagerDialog` (espelha
     `ScheduleManagerDialog` do HIGHER_ED), acessível a partir de
     `TurmaSubjectsPage` (ícone "Horário" por disciplina da turma).
   - **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build` — 1099 módulos) — sem MySQL/Docker disponível
     neste ambiente, o auto-escopo por matrícula/turma e a checagem de
     conflito de sala não foram testados contra dado real.

   **Faltas com resumo — feito (Fase 9b do roadmap de execução).**
   `AttendanceListPage` (`readOnly`/STUDENT) ganhou um card de resumo acima
   da lista crua que já existia: contagem por status (Presente/Ausente/
   Atrasado/Falta justificada) e uma taxa de presença (`Presente + Atrasado`
   sobre o total de registros — falta justificada conta como ausência pra
   esse cálculo, é uma ausência com motivo aceito, não presença de fato).
   **Sem endpoint novo no backend** — o dado já vinha completo e
   auto-escopado do `GET /attendance` existente (Portal do Aluno, seção 6
   item 5); o resumo é só `useMemo` em cima do que já chegava. Só aparece
   pro papel STUDENT: pra staff a tabela mistura vários alunos, um % só
   faria sentido filtrado por aluno, o que a tela atual não faz. Validado
   via `vite build` (1099 módulos).

   **Meu plano de estudos — feito (Fase 9c do roadmap de execução).** Novo
   `GET /api/students/me/study-plan` (`student.controller.js
   getMyStudyPlan`, só STUDENT). O dado já existia, só não estava exposto:
   - **HIGHER_ED:** achado interessante ao construir isso — existe uma
     associação `Student.belongsTo(Course, { foreignKey: "courseId" })` no
     `models/index.js`, mas **nenhum controller do sistema jamais escreve
     nesse campo** (busquei "courseId" em todos os controllers — só aparece
     em `courseOffering.controller.js`, que é um campo diferente, da
     `CourseOffering`). Ou seja, essa associação é morta na prática. A
     fonte real de "quais disciplinas são minhas" é `Enrollment` (só
     `status: "APPROVED"`) → `CourseOffering` → `CourseOfferingSubject` →
     `Subject`/`Teacher` — o mesmo caminho que `EnrollmentsListPage` já
     usava, só que agora também trazendo as disciplinas de cada oferta.
   - **SECONDARY:** `Student.turmaId` → `TurmaSubject` → `Subject`/
     `Teacher`, já existente desde a Fase 6.
   - Resposta normalizada num shape só (`subjectName`/`teacherName`/
     `weeklyHours`/`context`) pro frontend não precisar dos dois formatos.
     Frontend: `/meu-plano-de-estudos` (`StudyPlanPage`, só STUDENT) — uma
     tabela simples, sem agrupamento por período/oferta (não pedido).
   - **Deliberadamente não é um "plano" no sentido de currículo formal**
     (quais disciplinas o aluno *deveria* cursar pra se formar, quantas já
     completou, o que falta) — é só "quais disciplinas fazem parte da
     minha matrícula/turma hoje". Um currículo formal exigiria um novo
     conceito (`Curriculum`/requisitos por curso ou série) que não existe
     em nenhum lugar do sistema — não pedido nesta fase.
   - **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build` — 1102 módulos) — sem MySQL/Docker
     disponível neste ambiente.

   **Minha situação curricular — feito (Fase 9d do roadmap de execução),
   escopo reduzido a pedido do usuário: aprovado/reprovado formal só pro
   HIGHER_ED.**
   - **Bug de isolamento real corrigido de quebra, achado ao construir
     isso:** `GET /results/:enrollmentId/:courseOfferingSubjectId`
     (`gradeCalculation.service.js calculateStudentResult`) já liberava
     STUDENT em `authorizeRoles` desde a Fase 5, mas **nada verificava se a
     matrícula (`enrollmentId`) era do próprio aluno** — bastava trocar o
     número na URL pra ver a nota/resultado de qualquer colega da mesma
     escola. Mesma classe de bug já corrigida em `Schedule` na Fase 9a,
     mas essa aqui tinha passado despercebida porque a rota nunca tinha
     sido de fato exposta pro aluno antes (só usada pelo staff via
     `ResultadoFinalPanel`). Corrigido: quando quem chama é STUDENT, checa
     `enrollment.studentId` contra o próprio id (via `resolveOwnStudentId`)
     antes de calcular qualquer coisa — 404 genérico se não bater, pra não
     confirmar que a matrícula de outro aluno existe.
   - Novo `GET /api/students/me/academic-status`
     (`student.controller.js getMyAcademicStatus`, só STUDENT):
     - **HIGHER_ED:** reaproveita `calculateStudentResult` (o mesmo cálculo
       de aprovado/reprovado via `AcademicPolicy` que o staff já usava) pra
       cada disciplina de cada oferta com matrícula `APPROVED`. Se a escola
       não tiver uma `AcademicPolicy` ativa (o cálculo lança 404 nesse
       caso), o item entra marcado `unavailable: true` em vez de derrubar a
       lista inteira.
     - **SECONDARY:** sem critério de aprovação modelado (decisão do
       usuário: fora de escopo desta fase) — calcula só a média simples
       por disciplina a partir de `Grade`, sem aprovado/reprovado.
   - Frontend: `/minha-situacao-curricular` (`AcademicStatusPage`, só
     STUDENT) — tabela com nota contínua/exame/final/situação pro
     HIGHER_ED, tabela mais simples com média/quantidade de notas pro
     SECONDARY (com aviso explícito de que não há aprovado/reprovado
     formal ainda).
   - **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build` — 1103 módulos) — sem MySQL/Docker
     disponível neste ambiente.

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
   - `School.currency` (default `"MZN"` — Metical, mercado principal do
     sistema é Moçambique; corrigido de `"AOA"`, que era o default errado
     antes — ver seção 6, fase 8; editável por ADMIN/SUPER_ADMIN em
     `SchoolFormDialog`/`SchoolSettingsPage`) — cada `Fee` copia esse valor
     no momento da criação (não é FK vivo); trocar a moeda da escola depois
     não altera lançamentos antigos. Campo é texto livre (até 3 letras),
     não uma lista fixa — aceita qualquer moeda, `MZN` é só o default.
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

6. **Portais/telas que faltam terminar (backend pronto, frontend não) — sem ordem
   de prioridade definida ainda:**
   - ~~**Tela de criar Staff.**~~ **Feito (Fase 1 do roadmap de execução).**
     `StaffListPage`/`StaffFormDialog` (`/staff`), criação via
     `POST /auth/register-user` (role `STAFF`), mesmo padrão de
     Teacher/Student. Visível no menu pra `SUPER_ADMIN/ADMIN/DIRECTOR/STAFF`
     (espelha `staff.routes.js`); criar de fato continua restrito a
     `ADMIN/SUPER_ADMIN` no backend, mesma limitação de frontend que já
     existia em Professores (botão aparece, backend rejeita com 403 se o
     papel não puder).
   - ~~**Log de auditoria — tela de consulta.**~~ **Feito (Fase 1).**
     `AuditLogListPage` (`/auditoria`), visível pra qualquer papel logado:
     `ADMIN/SUPER_ADMIN` veem `GET /logs-audit` (log completo, agora
     corretamente restrito à própria escola — ver bug abaixo), os demais
     papéis veem só `GET /logs-audit/meus` (as próprias ações).
     **Dois bugs reais pegos ao construir esta tela, corrigidos:**
     1. `logAudit.controller.js` incluía `User` com `attributes: ["nome",
        "ativo", ...]` — esses campos não existem no model (`name`/`active`
        em inglês, não em português); qualquer chamada a `GET /logs-audit`
        ou `/logs-audit/:id` quebrava com `SequelizeDatabaseError`.
        Endpoint nunca tinha sido consumido por nenhum frontend antes, por
        isso passou despercebido.
     2. **Isolamento multi-tenant quebrado:** `GET /logs-audit` não tinha
        `requireSchool` nem nenhum filtro por escola — um `ADMIN` de
        qualquer escola conseguia ver logs de auditoria de **todas** as
        escolas do sistema (o model `LogAudit` não tem `schoolId` próprio,
        só chega lá via `User.schoolId`). Corrigido: rotas `GET /` e
        `GET /:id` ganharam `requireSchool`, e o controller agora filtra via
        inner join no `User` (`where: { schoolId: req.schoolId }`) quando
        quem pede não é `SUPER_ADMIN` sem filtro.
   - **Portal do Professor.** Bloqueado até existir (a) uma tela administrativa
     de `CourseOfferingSubject` (atribuir professor↔disciplina↔oferta) e (b),
     pra `SECONDARY`, uma relação real professor↔turma↔disciplina no modelo de
     dado — hoje `Teacher.subject` é só texto livre. Ver seção 6, item 5.
   - ~~**Ofertas→Disciplinas (`CourseOfferingSubject`), Horário (`Schedule`),
     Avaliações (`Assessment`/`StudentAssessment`) e Resultado final.**~~
     **Feito (Fase 5 do roadmap de execução).** Fluxo: `/ofertas` → botão
     "Disciplinas" → `/ofertas/:offeringId/disciplinas`
     (`CourseOfferingSubjectsPage`, atribui disciplina+professor+carga
     horária à oferta) → por disciplina, ícone "Horário" abre
     `ScheduleManagerDialog` (dia/hora/sala, com checagem de conflito de
     sala já existente no backend) e ícone "Avaliações" leva a
     `/ofertas/:offeringId/disciplinas/:cosId/avaliacoes`
     (`AssessmentsPage`: cria avaliações com categoria CONTINUOUS/EXAM,
     `ScoresDialog` lança/lista notas por avaliação, `ResultadoFinalPanel`
     calcula o resultado agregado via `GET /results/:enrollmentId/:cosId`).
     Restrito a `SUPER_ADMIN/ADMIN/STAFF/DIRECTOR/TEACHER` (mesmos papéis de
     `/ofertas`) — `STUDENT` não ganhou acesso a essas telas nesta rodada
     (não pedido, e a UI é toda de gestão/lançamento, não de consulta).
     **Antes de construir as telas, o backend tinha 3 lacunas reais que
     precisaram ser fechadas primeiro** (decisão explícita do usuário:
     "completar o backend primeiro"):
     1. `POST /assessments` não aceitava `category` no body — toda
        avaliação criada caía no default `CONTINUOUS`, o que tornava
        impossível registrar uma avaliação de `EXAM` e, por consequência,
        o cálculo de resultado final nunca encontrava `examScore`.
     2. `Assessment` não tinha `GET /:id`, `PUT /:id` nem `DELETE /:id` —
        só criar e listar. Adicionados os três (`DELETE` bloqueia com 409
        se a avaliação já tiver notas lançadas, evitando um
        `SequelizeForeignKeyConstraintError` cru).
     3. `StudentAssessment` não tinha **nenhum** `GET` — impossível saber
        quem já tinha nota lançada numa avaliação sem consultar o banco
        direto. Adicionado `GET /student-assessments?assessmentId=` (ou
        `?enrollmentId=`), com o mesmo auto-escopo de portal do aluno que
        `Grades`/`Attendance`/`Fees` já tinham (`STUDENT` só vê as
        próprias notas, mesmo se tentar passar outro `enrollmentId`).
     **Dois bugs pequenos corrigidos de quebra** enquanto completava esse
     backend: `recordScore` validava só o teto da nota (`score >
     maxScore`), nada impedia `score` negativo; e `Assessment.sum("weight")`
     no `updateAssessment` agora exclui a própria avaliação da soma (senão
     editar o peso de uma avaliação existente contaria o peso antigo e o
     novo ao mesmo tempo).
     **Simplificação deliberada:** `GET /course-offering-subjects` e
     `GET /schedules` não filtram por oferta/disciplina no backend
     (devolvem tudo da escola) — o frontend filtra no cliente. Ok pro
     volume de dados esperado por escola; se isso crescer muito, vale
     mover o filtro pro backend.
     **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build`) — os fluxos de criar avaliação EXAM,
     lançar nota e calcular resultado final (que depende de uma
     `AcademicPolicy` ativa já existir na escola) não foram testados
     contra dado real neste ambiente.
     **Code review feito nesta rodada (`code-review-and-quality`) encontrou
     3 problemas Required, todos corrigidos:**
     1. `courseOfferingSubject.controller.js`, `updateCourseOfferingSubject`
        (código pré-existente de rodada anterior) usava `campo ?? item.campo`
        pra `teacherId`/`startDate`/`endDate` — como `null ?? x` retorna `x`
        (não `null`), limpar o professor ou uma data no
        `CourseOfferingSubjectFormDialog` novo desta rodada dava 200 de
        sucesso mas não salvava a mudança. Corrigido checando presença da
        chave no `req.body` em vez de `??`.
     2. `assessment.controller.js` validava `weight`/`maxScore` com
        `Number(x)` cru — um valor não-numérico virava `NaN`, e
        `NaN > 100` é sempre `false`, furando o guard de "peso não pode
        passar de 100%" e só quebrando depois com erro de banco cru.
        Corrigido com `validatePositiveNumber()`, extraído de
        `validateAmount()` em `utils/validators.js` (reuso do helper
        canônico em vez de duplicar a checagem).
     3. `ScheduleManagerDialog` e `ScoresDialog` não escondiam o
        formulário de criar/editar conforme o papel — `DIRECTOR`/`TEACHER`
        (que têm acesso de leitura a essas telas) viam o formulário sempre
        ativo e só descobriam que não podiam salvar via 403. Corrigido
        espelhando os `authorizeRoles` de cada rota (mesmo padrão já usado
        em `StaffListPage`/`TeachersListPage`).
   - ~~**Esqueci minha senha — falta só ligar o fio.**~~ **Feito (Fase 3 do
     roadmap de execução).** `forgotPassword` agora chama `sendEmail()`
     (`utils/email.js`, nodemailer/Gmail) de verdade, com o link de reset
     (`FRONTEND_URL` + `/redefinir-senha?token=...`, `FRONTEND_URL` novo em
     `backend/.env`, default `http://localhost:5173` se não setado). Se o
     envio falhar (ex: `EMAIL_USER`/`EMAIL_PASS` vazios — placeholders
     adicionados no `.env`, sem valor real ainda), cai pro `console.log` de
     dev que já existia, sem quebrar o pedido — resposta pro cliente
     continua sempre a mesma genérica, exista o email ou não. Frontend:
     `ForgotPasswordPage` (`/esqueci-senha`, pede o email) e
     `ResetPasswordPage` (`/redefinir-senha`, cola token + nova senha, lê o
     token da URL se vier no link do email), link "Esqueci minha senha" na
     `LoginPage`. `resetPassword` ganhou log de auditoria (`UPDATE User`),
     mesmo padrão do `changePassword` self-service.
     **Bug pego de quebra:** `registerLogAudit()` aceitava um segundo
     argumento `{ transaction }` em três call sites (`registerUser`,
     `registerStudent`, e agora `resetPassword`) mas nunca usava — o
     `LogAudit.create()` sempre rodava fora da transaction do caller,
     mesmo passando a intenção explícita. Corrigido em `utils/logAudit.js`
     pra de fato repassar a `transaction` quando informada. `email.routes.js`
     continua arquivo morto (só imports, sem `module.exports`, nem montado
     em `server.js`) — não usar, é lixo do protótipo antigo.
     **Não testado com envio de email real** (sem `EMAIL_USER`/`EMAIL_PASS`
     configurados neste ambiente) — só validado estaticamente + o
     fallback de `console.log`. Preencher as credenciais Gmail reais em
     `backend/.env` e testar o envio de fato antes de confiar nisso em
     produção.

7. **Funcionalidades que ainda não existem de nenhuma forma (nem backend) —
   levantadas numa análise do sistema, sem pedido de cliente ainda:**
   - **Upload de arquivo.** `School.logo` existe no model e não tem endpoint de
     upload nem campo no formulário — só dá pra "trocar o logo" colando uma URL
     direto na API. Existe uma pasta `backend/upload/` vazia, provavelmente
     resquício do protótipo antigo, sem middleware (`multer` ou equivalente)
     configurado.
   - ~~**Painel com números (KPIs).**~~ **Feito (Fase 2 do roadmap de
     execução).** Novo endpoint `GET /api/dashboard/summary`
     (`backend/controllers/dashboard.controller.js`), restrito a
     `SUPER_ADMIN/ADMIN/DIRECTOR/STAFF` — TEACHER/STUDENT continuam sem KPIs
     agregados por enquanto (não há "meu resumo" óbvio pra eles ainda sem
     turma/disciplina modelada de verdade, ver item 7 abaixo). Dois modos:
     - **`SUPER_ADMIN` sem `?schoolId=`** (visão de plataforma): total de
       escolas, escolas ativas/inativas, alunos e professores somados de
       todas as escolas.
     - **Escola específica** (qualquer outro papel, ou `SUPER_ADMIN` com
       `?schoolId=`): total de alunos/professores/staff, propinas
       pendentes, propinas em atraso (`status=PENDING` e `dueDate` no
       passado, agrupado por moeda — uma escola pode ter lançamentos
       antigos em moeda diferente da atual, ver seção 6 item 5), e
       matrículas pendentes (só se `academicModel === "HIGHER_ED"`, senão
       `null`).
     Frontend: `DashboardHome` ganhou uma grade de cartões
     (`KpiCard`/`KpiGrid`) acima do cartão de perfil, visível só pros
     mesmos papéis que o backend autoriza.
     **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build`) — a query agregada de propinas em atraso
     (`GROUP BY currency` com `JOIN` em `Student`) foi sinalizada como a
     parte mais arriscada desta rodada por não ter sido testada contra dado
     real neste ambiente (sem MySQL/SQLite disponível).
     **Bug real confirmado contra MySQL de verdade (rodando em produção
     local via Docker) e corrigido:** `Fee.count(...)` funcionou, mas
     `Fee.findAll(...)` quebrava com `Unknown column 'fees.id' in 'field
     list'`. Causa: `col("fees.id")`/`col("fees.amount")` qualificavam a
     coluna com o **nome da tabela** (`fees`, minúsculo/plural), mas o
     Sequelize aliasa a tabela com o **nome do model** na query gerada
     (`FROM \`fees\` AS \`Fee\``) — então `fees.id` não batia com nenhum
     alias existente e o MySQL rejeitava. Corrigido pra `col("Fee.id")`/
     `col("Fee.amount")`, qualificando com o alias real (`Fee`, maiúsculo).
     Isso confirma a suspeita registrada aqui antes: essa era mesmo a parte
     mais arriscada do KPI, e só quebrou ao rodar contra MySQL real — os
     checks estáticos deste ambiente (sintaxe, boot do `server.js`) não
     executam a query, então não pegam esse tipo de erro.
   - **Exportação/impressão.** Sem boletim em PDF, sem recibo de propina, sem
     exportar lista de alunos/propinas pra Excel/CSV — nenhuma lib desse tipo
     está instalada em nenhum dos dois `package.json`.
   - ~~**Turma pedagógica de verdade pra `SECONDARY`.**~~ **Feito em parte
     (Fase 6 do roadmap de execução — escopo reduzido a pedido do usuário:
     "Só Turma pedagógica", sem Ano letivo/Período formal, ver item abaixo).**
     Novo model `Turma` (`backend/models/turma.js`): nome (único por escola),
     série, sala principal (`classroomId`, FK opcional pra `Classroom` — sala
     física, ver renomeação abaixo), ano letivo (**texto livre**, sem entidade
     formal), ativo/inativo. Novo model `TurmaSubject`
     (`backend/models/turmaSubject.js`): liga `Turma`+`Subject`+`Teacher`
     (opcional)+carga horária semanal, único por par turma+disciplina.
     `Student` ganhou `turmaId` (nullable, aditivo — não mexe no `grade` texto
     livre que já existia). Rotas `/api/turmas` e `/api/turma-subjects`,
     ambas gated por `requireAcademicModel("SECONDARY")` (primeiro uso desse
     middleware pro lado `SECONDARY`; até então só existia pra `HIGHER_ED`).
     Frontend: `/turmas` (`TurmasListPage`, CRUD) → ícone "Disciplinas" leva a
     `/turmas/:turmaId/disciplinas` (`TurmaSubjectsPage`, atribui
     disciplina+professor+carga horária). `StudentFormDialog` ganhou um
     select de Turma, visível só quando `school.academicModel === "SECONDARY"`.
     Restrito a `SUPER_ADMIN/ADMIN/STAFF` pra criar/editar, `+DIRECTOR/TEACHER`
     pra leitura (espelha `turmas.routes.js`/`turmaSubjects.routes.js`);
     excluir turma/disciplina restrito a `SUPER_ADMIN/ADMIN`.
     **Renomeação necessária:** a rota/nav `/turmas` já existia antes desta
     fase, mas apontava pro `Classroom` (sala física) — um "turma" que na
     verdade era sala, colisão de nome descoberta ao planejar esta fase.
     Renomeado pra `/salas` ("Salas") antes de criar o novo `/turmas` de
     verdade, pra não confundir os dois conceitos (não confundir `Turma`
     pedagógica com `Classroom`/sala física nos models).
     **Delete bloqueado com 409** se a turma tiver alunos ou disciplinas
     atribuídas (mesmo padrão de proteção já usado em `Assessment`).
     **Deliberadamente fora do escopo desta fase** (decisão explícita do
     usuário): Ano letivo/Período como entidade formal (`academicYear`
     continua texto livre, ver item abaixo), ~~`Schedule`/horário de aula
     pra `SECONDARY` (só existe pro lado `HIGHER_ED`)~~ **feito na Fase 9a**
     (`TurmaSchedule`, ver seção 6, item 5), Avaliações/notas pra
     `SECONDARY` via `Turma` (o fluxo de Avaliações/Notas da Fase 5 continua
     exclusivo de `CourseOfferingSubject`/`HIGHER_ED`), e Portal do Professor
     (ainda bloqueado — agora só falta a parte de Avaliações pro lado
     `SECONDARY`, já que a relação professor↔turma↔disciplina em si já
     existe via `TurmaSubject`).
     **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build` — 1088 módulos) — sem MySQL/Docker disponível
     neste ambiente, os fluxos de criar turma, atribuir disciplina/professor
     e vincular aluno não foram testados contra dado real.
   - **Ano letivo/período como entidade formal.** `Grade.term` (e o campo
     equivalente em `CourseOffering`) é uma string livre tipo `"2026-S1"` — não
     existe uma tabela `AcademicYear`/`Term`. Sem isso não tem como abrir/
     fechar um ano letivo formalmente nem promover alunos em massa pro
     próximo ano/série.

8. **Notificação automática de propina por SMS/WhatsApp com referência M-Pesa —
   diferencial de mercado (MZ). Parcialmente feito na Fase 8 do roadmap de
   execução: alertas no painel + entidade/referência local + confirmação de
   pagamento. SMS/WhatsApp/M-Pesa de verdade continuam de fora — ver
   detalhamento abaixo.**
   - **Proposta original:** todo fim de mês, o sistema gera automaticamente as
     propinas em aberto do período e dispara uma notificação por SMS ou
     WhatsApp para o encarregado de educação, incluindo a referência de
     pagamento móvel (M-Pesa) pra pagar sem precisar ir à secretaria.
   - ~~**Referência de pagamento.**~~ **Feito (Fase 8), com escopo reduzido a
     pedido do usuário: geração local, sem gateway real.** `Fee` ganhou
     `entity`/`reference` — `reference` é derivada do próprio `Fee.id`
     (`utils/paymentReference.js`, zero-padded, único por construção) e
     `entity` é um snapshot de `School.paymentEntity` (novo campo,
     configurável por `ADMIN`/`SUPER_ADMIN`) no momento da criação da
     propina. **Isso NÃO é uma referência validada por nenhum banco/M-Pesa
     de verdade** — sistemas reais (Multibanco, Multicaixa Express) usam um
     dígito de controlo calculado dentro de um contrato de "entidade
     aderente" com o banco, que este projeto não tem. É só um identificador
     interno, legível e copiável (botão de copiar em `FeesListPage` e
     `FeeAlertsPage`), pra secretaria/encarregado usar na conciliação manual.
   - ~~**Alertas.**~~ **Feito (Fase 8), decisão explícita do usuário: só no
     painel, sem SMS/WhatsApp/email nesta rodada.** Novo
     `GET /api/fees/alerts` (`fee.controller.js getFeeAlerts`): propinas
     atrasadas + a vencer nos próximos 7 dias, agrupadas por aluno, com
     totais por moeda (mesma ressalva multi-moeda do KPI do dashboard) —
     calculado na hora a cada chamada, sem cache, pra nunca mostrar dado
     desatualizado depois de uma confirmação. Frontend:
     `/propinas/alertas` (`FeeAlertsPage`), mesmos papéis de `/propinas`.
     STUDENT auto-escopado às próprias (mesmo padrão de `getAllFees`).
   - ~~**Atualizar situação financeira do aluno.**~~ **Feito (Fase 8) via
     confirmação de pagamento, sem tela de histórico dedicada.** Extraído
     `backend/services/feePayment.service.js` (`confirmFeePayment`/
     `revertFeePayment`) — usado por `markFeeStatus` (STAFF confirma
     manualmente depois de conferir o comprovativo, como já existia) e é o
     ponto de extensão do webhook abaixo. `Fee` ganhou `paymentMethod`
     (MANUAL/WEBHOOK) e `confirmedById`, então toda propina paga mostra
     quem/como confirmou (tooltip no chip "Pago" de `FeesListPage`). Como o
     cálculo dos totais em `/propinas/alertas` é sempre ao vivo, a
     "situação financeira" nunca fica desatualizada depois de uma
     confirmação — decisão deliberada de não duplicar isso num campo
     cacheado no `Student` (risco de ficar dessincronizado).
   - ~~**Preparar para receber webhook no futuro.**~~ **Feito (Fase 8),
     decisão explícita do usuário: "vai de manual primeiro, mas prepara
     para receber webhook no futuro".** Novo endpoint
     `POST /api/fees-webhook/payment-confirmation`
     (`backend/controllers/feeWebhook.controller.js`), **sem** nenhum
     gateway real chamando-o ainda: sem `authMiddleware` (provedor externo
     não tem JWT deste sistema), protegido por um segredo simples
     (`X-Webhook-Secret` comparado a `PAYMENT_WEBHOOK_SECRET` no `.env`,
     vazio por padrão — a rota responde 503 até alguém configurar).
     Idempotente (reenvio da mesma notificação não reprocessa). Busca o
     `Fee` por `reference` e chama o mesmo `confirmFeePayment` do fluxo
     manual, com `method: "WEBHOOK"`. **Não** grava log de auditoria (ver
     comentário no controller: `LogAudit` não tem `schoolId` próprio, o
     isolamento por escola depende de um join obrigatório em `User`, e uma
     confirmação via webhook não tem `userId` — o log ficaria invisível
     pra qualquer `ADMIN` de escola; a rastreabilidade fica no próprio
     `Fee`). Quando um gateway real (M-Pesa ou outro) for escolhido, é só
     apontar o webhook dele pra essa rota — o formato exato do payload
     desse gateway específico ainda não foi modelado, porque nenhum foi
     escolhido.
   - **De quebra:** `PATCH /api/schools/:id` era `SUPER_ADMIN`-only mesmo o
     comentário da rota já falando em "a própria escola pode editar" —
     inconsistência corrigida: agora `ADMIN` também edita a própria escola
     (checagem de posse no controller, mesmo padrão de `getSchoolById`;
     `plan`/`status` continuam bloqueados pro `ADMIN`, são decisão de
     billing da plataforma). Necessário pra `ADMIN` configurar
     `paymentEntity` sem depender do `SUPER_ADMIN`. Nova
     `SchoolSettingsPage` (`/escola/configuracoes`, só `ADMIN`) além do
     campo adicionado em `SchoolFormDialog` (fluxo `SUPER_ADMIN` via
     `/escolas`).
   - **Pré-requisitos que ainda faltam, todos do zero (fora de escopo desta
     fase, decisão explícita do usuário — "SMS/WhatsApp exigiria integrar um
     gateway novo do zero"):**
     - Papel/cadastro de **encarregado de educação (guardian)** — hoje não
       existe (`GUARDIAN` foi cogitado e adiado de propósito, ver seção 7);
       sem isso não tem "pra quem" mandar a notificação nem o contacto
       (telefone) de quem recebe.
     - **Job agendado de fim de mês** — não existe nenhum scheduler no projeto
       (`package.json` do backend não tem `node-cron` nem equivalente); hoje
       toda propina é lançada manualmente pela secretaria (Portal do Staff).
     - **Integração real com gateway de pagamento móvel (M-Pesa)** — o
       endpoint de webhook está pronto pra receber a confirmação (ver acima),
       mas gerar/validar a referência do lado do banco exige credenciais/API
       que este projeto não tem.
     - **Envio de SMS/WhatsApp** — não existe integração com nenhum provedor
       (Twilio, WhatsApp Business API, gateway de SMS local em MZ, etc.); o
       único canal de notificação hoje é email (`utils/email.js`, e mesmo esse
       não está ligado a nada — ver seção 5) e agora o painel de alertas.
   - **Validado só estaticamente** (sintaxe, cadeia de `require`, boot do
     `server.js`, `vite build` — 1096 módulos) — sem MySQL/Docker disponível
     neste ambiente, os fluxos de gerar entidade/referência ao criar uma
     propina, confirmar pagamento manual e via webhook, e configurar a
     entidade da escola não foram testados contra dado real.

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
- ~~Tela de criar STAFF — ainda não existe.~~ **Feito.** Ver seção 6, item 6.
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
- ~~Esqueci minha senha — só existe o esqueleto no backend.~~ **Feito.** Ver
  seção 6, item 6. Falta só preencher `EMAIL_USER`/`EMAIL_PASS` reais em
  `backend/.env` e testar o envio de fato (não testado neste ambiente).
- **Login falhando em conta pré-existente (não investigado a fundo).**
  Testado localmente via Docker após as mudanças de schema desta rodada
  (ENUM `role` ganhando `STAFF`, `School.currency`): uma conta **nova**
  logou normalmente, mas uma conta **antiga** (criada antes dessas
  mudanças) deu erro no login (`500` e depois `404` em tentativas
  seguintes). Root cause não foi diagnosticado — suspeita é dado
  legado incompatível com o schema atual, não bug no fluxo de login em
  si (conta nova funciona). Decisão explícita: não investigar agora,
  seguir com a conta nova. Fica registrado como risco real pra quando
  houver migração de dados de escolas de verdade (produção) — rodar a
  investigação (comparar os registros das duas contas no banco, checar
  se `role`/`currency`/outro campo novo ficou `NULL` ou inválido na
  conta antiga) antes de qualquer go-live com dados existentes.
- ~~Banco: MySQL 8.0.~~ **Decidido e implementado: PostgreSQL 16 (`postgres:16-alpine`).**
  Troca puramente de infra/config — nenhum SQL cru no projeto, nenhuma query
  dependia de função específica do MySQL. O que mudou: `docker-compose.yml`
  (imagem, `POSTGRES_*`, porta 5432, volume `sms_postgres_data`, healthcheck
  `pg_isready`), `backend/config/db.js` (`dialect: "postgres"`), driver
  (`mysql2` → `pg` + `pg-hstore`) e `DB_PORT`/`DB_USER` nos dois `.env`
  (raiz, usado pela interpolação do compose, e `backend/.env`, usado pela app).
  - **Dado antigo não migra** — engine diferente, o volume `sms_mysql_data`
    continua no disco mas nenhum serviço o monta. Banco novo nasce vazio pelo
    `sequelize.sync()`. De quebra isso encerra o bug de "conta antiga não
    loga" registrado acima: não existe mais conta antiga.
  - **`alter` fixo removido do boot (feito junto com a migração).** `server.js`
    chamava `sequelize.sync({ alter: true })` em todo boot. No PostgreSQL um
    `ENUM` é um tipo de verdade (`CREATE TYPE`), não um modificador de coluna
    como no MySQL, e `alter` repetido sobre as 21 colunas `ENUM` do projeto é
    ponto conhecido de atrito do Sequelize v6 (`type "enum_..." already
    exists`, tipos órfãos). Agora o boot chama `config/databaseSync.js` — que
    existia desde sempre mas era **código morto, nenhum ficheiro o importava**
    — e quem manda é o `.env`: `DB_SYNC=true` (cria o que falta) +
    `DB_ALTER=false` (default novo; ligar pontualmente ao mudar schema,
    desligar depois). Consequências de comportamento:
    - `syncDatabase()` agora **relança** o erro em vez de engolir, pra manter o
      que o boot já fazia antes: falha de schema não deixa o servidor subir.
    - o guard `NODE_ENV === "production"` que já estava lá passa a valer de
      fato — em produção o sync é pulado por completo, o que torna migrations
      via `sequelize-cli` (já no `devDependencies`, nunca usado) o caminho
      obrigatório pra qualquer go-live.
    - efeito colateral: `databaseSync.js` é o único ficheiro que importa
      `utils/logger.js`, que cria `backend/logs/` no import. Ou seja, o logger
      também era código morto até agora e a pasta passa a ser criada em todo
      boot (vazia, a menos que `LOG_TO_FILE=true`).
  - **Validado só estaticamente** (dialeto carregado, cadeia de `require` dos
    models) — Docker não está disponível neste ambiente, então nenhum boot
    contra PostgreSQL real foi feito.
