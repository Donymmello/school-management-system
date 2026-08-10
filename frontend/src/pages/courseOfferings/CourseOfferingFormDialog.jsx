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
import { createCourseOffering, updateCourseOffering } from "../../api/courseOfferings.js";
import { listCourses } from "../../api/courses.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { courseId: "", academicYear: new Date().getFullYear(), semester: "S1", capacity: 30 };

// offering === null → modo criação. offering preenchido → modo edição
// (curso não pode ser trocado depois de criada a oferta).
export default function CourseOfferingFormDialog({ open, offering, onClose, onSaved }) {
  const isEditing = Boolean(offering);
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      offering
        ? {
            courseId: offering.courseId,
            academicYear: offering.academicYear,
            semester: offering.semester,
            capacity: offering.capacity,
          }
        : emptyForm
    );
    listCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [open, offering]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        academicYear: Number(form.academicYear),
        capacity: Number(form.capacity) || 30,
      };
      if (isEditing) {
        const { courseId, ...editable } = payload;
        await updateCourseOffering(offering.id, editable);
      } else {
        await createCourseOffering(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a oferta de curso."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar oferta de curso" : "Nova oferta de curso"}</DialogTitle>
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
                label="Curso"
                value={form.courseId}
                onChange={handleChange("courseId")}
                fullWidth
                required
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterado depois de criado" : undefined}
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.displayName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Ano letivo"
                type="number"
                value={form.academicYear}
                onChange={handleChange("academicYear")}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Semestre"
                value={form.semester}
                onChange={handleChange("semester")}
                fullWidth
              >
                <MenuItem value="S1">1º semestre</MenuItem>
                <MenuItem value="S2">2º semestre</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Vagas"
                type="number"
                value={form.capacity}
                onChange={handleChange("capacity")}
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
