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
import { getMyStudyPlan } from "../../api/students.js";
import { getErrorMessage } from "../../api/errors.js";

// "Meu plano de estudos" (Fase 9c, ver docs/project-rules.md, seção 6) —
// dado já existia (matrícula pro HIGHER_ED, turma pro SECONDARY), só não
// estava exposto pro aluno. Backend já normaliza os dois formatos num
// shape só, então essa tela não precisa saber a diferença — só mostra
// "contexto" (oferta/turma) quando o backend manda.
export default function StudyPlanPage() {
  const [items, setItems] = useState([]);
  const [hasContext, setHasContext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyStudyPlan();
      setItems(data.items || []);
      setHasContext(data.items?.some((item) => item.context) || false);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o plano de estudos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const colCount = hasContext ? 4 : 3;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Meu plano de estudos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Meu plano de estudos">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Professor</TableCell>
              <TableCell>Carga horária/semana</TableCell>
              {hasContext && <TableCell>Oferta</TableCell>}
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
                      Nenhuma disciplina encontrada
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fale com a secretaria se acha que isso está errado — pode ser matrícula/turma ainda não
                      atribuída.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              items.map((item, index) => (
                <TableRow key={`${item.subjectId ?? "item"}-${index}`} hover>
                  <TableCell>{item.subjectName}</TableCell>
                  <TableCell>{item.teacherName || "—"}</TableCell>
                  <TableCell>{item.weeklyHours ? `${item.weeklyHours}h` : "—"}</TableCell>
                  {hasContext && <TableCell>{item.context || "—"}</TableCell>}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
