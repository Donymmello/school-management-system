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
  TextField,
} from "@mui/material";
import { createStaff, updateStaff } from "../../api/staff.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { name: "", email: "", password: "", position: "", department: "" };

// staffMember === null → modo criação. staffMember preenchido → modo edição.
export default function StaffFormDialog({ open, staffMember, onClose, onSaved }) {
  const isEditing = Boolean(staffMember);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      staffMember
        ? {
            name: staffMember.name || "",
            email: staffMember.email || "",
            password: "",
            position: staffMember.position || "",
            department: staffMember.department || "",
          }
        : emptyForm
    );
  }, [open, staffMember]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        const { name, email, position, department } = form;
        await updateStaff(staffMember.id, { name, email, position, department });
      } else {
        await createStaff(form);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o colaborador."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar colaborador" : "Novo colaborador"}</DialogTitle>
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
                  helperText="O colaborador pode trocar depois do primeiro acesso."
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cargo"
                value={form.position}
                onChange={handleChange("position")}
                fullWidth
                helperText='Ex: Secretário(a). Padrão "Staff" se deixado em branco.'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Departamento"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
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
