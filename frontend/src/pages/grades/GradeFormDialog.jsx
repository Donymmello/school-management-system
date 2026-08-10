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
import { createGrade, updateGrade } from "../../api/grades.js";
import { listStudents } from "../../api/students.js";
import { listTeachers } from "../../api/teachers.js";
import { listSubjects } from "../../api/subjects.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { studentId: "", teacherId: "", subjectId: "", score: "", term: "" };

// grade === null → modo criação. grade preenchido → modo edição (só nota e
// período podem ser alterados depois de lançados).
export default function GradeFormDialog({ open, grade, onClose, onSaved }) {
  const isEditing = Boolean(grade);
  const [form, setForm] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      grade
        ? {
            studentId: grade.studentId,
            teacherId: grade.teacherId,
            subjectId: grade.subjectId,
            score: grade.score,
            term: grade.term,
          }
        : emptyForm
    );
    listStudents().then(setStudents).catch(() => setStudents([]));
    listTeachers().then(setTeachers).catch(() => setTeachers([]));
    listSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, [open, grade]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const score = Number(form.score);
      if (isEditing) {
        await updateGrade(grade.id, { score, term: form.term });
      } else {
        await createGrade({ ...form, score });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a nota."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar nota" : "Lançar nota"}</DialogTitle>
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
                label="Aluno"
                value={form.studentId}
                onChange={handleChange("studentId")}
                fullWidth
                required
                autoFocus
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterado depois de lançado" : undefined}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} {s.studentCode ? `(${s.studentCode})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Disciplina"
                value={form.subjectId}
                onChange={handleChange("subjectId")}
                fullWidth
                required
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterada depois de lançada" : undefined}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Professor"
                value={form.teacherId}
                onChange={handleChange("teacherId")}
                fullWidth
                required
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterado depois de lançado" : undefined}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Período"
                value={form.term}
                onChange={handleChange("term")}
                fullWidth
                required
                helperText='Ex: "2026-S1", "1º trimestre"'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nota"
                type="number"
                value={form.score}
                onChange={handleChange("score")}
                fullWidth
                required
                inputProps={{ step: "0.1" }}
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
