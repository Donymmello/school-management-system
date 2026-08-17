import React from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";

// Porta de entrada pública ("/"). Quem já está autenticado não precisa ver
// isso de novo — vai direto pro próprio painel. Conteúdo de marketing
// (texto, imagens etc.) ainda em aberto, deliberadamente deixado simples
// por enquanto — só o essencial: identidade + um único caminho de entrada
// ("Entrar"), sem escolha de portal aqui (ver docs/project-rules.md, seção
// 6, item 5).
export default function LandingPage() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress aria-label="Carregando" />
      </Box>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/painel" replace />;
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
    >
      <Box maxWidth={560} textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom>
          Sistema de Gestão Escolar
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Matrículas, notas, frequência e propinas — tudo num só lugar, adaptado ao tipo da sua
          instituição.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button component={RouterLink} to="/login" variant="contained" size="large">
            Entrar
          </Button>
          <Button component={RouterLink} to="/registrar-escola" variant="outlined" size="large">
            Cadastrar escola
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
