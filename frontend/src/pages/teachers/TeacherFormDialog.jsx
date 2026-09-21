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
import { createTeacher, updateTeacher } from "../../api/teachers.js";
import { listSubjects } from "../../api/subjects.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { name: "", email: "", password: "", subject: "" };

// teacher === null → modo criação. teacher preenchido → modo edição.
export default function TeacherFormDialog({ open, teacher, onClose, onSaved }) {
  const isEditing = Boolean(teacher);
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      teacher
        ? {
            name: teacher.name || "",
            email: teacher.email || "",
            password: "",
            subject: teacher.subject || "",
          }
        : emptyForm
    );
    listSubjects()
      .then(setSubjects)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as disciplinas.")));
  }, [open, teacher]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        const { name, subject, email } = form;
        await updateTeacher(teacher.id, { name, subject, email });
      } else {
        await createTeacher(form);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o professor."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar professor" : "Novo professor"}</DialogTitle>
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
                label="Nome completo"
                value={form.name}
                onChange={handleChange("name")}
                fullWidth
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                fullWidth
                required
              />
            </Grid>
            {!isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Senha inicial"
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  fullWidth
                  required
                  autoComplete="new-password"
                  helperText="O professor pode trocar depois do primeiro acesso."
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Disciplina principal"
                value={form.subject}
                onChange={handleChange("subject")}
                fullWidth
                helperText="Apenas descritivo. Quem leciona o quê define-se em Turmas → Disciplinas."
              >
                <MenuItem value="">— Nenhuma —</MenuItem>
                {/* Valor antigo escrito à mão que já não casa com nenhuma
                    disciplina: entra na lista para não desaparecer em silêncio
                    ao guardar. */}
                {form.subject && !subjects.some((s) => s.name === form.subject) && (
                  <MenuItem value={form.subject}>{form.subject} (fora da lista)</MenuItem>
                )}
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
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
