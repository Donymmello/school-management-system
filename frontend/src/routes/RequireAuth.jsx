import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";

// requiredAcademicModel: restringe a rota a escolas de um modelo acadêmico
// específico (ver docs/project-rules.md, seção 5) — ex: Cursos/Ofertas/
// Matrículas só existem pra escolas HIGHER_ED. SUPER_ADMIN não tem escola
// própria, então nunca é bloqueado por esse filtro.
export default function RequireAuth({ allowedRoles, requiredAcademicModel, children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress aria-label="Carregando sessão" />
      </Box>
    );
  }

  if (status === "anonymous") {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/painel" replace />;
  }

  if (
    requiredAcademicModel &&
    user.role !== "SUPER_ADMIN" &&
    user.school?.academicModel !== requiredAcademicModel
  ) {
    return <Navigate to="/painel" replace />;
  }

  return children;
}
