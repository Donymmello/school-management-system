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
import { createTurma, updateTurma } from "../../api/turmas.js";
import { listClassrooms } from "../../api/classrooms.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { name: "", grade: "", classroomId: "", academicYear: "" };

// turma === null → modo criação. turma preenchido → modo edição.
export default function TurmaFormDialog({ open, turma, onClose, onSaved }) {
  const isEditing = Boolean(turma);
  const [form, setForm] = useState(emptyForm);
  const [classrooms, setClassrooms] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      turma
        ? {
            name: turma.name || "",
            grade: turma.grade || "",
            classroomId: turma.classroomId || "",
            academicYear: turma.academicYear || "",
          }
        : emptyForm
    );
    listClassrooms()
      .then(setClassrooms)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as salas.")));
  }, [open, turma]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        grade: form.grade || null,
        classroomId: form.classroomId || null,
        academicYear: form.academicYear || null,
      };
      if (isEditing) {
        await updateTurma(turma.id, payload);
      } else {
        await createTurma(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a turma."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar turma" : "Nova turma"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome"
                value={form.name}
                onChange={handleChange("name")}
                fullWidth
                required
                autoFocus
                helperText='Ex: "9ºA"'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Série"
                value={form.grade}
                onChange={handleChange("grade")}
                fullWidth
                helperText='Ex: "9º ano"'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Sala principal"
                value={form.classroomId}
                onChange={handleChange("classroomId")}
                fullWidth
                helperText="Opcional"
              >
                <MenuItem value="">— Sem sala fixa —</MenuItem>
                {classrooms.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ano letivo"
                value={form.academicYear}
                onChange={handleChange("academicYear")}
                fullWidth
                helperText='Texto livre, ex: "2026"'
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
