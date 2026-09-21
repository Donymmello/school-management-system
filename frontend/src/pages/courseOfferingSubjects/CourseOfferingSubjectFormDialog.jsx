import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { createCourseOfferingSubject, updateCourseOfferingSubject } from "../../api/courseOfferingSubjects.js";
import { listSubjects } from "../../api/subjects.js";
import { listTeachers } from "../../api/teachers.js";
import { getErrorMessage } from "../../api/errors.js";

const STATUS_OPTIONS = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELED"];
const STATUS_LABELS = { PLANNED: "Planejada", ACTIVE: "Ativa", COMPLETED: "Concluída", CANCELED: "Cancelada" };

const emptyForm = { subjectId: "", teacherId: "", weeklyHours: 4, startDate: "", endDate: "", status: "PLANNED" };

// item === null → modo criação. item preenchido → modo edição (disciplina
// não pode ser trocada depois — só professor/carga/datas/status).
export default function CourseOfferingSubjectFormDialog({ open, courseOfferingId, item, onClose, onSaved }) {
  const isEditing = Boolean(item);
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      item
        ? {
            subjectId: item.subjectId,
            teacherId: item.teacherId || "",
            weeklyHours: item.weeklyHours,
            startDate: item.startDate || "",
            endDate: item.endDate || "",
            status: item.status,
          }
        : emptyForm
    );
    listSubjects()
      .then(setSubjects)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as disciplinas.")));
    listTeachers()
      .then(setTeachers)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os professores.")));
  }, [open, item]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        teacherId: form.teacherId || null,
        weeklyHours: Number(form.weeklyHours) || 4,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (isEditing) {
        await updateCourseOfferingSubject(item.id, { ...payload, status: form.status });
      } else {
        await createCourseOfferingSubject({ courseOfferingId, subjectId: form.subjectId, ...payload });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a disciplina da oferta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar disciplina da oferta" : "Adicionar disciplina à oferta"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Disciplina"
                value={form.subjectId}
                onChange={handleChange("subjectId")}
                fullWidth
                required
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterada depois de criada" : undefined}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Professor"
                value={form.teacherId}
                onChange={handleChange("teacherId")}
                fullWidth
                helperText="Opcional — pode ser atribuído depois"
              >
                <MenuItem value="">— Sem professor atribuído —</MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={isEditing ? 4 : 6}>
              <TextField
                label="Carga horária semanal"
                type="number"
                value={form.weeklyHours}
                onChange={handleChange("weeklyHours")}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12} sm={4}>
                <TextField select label="Status" value={form.status} onChange={handleChange("status")} fullWidth>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={isEditing ? 4 : 6}>
              <TextField
                label="Início"
                type="date"
                value={form.startDate || ""}
                onChange={handleChange("startDate")}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={isEditing ? 4 : 6}>
              <TextField
                label="Fim"
                type="date"
                value={form.endDate || ""}
                onChange={handleChange("endDate")}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
