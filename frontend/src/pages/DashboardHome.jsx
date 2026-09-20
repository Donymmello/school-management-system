import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Grid, Paper, Skeleton, Typography } from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyProfile } from "../api/students.js";
import { getDashboardSummary } from "../api/dashboard.js";
import { getErrorMessage } from "../api/errors.js";

const ACADEMIC_MODEL_LABELS = { SECONDARY: "Ensino secundário", HIGHER_ED: "Técnico/Superior" };
// Espelha authorizeRoles da rota GET /api/dashboard/summary (backend/routes/dashboard.routes.js).
const KPI_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];

function KpiCard({ icon, label, value, color = "text.primary" }) {
  return (
    <Paper sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box display="flex" alignItems="center" gap={1} color="text.secondary">
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Typography variant="h4" component="p" sx={{ color }}>
        {value}
      </Typography>
    </Paper>
  );
}

function formatCurrencyAmount(amount, currency) {
  return `${Number(amount).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function KpiGrid() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getDashboardSummary());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os números do painel."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} role="alert">
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={104} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!summary) return null;

  // SUPER_ADMIN sem escola própria e sem ?schoolId= vê um resumo da
  // plataforma inteira em vez de números de uma escola (ver
  // backend/controllers/dashboard.controller.js).
  if (summary.scope === "PLATFORM") {
    return (
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<DomainOutlinedIcon fontSize="small" />} label="Escolas" value={summary.schoolsTotal} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<DomainOutlinedIcon fontSize="small" />}
            label="Escolas ativas"
            value={summary.schoolsActive}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={<GroupsOutlinedIcon fontSize="small" />} label="Alunos (total)" value={summary.studentsTotal} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<SchoolOutlinedIcon fontSize="small" />}
            label="Professores (total)"
            value={summary.teachersTotal}
          />
        </Grid>
      </Grid>
    );
  }

  const hasOverdue = summary.feesOverdue && summary.feesOverdue.length > 0;
  const overdueCount = hasOverdue ? summary.feesOverdue.reduce((sum, row) => sum + row.count, 0) : 0;

  return (
    <Grid container spacing={2} sx={{ mt: 0.5 }}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard icon={<GroupsOutlinedIcon fontSize="small" />} label="Alunos" value={summary.studentsTotal} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard icon={<SchoolOutlinedIcon fontSize="small" />} label="Professores" value={summary.teachersTotal} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard icon={<BadgeOutlinedIcon fontSize="small" />} label="Staff" value={summary.staffTotal} />
      </Grid>
      {summary.enrollmentsPendingCount !== null && (
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<AssignmentIndOutlinedIcon fontSize="small" />}
            label="Matrículas pendentes"
            value={summary.enrollmentsPendingCount}
            color={summary.enrollmentsPendingCount > 0 ? "warning.main" : "text.primary"}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
          label="Propinas pendentes"
          value={summary.feesPendingCount}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
          label="Propinas em atraso"
          value={overdueCount}
          color={overdueCount > 0 ? "error.main" : "text.primary"}
        />
      </Grid>
      {hasOverdue && (
        <Grid item xs={12}>
          <Alert severity="warning" variant="outlined">
            Em atraso: {summary.feesOverdue.map((row) => formatCurrencyAmount(row.amount, row.currency)).join(", ")}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
  const showKpis = KPI_ROLES.includes(user?.role);

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

      {showKpis && <KpiGrid />}

      <Paper sx={{ p: 3, mt: 3, maxWidth: 480 }}>
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
