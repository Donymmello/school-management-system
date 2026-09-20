import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { listStudentAssessments, recordScore } from "../../api/studentAssessments.js";
import { listEnrollments } from "../../api/enrollments.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = { enrollmentId: "", score: "", remarks: "" };
// Espelha authorizeRoles de POST /student-assessments (backend/routes/studentAssessments.routes.js).
// Sem isso, STAFF/DIRECTOR (que têm acesso de leitura à tela) viam o
// formulário de lançar nota sempre ativo e só descobriam que não podiam
// via 403 ao tentar salvar — achado em code review (fase 5).
const CAN_RECORD_ROLES = ["ADMIN", "SUPER_ADMIN", "TEACHER"];

// Notas lançadas numa avaliação específica + formulário pra lançar mais.
// StudentAssessment não tem PUT (sem correção de nota já lançada) nem
// DELETE — ver docs/project-rules.md, seção 6, item 6.
export default function ScoresDialog({ open, assessment, courseOfferingId, onClose }) {
  const { user } = useAuth();
  const canRecord = CAN_RECORD_ROLES.includes(user?.role);
  const [results, setResults] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const assessmentId = assessment?.id;

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const [scores, enrolled] = await Promise.all([
        listStudentAssessments({ assessmentId }),
        listEnrollments({ courseOfferingId, status: "APPROVED" }),
      ]);
      setResults(scores);
      setEnrollments(enrolled);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as notas."));
    } finally {
      setLoading(false);
    }
  }, [assessmentId, courseOfferingId]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    load();
  }, [open, load]);

  const scoredEnrollmentIds = new Set(results.map((r) => r.enrollmentId));
  const pendingEnrollments = enrollments.filter((e) => !scoredEnrollmentIds.has(e.id));

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await recordScore({
        enrollmentId: form.enrollmentId,
        assessmentId,
        score: Number(form.score),
        remarks: form.remarks || undefined,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível lançar a nota."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Notas — {assessment?.title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        {canRecord && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                select
                label="Aluno"
                value={form.enrollmentId}
                onChange={handleChange("enrollmentId")}
                fullWidth
                required
                size="small"
                disabled={pendingEnrollments.length === 0}
                helperText={pendingEnrollments.length === 0 ? "Todos os matriculados já têm nota" : undefined}
              >
                {pendingEnrollments.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.student?.name} ({e.student?.studentCode})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label={`Nota (máx. ${assessment?.maxScore})`}
                type="number"
                value={form.score}
                onChange={handleChange("score")}
                fullWidth
                required
                size="small"
                inputProps={{ min: 0, max: assessment?.maxScore, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                fullWidth
                disabled={submitting || pendingEnrollments.length === 0}
              >
                {submitting ? "Lançando…" : "Lançar nota"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        )}

        <TableContainer>
          <Table size="small" aria-label="Notas lançadas">
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Nota</TableCell>
                <TableCell>Observações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && results.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      Nenhuma nota lançada ainda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                results.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      {r.enrollment?.student?.name} ({r.enrollment?.student?.studentCode})
                    </TableCell>
                    <TableCell>{r.score}</TableCell>
                    <TableCell>{r.remarks || "—"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
