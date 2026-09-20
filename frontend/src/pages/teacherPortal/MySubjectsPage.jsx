import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
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
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { getMySubjects } from "../../api/teachers.js";
import { getErrorMessage } from "../../api/errors.js";

// Portal do Professor: "minhas disciplinas". Mesmo desenho da tela do aluno
// (studyPlan/StudyPlanPage.jsx) — o backend normaliza HIGHER_ED
// (CourseOfferingSubject) e SECONDARY (TurmaSubject) num shape só, então
// aqui não há ramo por academicModel: mostra "contexto" (oferta ou turma)
// quando o backend manda, e "estado" só quando existe.
export default function MySubjectsPage() {
  const [items, setItems] = useState([]);
  const [hasStatus, setHasStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySubjects();
      setItems(data.items || []);
      setHasStatus(data.items?.some((item) => item.status) || false);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as suas disciplinas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const colCount = hasStatus ? 4 : 3;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Minhas disciplinas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Minhas disciplinas">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Turma / Oferta</TableCell>
              <TableCell>Carga horária/semana</TableCell>
              {hasStatus && <TableCell>Estado</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && items.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Box textAlign="center" py={6} role="status">
                    <MenuBookOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma disciplina atribuída
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fale com a secretaria — é ela que liga professor, disciplina e turma/oferta.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              items.map((item) => (
                <TableRow key={item.assignmentId} hover>
                  <TableCell>{item.subjectName}</TableCell>
                  <TableCell>{item.context || "—"}</TableCell>
                  <TableCell>{item.weeklyHours ? `${item.weeklyHours}h` : "—"}</TableCell>
                  {hasStatus && <TableCell>{item.status || "—"}</TableCell>}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
