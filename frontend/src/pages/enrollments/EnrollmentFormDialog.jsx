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
import { enrollStudent } from "../../api/enrollments.js";
import { listStudents } from "../../api/students.js";
import { listCourseOfferings } from "../../api/courseOfferings.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { studentId: "", courseOfferingId: "" };

export default function EnrollmentFormDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(emptyForm);
    listStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
    listCourseOfferings()
      .then((all) => setOfferings(all.filter((o) => o.active !== false)))
      .catch(() => setOfferings([]));
  }, [open]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await enrollStudent(form);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar a matrícula."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nova matrícula</DialogTitle>
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
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} {s.studentCode ? `(${s.studentCode})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Oferta de curso"
                value={form.courseOfferingId}
                onChange={handleChange("courseOfferingId")}
                fullWidth
                required
                helperText={offerings.length === 0 ? "Nenhuma oferta ativa — cadastre uma primeiro." : undefined}
              >
                {offerings.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.code} — {o.course?.displayName}
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
            {submitting ? "Salvando…" : "Matricular"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
