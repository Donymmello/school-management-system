import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { deleteTurmaSubject, listTurmaSubjects } from "../../api/turmaSubjects.js";
import { getTurma } from "../../api/turmas.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import TurmaSubjectFormDialog from "./TurmaSubjectFormDialog.jsx";
import TurmaScheduleManagerDialog from "./TurmaScheduleManagerDialog.jsx";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Disciplinas atribuídas a uma turma (TurmaSubject). Diferente da versão
// HIGHER_ED (CourseOfferingSubjectsPage), o backend de turma-subjects já
// filtra por turmaId no servidor — não precisa de filtro no cliente.
export default function TurmaSubjectsPage() {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const canDelete = DELETE_ROLES.includes(user?.role);
  const numericTurmaId = Number(turmaId);

  const [turma, setTurma] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [turmaData, subjectItems] = await Promise.all([
        getTurma(numericTurmaId),
        listTurmaSubjects(numericTurmaId),
      ]);
      setTurma(turmaData);
      setItems(subjectItems);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as disciplinas desta turma."));
    } finally {
      setLoading(false);
    }
  }, [numericTurmaId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteTurmaSubject(deletingItem.id);
      setDeletingItem(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover a disciplina da turma."));
      setDeletingItem(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/turmas")} sx={{ mb: 1 }}>
        Voltar para turmas
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Box>
          <Typography variant="h4" component="h1">
            Disciplinas da turma {turma?.name || ""}
          </Typography>
          {turma?.grade && (
            <Typography variant="body2" color="text.secondary">
              {turma.grade}
            </Typography>
          )}
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Adicionar disciplina
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Disciplinas da turma">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Professor</TableCell>
              <TableCell>Carga/semana</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && items.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box textAlign="center" py={6} role="status">
                    <MenuBookOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma disciplina atribuída a esta turma ainda
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Adicionar disciplina" para começar.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.subject?.name}</TableCell>
                  <TableCell>{item.teacher?.name || "—"}</TableCell>
                  <TableCell>{item.weeklyHours}h</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Horário">
                      <IconButton
                        aria-label={`Horário de ${item.subject?.name}`}
                        size="small"
                        onClick={() => setScheduleTarget(item)}
                      >
                        <ScheduleOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <Tooltip title="Editar">
                        <IconButton
                          aria-label={`Editar ${item.subject?.name}`}
                          size="small"
                          onClick={() => openEdit(item)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Remover">
                        <IconButton
                          aria-label={`Remover ${item.subject?.name}`}
                          size="small"
                          onClick={() => setDeletingItem(item)}
                        >
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

      <TurmaSubjectFormDialog
        open={formOpen}
        turmaId={numericTurmaId}
        item={editingItem}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Remover disciplina"
        description={`Tem certeza que deseja remover ${deletingItem?.subject?.name} desta turma?`}
        confirmLabel="Remover"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />

      <TurmaScheduleManagerDialog
        open={Boolean(scheduleTarget)}
        turmaSubject={scheduleTarget}
        onClose={() => setScheduleTarget(null)}
      />
    </Box>
  );
}
