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
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import {
  createTurmaSchedule,
  deleteTurmaSchedule,
  listTurmaSchedules,
  updateTurmaSchedule,
} from "../../api/turmaSchedules.js";
import { listClassrooms } from "../../api/classrooms.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

// Espelha authorizeRoles de backend/routes/turmaSchedules.routes.js.
const CAN_MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const CAN_DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS = {
  Monday: "Segunda",
  Tuesday: "Terça",
  Wednesday: "Quarta",
  Thursday: "Quinta",
  Friday: "Sexta",
  Saturday: "Sábado",
};

const emptyForm = { classroomId: "", dayOfWeek: "Monday", startTime: "08:00", endTime: "10:00" };

// Gerencia os horários (TurmaSchedule) de uma disciplina-turma específica
// (turmaSubjectId) — Fase 9a, espelha ScheduleManagerDialog.jsx (HIGHER_ED).
// Diferente daquele, GET /turma-schedules já filtra por turmaSubjectId no
// backend, sem precisar de filtro no cliente (ver api/turmaSchedules.js).
export default function TurmaScheduleManagerDialog({ open, turmaSubject, onClose }) {
  const { user } = useAuth();
  const canManage = CAN_MANAGE_ROLES.includes(user?.role);
  const canDelete = CAN_DELETE_ROLES.includes(user?.role);
  const [schedules, setSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const turmaSubjectId = turmaSubject?.id;

  const load = useCallback(async () => {
    if (!turmaSubjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [scheduleList, classroomList] = await Promise.all([
        listTurmaSchedules(turmaSubjectId),
        listClassrooms(),
      ]);
      setSchedules(scheduleList);
      setClassrooms(classroomList);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os horários."));
    } finally {
      setLoading(false);
    }
  }, [turmaSubjectId]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setEditingId(null);
    load();
  }, [open, load]);

  function startEdit(schedule) {
    setEditingId(schedule.id);
    setForm({
      classroomId: schedule.classroomId || "",
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTurmaSchedule(editingId, form);
      } else {
        await createTurmaSchedule({ ...form, turmaSubjectId });
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o horário."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteTurmaSchedule(deletingSchedule.id);
      setDeletingSchedule(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o horário."));
      setDeletingSchedule(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Horário — {turmaSubject?.subject?.name}
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

        {canManage && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  label="Dia"
                  value={form.dayOfWeek}
                  onChange={handleChange("dayOfWeek")}
                  fullWidth
                  size="small"
                >
                  {DAY_OPTIONS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {DAY_LABELS[d]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Início"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange("startTime")}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Fim"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange("endTime")}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  label="Sala"
                  value={form.classroomId}
                  onChange={handleChange("classroomId")}
                  fullWidth
                  required
                  size="small"
                >
                  {classrooms.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box display="flex" gap={1}>
                  <Button type="submit" variant="contained" size="small" disabled={submitting} startIcon={<AddIcon />}>
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                  {editingId && (
                    <Button size="small" onClick={cancelEdit} disabled={submitting}>
                      Cancelar
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <TableContainer>
          <Table size="small" aria-label="Lista de horários">
            <TableHead>
              <TableRow>
                <TableCell>Dia</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Sala</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && schedules.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      Nenhum horário cadastrado ainda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                schedules.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}</TableCell>
                    <TableCell>{s.startTime}</TableCell>
                    <TableCell>{s.endTime}</TableCell>
                    <TableCell>{s.classroom?.name || "—"}</TableCell>
                    <TableCell align="right">
                      {canManage && (
                        <IconButton aria-label="Editar horário" size="small" onClick={() => startEdit(s)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton aria-label="Excluir horário" size="small" onClick={() => setDeletingSchedule(s)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <ConfirmDialog
        open={Boolean(deletingSchedule)}
        title="Excluir horário"
        description="Tem certeza que deseja excluir este horário? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingSchedule(null)}
      />
    </Dialog>
  );
}
