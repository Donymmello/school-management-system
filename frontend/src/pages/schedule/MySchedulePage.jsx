import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Chip, Paper, Skeleton, Typography } from "@mui/material";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { listSchedules } from "../../api/schedules.js";
import { listTurmaSchedules } from "../../api/turmaSchedules.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS = {
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

// Normaliza os dois formatos de horário (Schedule/HIGHER_ED via
// courseOfferingSubject, TurmaSchedule/SECONDARY via turmaSubject) pra um
// shape só, já que a tela é a mesma pros dois modelos.
function normalize(schedule) {
  const link = schedule.courseOfferingSubject || schedule.turmaSubject;
  return {
    id: schedule.id,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    subjectName: link?.subject?.name || "—",
    teacherName: link?.teacher?.name || null,
    classroomName: schedule.classroom?.name || null,
  };
}

// "Meu horário" (Fase 9a, ver docs/project-rules.md, seção 6) — mesma tela
// pros dois academicModel, só troca a API de origem: GET /schedules
// (HIGHER_ED, auto-escopado às matrículas aprovadas do aluno) ou
// GET /turma-schedules (SECONDARY, auto-escopado à turma do aluno).
export default function MySchedulePage() {
  const { user } = useAuth();
  const isHigherEd = user?.school?.academicModel === "HIGHER_ED";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = isHigherEd ? await listSchedules() : await listTurmaSchedules();
      const normalized = raw.map(normalize).sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
        return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
      });
      setItems(normalized);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o horário."));
    } finally {
      setLoading(false);
    }
  }, [isHigherEd]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = DAY_ORDER.map((day) => ({
    day,
    entries: items.filter((item) => item.dayOfWeek === day),
  })).filter((group) => group.entries.length > 0);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Meu horário
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <>
          <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
        </>
      )}

      {!loading && !error && byDay.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <ScheduleOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Nenhum horário disponível ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isHigherEd
              ? "Só aparece aqui depois que a secretaria cadastrar o horário das disciplinas da sua oferta."
              : "Só aparece aqui depois que a secretaria cadastrar o horário das disciplinas da sua turma."}
          </Typography>
        </Paper>
      )}

      {!loading &&
        byDay.map(({ day, entries }) => (
          <Paper key={day} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              {DAY_LABELS[day]}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {entries.map((entry) => (
                <Box
                  key={entry.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1}
                  sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Box>
                    <Typography variant="body1">{entry.subjectName}</Typography>
                    {entry.teacherName && (
                      <Typography variant="body2" color="text.secondary">
                        {entry.teacherName}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip size="small" label={`${entry.startTime} – ${entry.endTime}`} />
                    {entry.classroomName && <Chip size="small" variant="outlined" label={entry.classroomName} />}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
    </Box>
  );
}
