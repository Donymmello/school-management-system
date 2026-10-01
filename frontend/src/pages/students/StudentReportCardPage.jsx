import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { getStudentById } from "../../api/students.js";
import { listGrades } from "../../api/grades.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { montarBoletim, formatar } from "./reportCard.js";

/*
  Boletim para impressão (docs/project-rules.md, seção 6, item 7).

  Sem biblioteca de PDF: as regras @media print em index.css preparam a página
  e o browser faz o resto com Ctrl+P → "Guardar como PDF". Nada é gerado no
  servidor, por isso não há nada para manter a correr nem para instalar.

  Também não há endpoint novo: GET /students/:id e GET /grades?studentId= já
  devolvem tudo o que é preciso, e ambos já filtram por escola — e, para
  TEACHER, pelos próprios alunos.
*/

export default function StudentReportCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aluno, notas] = await Promise.all([getStudentById(id), listGrades({ studentId: id })]);
      setStudent(aluno);
      setGrades(notas);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o boletim."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Matriz disciplina x período. Se houver mais de uma nota na mesma
  // disciplina e período (dois testes, por exemplo), a célula mostra a média
  // delas — somar não faria sentido e mostrar só a última perderia informação.
  // Agregação em reportCard.js, fora do componente, para poder ser verificada
  // sem browser (reportCard.selfcheck.js).
  const { periodos, linhas, mediaGeral } = useMemo(() => montarBoletim(grades), [grades]);

  const nomeEscola = user?.school?.name || "—";
  const colunas = periodos.length + 2;

  return (
    <Box>
      <Stack direction="row" spacing={1} className="no-print" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate("/alunos")}>
          Voltar
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() => window.print()}
          disabled={loading || Boolean(error)}
        >
          Imprimir / Guardar PDF
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box className="evitar-corte" sx={{ mb: 2 }}>
          <Typography variant="h6" component="h1">
            {nomeEscola}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Boletim de notas
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading && <Skeleton height={32} sx={{ mb: 1 }} />}

        {!loading && student && (
          <Box className="evitar-corte" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Aluno:</strong> {student.name}
            </Typography>
            <Typography variant="body2">
              <strong>Código:</strong> {student.studentCode || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Turma:</strong> {student.turma?.name || student.grade || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Emitido em:</strong> {new Date().toLocaleDateString("pt-PT")}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table size="small" aria-label="Boletim de notas">
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                {periodos.map((p) => (
                  <TableCell key={p} align="center">
                    {p}
                  </TableCell>
                ))}
                <TableCell align="center">
                  <strong>Média</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={2}>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && linhas.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={colunas}>
                    <Box textAlign="center" py={4} role="status">
                      <Typography variant="subtitle1">Sem notas lançadas</Typography>
                      <Typography variant="body2" color="text.secondary">
                        O boletim fica vazio até existir pelo menos uma nota para este aluno.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                linhas.map((linha) => (
                  <TableRow key={linha.disciplina}>
                    <TableCell>{linha.disciplina}</TableCell>
                    {linha.valoresPorPeriodo.map((valor, i) => (
                      <TableCell key={periodos[i]} align="center">
                        {formatar(valor)}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <strong>{formatar(linha.mediaFinal)}</strong>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && linhas.length > 0 && (
                <TableRow>
                  <TableCell colSpan={periodos.length + 1} align="right">
                    <strong>Média geral</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>{formatar(mediaGeral)}</strong>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Sem critério de aprovação modelado para SECONDARY (decisão
            registada na seção 6, item 5) — dizê-lo é melhor do que deixar
            quem lê o papel supor que a média já decide algo. */}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
          Documento informativo. As médias são aritméticas simples e não representam uma situação de
          aprovação ou reprovação formal.
        </Typography>
      </Paper>
    </Box>
  );
}
