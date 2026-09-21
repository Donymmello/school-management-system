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
import { createAttendance, updateAttendance } from "../../api/attendance.js";
import { getErrorMessage } from "../../api/errors.js";
import StudentPicker from "../../components/StudentPicker.jsx";

const STATUS_LABELS = { PRESENT: "Presente", ABSENT: "Ausente", LATE: "Atrasado", JUSTIFIED: "Falta justificada" };

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = { studentId: "", date: todayIso(), status: "PRESENT" };

// record === null → modo criação. record preenchido → modo edição (aluno e
// data não podem ser trocados, só o status).
export default function AttendanceFormDialog({ open, record, onClose, onSaved }) {
  const isEditing = Boolean(record);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      record
        ? { studentId: record.studentId, date: record.date, status: record.status }
        : emptyForm
    );
  }, [open, record]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateAttendance(record.id, { status: form.status });
      } else {
        await createAttendance(form);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a frequência."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar frequência" : "Registrar frequência"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StudentPicker
                value={form.studentId}
                onChange={(id) => setForm((prev) => ({ ...prev, studentId: id }))}
                required
                autoFocus
                disabled={isEditing}
                selectedLabel={record?.student?.name || ""}
                helperText={isEditing ? "Não pode ser alterado depois de criado" : undefined}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data"
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                fullWidth
                required
                disabled={isEditing}
                InputLabelProps={{ shrink: true }}
                helperText={isEditing ? "Não pode ser alterada depois de criada" : undefined}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={handleChange("status")}
                fullWidth
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
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
