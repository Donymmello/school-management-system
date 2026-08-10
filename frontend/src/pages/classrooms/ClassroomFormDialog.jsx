import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { createClassroom, updateClassroom } from "../../api/classrooms.js";
import { getErrorMessage } from "../../api/errors.js";

const TYPE_LABELS = {
  NORMAL: "Sala comum",
  LAB: "Laboratório",
  AUDITORIUM: "Auditório",
  OFFICE: "Gabinete",
  OTHER: "Outro",
};

const emptyForm = { name: "", block: "", capacity: 30, type: "NORMAL", active: true };

// classroom === null → modo criação. classroom preenchido → modo edição.
export default function ClassroomFormDialog({ open, classroom, onClose, onSaved }) {
  const isEditing = Boolean(classroom);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      classroom
        ? {
            name: classroom.name || "",
            block: classroom.block || "",
            capacity: classroom.capacity ?? 30,
            type: classroom.type || "NORMAL",
            active: classroom.active ?? true,
          }
        : emptyForm
    );
  }, [open, classroom]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) || 30 };
      if (isEditing) await updateClassroom(classroom.id, payload);
      else await createClassroom(payload);
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bloco"
                value={form.block}
                onChange={handleChange("block")}
                fullWidth
                helperText="Ex: A, B, Anexo…"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Tipo"
                value={form.type}
                onChange={handleChange("type")}
                fullWidth
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacidade"
                type="number"
                value={form.capacity}
                onChange={handleChange("capacity")}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.active}
                      onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                    />
                  }
                  label="Ativa"
                />
              </Grid>
            )}
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
