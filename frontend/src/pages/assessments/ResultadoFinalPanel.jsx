import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Grid, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { getStudentResult } from "../../api/results.js";
import { listEnrollments } from "../../api/enrollments.js";
import { getErrorMessage } from "../../api/errors.js";

// GET /api/results/:enrollmentId/:courseOfferingSubjectId — nota final
// agregada (contínua + exame, ver backend/services/gradeCalculation.service.js).
// Sem model próprio: é calculado na hora, exige uma AcademicPolicy ativa na
// escola. Ver docs/project-rules.md, seção 6, item 6.
export default function ResultadoFinalPanel({ courseOfferingId, courseOfferingSubjectId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listEnrollments({ courseOfferingId, status: "APPROVED" })
      .then(setEnrollments)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as matrículas.")));
  }, [courseOfferingId]);

  async function handleCalculate() {
    if (!enrollmentId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await getStudentResult(enrollmentId, courseOfferingSubjectId));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível calcular o resultado. Confira se a escola tem uma política acadêmica ativa."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Resultado final
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={7}>
          <TextField
            select
            label="Aluno"
            value={enrollmentId}
            onChange={(e) => {
              setEnrollmentId(e.target.value);
              setResult(null);
            }}
            fullWidth
            size="small"
          >
            {enrollments.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.student?.name} ({e.student?.studentCode})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={5}>
          <Button variant="contained" size="small" onClick={handleCalculate} disabled={!enrollmentId || loading}>
            {loading ? "Calculando…" : "Calcular resultado"}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Nota contínua
              </Typography>
              <Typography variant="h6">{result.continuousScore ?? "—"}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Dispensado de exame
              </Typography>
              <Typography variant="h6">{result.exempted ? "Sim" : "Não"}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Nota de exame
              </Typography>
              <Typography variant="h6">{result.examScore ?? "—"}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Nota final
              </Typography>
              <Typography variant="h6">{result.finalGrade ?? "—"}</Typography>
            </Grid>
          </Grid>
          <Chip
            sx={{ mt: 2 }}
            label={result.passed ? "Aprovado" : "Reprovado"}
            color={result.passed ? "success" : "error"}
          />
        </Box>
      )}
    </Paper>
  );
}
