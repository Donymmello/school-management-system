import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LandingPage from "./pages/auth/LandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import RegisterSchoolPage from "./pages/auth/RegisterSchoolPage.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import StudentsListPage from "./pages/students/StudentsListPage.jsx";
import ClassroomsListPage from "./pages/classrooms/ClassroomsListPage.jsx";
import TurmasListPage from "./pages/turmas/TurmasListPage.jsx";
import TurmaSubjectsPage from "./pages/turmas/TurmaSubjectsPage.jsx";
import TeachersListPage from "./pages/teachers/TeachersListPage.jsx";
import StaffListPage from "./pages/staff/StaffListPage.jsx";
import AuditLogListPage from "./pages/auditLogs/AuditLogListPage.jsx";
import SubjectsListPage from "./pages/subjects/SubjectsListPage.jsx";
import CoursesListPage from "./pages/courses/CoursesListPage.jsx";
import CourseOfferingsListPage from "./pages/courseOfferings/CourseOfferingsListPage.jsx";
import CourseOfferingSubjectsPage from "./pages/courseOfferingSubjects/CourseOfferingSubjectsPage.jsx";
import AssessmentsPage from "./pages/assessments/AssessmentsPage.jsx";
import EnrollmentsListPage from "./pages/enrollments/EnrollmentsListPage.jsx";
import AttendanceListPage from "./pages/attendance/AttendanceListPage.jsx";
import GradesListPage from "./pages/grades/GradesListPage.jsx";
import MySchedulePage from "./pages/schedule/MySchedulePage.jsx";
import StudyPlanPage from "./pages/studyPlan/StudyPlanPage.jsx";
import MySubjectsPage from "./pages/teacherPortal/MySubjectsPage.jsx";
import AcademicStatusPage from "./pages/studyPlan/AcademicStatusPage.jsx";
import FeesListPage from "./pages/fees/FeesListPage.jsx";
import FeeAlertsPage from "./pages/fees/FeeAlertsPage.jsx";
import SchoolsListPage from "./pages/schools/SchoolsListPage.jsx";
import SchoolSettingsPage from "./pages/schools/SchoolSettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const STUDENTS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];
const CLASSROOMS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
// Turma pedagógica (aluno+professor+disciplina), só SECONDARY — não
// confundir com Classroom (sala física, rota /salas). Ver
// docs/project-rules.md, seção 6, item 7.
const TURMAS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const TEACHERS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
// Espelha staff.routes.js MANAGE_ROLES (GET) — criação em si passa por
// /auth/register-user, restrito a ADMIN/SUPER_ADMIN no backend (mesma
// limitação de front que já existia pra Professores: o botão aparece pro
// papel que só lista, e o backend rejeita com 403 se tentar criar).
const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
const SUBJECTS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER"];
const COURSES_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const COURSE_OFFERINGS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
// STUDENT entra nas três: portal do aluno, somente leitura e auto-escopado
// no backend pro próprio registro (ver docs/project-rules.md, seção 6, item 5).
const ENROLLMENTS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "STUDENT"];
// Fase 9a — "Meu horário", só STUDENT (não é tela de gestão; gestão de
// horário continua dentro de /ofertas e /turmas, staff-facing).
const MY_SCHEDULE_ROLES = ["STUDENT"];
// Fase 9c — "Meu plano de estudos", também só STUDENT.
const STUDY_PLAN_ROLES = ["STUDENT"];
const MY_SUBJECTS_ROLES = ["TEACHER"];
// Fase 9d — "Minha situação curricular", também só STUDENT.
const ACADEMIC_STATUS_ROLES = ["STUDENT"];
const ATTENDANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER", "STUDENT"];
const GRADES_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "TEACHER", "STAFF", "STUDENT"];
// STAFF lança e gerencia; STUDENT só lê as próprias (portal do aluno,
// auto-escopado no backend) — ver docs/project-rules.md, seção 6, item 5.
const FEES_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "STUDENT"];
const SCHOOLS_ROLES = ["SUPER_ADMIN"];
// Fase 8 — self-service da própria escola, só ADMIN (ver
// backend/controllers/school.controller.js updateSchool: SUPER_ADMIN já
// tem "/escolas" pra isso).
const SCHOOL_SETTINGS_ROLES = ["ADMIN"];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/registrar-escola" element={<RegisterSchoolPage />} />

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/painel" element={<DashboardHome />} />
          <Route
            path="/alunos"
            element={
              <RequireAuth allowedRoles={STUDENTS_ROLES}>
                <StudentsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/salas"
            element={
              <RequireAuth allowedRoles={CLASSROOMS_ROLES}>
                <ClassroomsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/turmas"
            element={
              <RequireAuth allowedRoles={TURMAS_ROLES} requiredAcademicModel="SECONDARY">
                <TurmasListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/turmas/:turmaId/disciplinas"
            element={
              <RequireAuth allowedRoles={TURMAS_ROLES} requiredAcademicModel="SECONDARY">
                <TurmaSubjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/professores"
            element={
              <RequireAuth allowedRoles={TEACHERS_ROLES}>
                <TeachersListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/staff"
            element={
              <RequireAuth allowedRoles={STAFF_ROLES}>
                <StaffListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/disciplinas"
            element={
              <RequireAuth allowedRoles={SUBJECTS_ROLES}>
                <SubjectsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cursos"
            element={
              <RequireAuth allowedRoles={COURSES_ROLES} requiredAcademicModel="HIGHER_ED">
                <CoursesListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ofertas"
            element={
              <RequireAuth allowedRoles={COURSE_OFFERINGS_ROLES} requiredAcademicModel="HIGHER_ED">
                <CourseOfferingsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ofertas/:offeringId/disciplinas"
            element={
              <RequireAuth allowedRoles={COURSE_OFFERINGS_ROLES} requiredAcademicModel="HIGHER_ED">
                <CourseOfferingSubjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ofertas/:offeringId/disciplinas/:cosId/avaliacoes"
            element={
              <RequireAuth allowedRoles={COURSE_OFFERINGS_ROLES} requiredAcademicModel="HIGHER_ED">
                <AssessmentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/matriculas"
            element={
              <RequireAuth allowedRoles={ENROLLMENTS_ROLES} requiredAcademicModel="HIGHER_ED">
                <EnrollmentsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meu-horario"
            element={
              <RequireAuth allowedRoles={MY_SCHEDULE_ROLES}>
                <MySchedulePage />
              </RequireAuth>
            }
          />
          <Route
            path="/minhas-disciplinas"
            element={
              <RequireAuth allowedRoles={MY_SUBJECTS_ROLES}>
                <MySubjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meu-plano-de-estudos"
            element={
              <RequireAuth allowedRoles={STUDY_PLAN_ROLES}>
                <StudyPlanPage />
              </RequireAuth>
            }
          />
          <Route
            path="/minha-situacao-curricular"
            element={
              <RequireAuth allowedRoles={ACADEMIC_STATUS_ROLES}>
                <AcademicStatusPage />
              </RequireAuth>
            }
          />
          <Route
            path="/frequencia"
            element={
              <RequireAuth allowedRoles={ATTENDANCE_ROLES}>
                <AttendanceListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/notas"
            element={
              <RequireAuth allowedRoles={GRADES_ROLES}>
                <GradesListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/propinas"
            element={
              <RequireAuth allowedRoles={FEES_ROLES}>
                <FeesListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/propinas/alertas"
            element={
              <RequireAuth allowedRoles={FEES_ROLES}>
                <FeeAlertsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/escolas"
            element={
              <RequireAuth allowedRoles={SCHOOLS_ROLES}>
                <SchoolsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/escola/configuracoes"
            element={
              <RequireAuth allowedRoles={SCHOOL_SETTINGS_ROLES}>
                <SchoolSettingsPage />
              </RequireAuth>
            }
          />
          {/* Sem allowedRoles: todo papel autenticado acessa, a própria
              página decide o que buscar (log completo pra ADMIN/SUPER_ADMIN
              via GET /logs-audit, "minhas ações" pros demais via
              GET /logs-audit/meus) — ver AuditLogListPage.jsx. */}
          <Route path="/auditoria" element={<AuditLogListPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
