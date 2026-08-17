import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyProfile } from "../api/students.js";

const ACADEMIC_MODEL_LABELS = { SECONDARY: "Ensino secundário", HIGHER_ED: "Técnico/Superior" };

export default function DashboardHome() {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState(null);

  // Portal do aluno: mostra o próprio registro (código, série/turma) direto
  // no início — sem isso o STUDENT cairia numa tela genérica sem nada que
  // fale dele (ver docs/project-rules.md, seção 6, item 5).
  useEffect(() => {
    if (user?.role !== "STUDENT") return;
    getMyProfile()
      .then(setMyProfile)
      .catch(() => setMyProfile(null));
  }, [user?.role]);

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
        {myProfile && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Código de aluno
            </Typography>
            <Typography variant="body1">{myProfile.studentCode}</Typography>
            {myProfile.grade && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  Série/turma
                </Typography>
                <Typography variant="body1">{myProfile.grade}</Typography>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
