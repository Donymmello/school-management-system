import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";

const ACADEMIC_MODEL_LABELS = { SECONDARY: "Ensino secundário", HIGHER_ED: "Técnico/Superior" };

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Olá, {user?.name?.split(" ")[0]}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Use o menu ao lado para gerenciar sua escola.
      </Typography>
      <Paper sx={{ p: 3, mt: 2, maxWidth: 480 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Papel
        </Typography>
        <Typography variant="body1" gutterBottom>
          {user?.role}
        </Typography>
        {user?.school && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Escola
            </Typography>
            <Typography variant="body1">{user.school.name}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Tipo de instituição
            </Typography>
            <Typography variant="body1">
              {ACADEMIC_MODEL_LABELS[user.school.academicModel] || user.school.academicModel}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
