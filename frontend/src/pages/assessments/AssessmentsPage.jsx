import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { deleteAssessment, listAssessments } from "../../api/assessments.js";
import { getCourseOfferingSubject } from "../../api/courseOfferingSubjects.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import AssessmentFormDialog from "./AssessmentFormDialog.jsx";
import ScoresDialog from "./ScoresDialog.jsx";
import ResultadoFinalPanel from "./ResultadoFinalPanel.jsx";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];
const TYPE_LABELS = { TEST: "Teste", ASSIGNMENT: "Trabalho", PROJECT: "Projeto", EXAM: "Exame" };
const CATEGORY_LABELS = { CONTINUOUS: "Contínua", EXAM: "Exame" };
const STATUS_LABELS = { DRAFT: "Rascunho", PUBLISHED: "Publicada", CLOSED: "Encerrada" };
const STATUS_COLORS = { DRAFT: "default", PUBLISHED: "success", CLOSED: "info" };

export default function AssessmentsPage() {
  const { offeringId, cosId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const canDelete = DELETE_ROLES.includes(user?.role);
  const numericCosId = Number(cosId);

  const [cos, setCos] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [scoresTarget, setScoresTarget] = useState(null);
  const [deletingAssessment, setDeletingAssessment] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cosData, assessmentList] = await Promise.all([
        getCourseOfferingSubject(cosId),
        listAssessments(numericCosId),
      ]);
      setCos(cosData);
      setAssessments(assessmentList);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as avaliações."));
    } finally {
      setLoading(false);
    }
  }, [cosId, numericCosId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingAssessment(null);
    setFormOpen(true);
  }

  function openEdit(assessment) {
    setEditingAssessment(assessment);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteAssessment(deletingAssessment.id);
      setDeletingAssessment(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a avaliação."));
      setDeletingAssessment(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/ofertas/${offeringId}/disciplinas`)} sx={{ mb: 1 }}>
        Voltar para disciplinas
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Box>
          <Typography variant="h4" component="h1">
            Avaliações — {cos?.subject?.name || ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cos?.teacher?.name ? `Professor: ${cos.teacher.name}` : "Sem professor atribuído"}
          </Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nova avaliação
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de avaliações">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Peso</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && assessments.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box textAlign="center" py={6} role="status">
                    <AssessmentOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma avaliação cadastrada ainda
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Nova avaliação" para começar.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              assessments.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>{TYPE_LABELS[a.type] || a.type}</TableCell>
                  <TableCell>{CATEGORY_LABELS[a.category] || a.category}</TableCell>
                  <TableCell>{a.weight}%</TableCell>
                  <TableCell>{a.assessmentDate}</TableCell>
                  <TableCell>
                    <Chip size="small" label={STATUS_LABELS[a.status] || a.status} color={STATUS_COLORS[a.status] || "default"} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Notas">
                      <IconButton aria-label={`Notas de ${a.title}`} size="small" onClick={() => setScoresTarget(a)}>
                        <GradeOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <Tooltip title="Editar">
                        <IconButton aria-label={`Editar ${a.title}`} size="small" onClick={() => openEdit(a)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Excluir">
                        <IconButton aria-label={`Excluir ${a.title}`} size="small" onClick={() => setDeletingAssessment(a)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {cos?.courseOfferingId && (
        <ResultadoFinalPanel courseOfferingId={cos.courseOfferingId} courseOfferingSubjectId={numericCosId} />
      )}

      <AssessmentFormDialog
        open={formOpen}
        courseOfferingSubjectId={numericCosId}
        assessment={editingAssessment}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ScoresDialog
        open={Boolean(scoresTarget)}
        assessment={scoresTarget}
        courseOfferingId={cos?.courseOfferingId}
        onClose={() => setScoresTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingAssessment)}
        title="Excluir avaliação"
        description={`Tem certeza que deseja excluir "${deletingAssessment?.title}"? Só é possível se ela ainda não tiver notas lançadas.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingAssessment(null)}
      />
    </Box>
  );
}
