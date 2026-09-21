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
import { createTurmaSubject, updateTurmaSubject } from "../../api/turmaSubjects.js";
import { listSubjects } from "../../api/subjects.js";
import { listTeachers } from "../../api/teachers.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { subjectId: "", teacherId: "", weeklyHours: 2 };

// item === null → modo criação. item preenchido → modo edição (disciplina
// não pode ser trocada depois — só professor/carga).
export default function TurmaSubjectFormDialog({ open, turmaId, item, onClose, onSaved }) {
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
        ? { subjectId: item.subjectId, teacherId: item.teacherId || "", weeklyHours: item.weeklyHours }
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
        weeklyHours: Number(form.weeklyHours) || 2,
      };
      if (isEditing) {
        await updateTurmaSubject(item.id, payload);
      } else {
        await createTurmaSubject({ turmaId, subjectId: form.subjectId, ...payload });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a disciplina da turma."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar disciplina da turma" : "Adicionar disciplina à turma"}</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Carga horária semanal"
                type="number"
                value={form.weeklyHours}
                onChange={handleChange("weeklyHours")}
                fullWidth
                inputProps={{ min: 1 }}
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
