import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { getMyAcademicStatus } from "../../api/students.js";
import { getErrorMessage } from "../../api/errors.js";

// "Minha situação curricular" (Fase 9d, ver docs/project-rules.md, seção
// 6) — decisão explícita do usuário: aprovado/reprovado de verdade só pro
// HIGHER_ED (reaproveita AcademicPolicy, já existente desde a Fase 5);
// SECONDARY não tem esse critério modelado, mostra só a média por
// disciplina. O backend já diz qual dos dois formatos veio
// (data.academicModel), essa tela só troca a tabela conforme isso.
export default function AcademicStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getMyAcademicStatus());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a situação curricular."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = data?.items || [];
  const isHigherEd = data?.academicModel === "HIGHER_ED";

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Minha situação curricular
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {loading && <Skeleton variant="rounded" height={200} />}

      {!loading && !error && items.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <AssessmentOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Nada por aqui ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Só aparece depois que houver notas lançadas nas suas disciplinas.
          </Typography>
        </Paper>
      )}

      {!loading && items.length > 0 && isHigherEd && (
        <TableContainer component={Paper}>
          <Table aria-label="Minha situação curricular">
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                <TableCell>Oferta</TableCell>
                <TableCell>Nota contínua</TableCell>
                <TableCell>Exame</TableCell>
                <TableCell>Nota final</TableCell>
                <TableCell>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.subjectId ?? "item"}-${index}`} hover>
                  <TableCell>{item.subjectName}</TableCell>
                  <TableCell>{item.context || "—"}</TableCell>
                  {item.unavailable ? (
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">
                        Ainda não calculado — a escola não tem uma política acadêmica ativa.
                      </Typography>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell>{item.continuousScore}</TableCell>
                      <TableCell>
                        {item.exempted ? "Isento" : item.examScore ?? "Pendente"}
                      </TableCell>
                      <TableCell>{item.finalGrade}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={item.passed ? "success" : "error"}
                          label={item.passed ? "Aprovado" : "Reprovado"}
                        />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && items.length > 0 && !isHigherEd && (
        <TableContainer component={Paper}>
          <Table aria-label="Minha situação curricular">
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                <TableCell>Média</TableCell>
                <TableCell>Notas lançadas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.subjectId ?? "item"}-${index}`} hover>
                  <TableCell>{item.subjectName}</TableCell>
                  <TableCell>{item.averageScore}</TableCell>
                  <TableCell>{item.gradeCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && items.length > 0 && !isHigherEd && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Sem aprovado/reprovado formal — a escola ainda não tem um critério de aprovação configurado por
          disciplina.
        </Typography>
      )}
    </Box>
  );
}
