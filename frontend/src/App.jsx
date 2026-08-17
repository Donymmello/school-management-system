import React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LandingPage from "./pages/auth/LandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterSchoolPage from "./pages/auth/RegisterSchoolPage.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import StudentsListPage from "./pages/students/StudentsListPage.jsx";
import ClassroomsListPage from "./pages/classrooms/ClassroomsListPage.jsx";
import TeachersListPage from "./pages/teachers/TeachersListPage.jsx";
import SubjectsListPage from "./pages/subjects/SubjectsListPage.jsx";
import CoursesListPage from "./pages/courses/CoursesListPage.jsx";
import CourseOfferingsListPage from "./pages/courseOfferings/CourseOfferingsListPage.jsx";
import EnrollmentsListPage from "./pages/enrollments/EnrollmentsListPage.jsx";
import AttendanceListPage from "./pages/attendance/AttendanceListPage.jsx";
import GradesListPage from "./pages/grades/GradesListPage.jsx";
import FeesListPage from "./pages/fees/FeesListPage.jsx";
import SchoolsListPage from "./pages/schools/SchoolsListPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const STUDENTS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];
const CLASSROOMS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const TEACHERS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
const SUBJECTS_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER"];
const COURSES_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const COURSE_OFFERINGS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
// STUDENT entra nas três: portal do aluno, somente leitura e auto-escopado
// no backend pro próprio registro (ver docs/project-rules.md, seção 6, item 5).
const ENROLLMENTS_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "STUDENT"];
const ATTENDANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER", "STUDENT"];
const GRADES_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "TEACHER", "STAFF", "STUDENT"];
// STAFF lança e gerencia; STUDENT só lê as próprias (portal do aluno,
// auto-escopado no backend) — ver docs/project-rules.md, seção 6, item 5.
const FEES_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "STUDENT"];
const SCHOOLS_ROLES = ["SUPER_ADMIN"];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
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
            path="/turmas"
            element={
              <RequireAuth allowedRoles={CLASSROOMS_ROLES}>
                <ClassroomsListPage />
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
            path="/matriculas"
            element={
              <RequireAuth allowedRoles={ENROLLMENTS_ROLES} requiredAcademicModel="HIGHER_ED">
                <EnrollmentsListPage />
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
            path="/escolas"
            element={
              <RequireAuth allowedRoles={SCHOOLS_ROLES}>
                <SchoolsListPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
