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
  Switch,
  TextField,
} from "@mui/material";
import { createSubject, updateSubject } from "../../api/subjects.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = {
  name: "",
  description: "",
  level: "",
  workloadHours: "",
  credits: "",
  active: true,
};

// subject === null → modo criação. subject preenchido → modo edição.
export default function SubjectFormDialog({ open, subject, onClose, onSaved }) {
  const isEditing = Boolean(subject);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      subject
        ? {
            name: subject.name || "",
            description: subject.description || "",
            level: subject.level || "",
            workloadHours: subject.workloadHours ?? "",
            credits: subject.credits ?? "",
            active: subject.active ?? true,
          }
        : emptyForm
    );
  }, [open, subject]);

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
        workloadHours: form.workloadHours === "" ? null : Number(form.workloadHours),
        credits: form.credits === "" ? null : Number(form.credits),
      };
      if (isEditing) await updateSubject(subject.id, payload);
      else await createSubject(payload);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a disciplina."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar disciplina" : "Nova disciplina"}</DialogTitle>
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
                label="Nível"
                value={form.level}
                onChange={handleChange("level")}
                fullWidth
                helperText="Ex: Básico, Intermediário…"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Carga horária"
                type="number"
                value={form.workloadHours}
                onChange={handleChange("workloadHours")}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Créditos"
                type="number"
                value={form.credits}
                onChange={handleChange("credits")}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={form.description}
                onChange={handleChange("description")}
                fullWidth
                multiline
                minRows={2}
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
