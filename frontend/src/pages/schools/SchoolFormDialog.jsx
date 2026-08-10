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
import { createSchool, updateSchool } from "../../api/schools.js";
import { getErrorMessage } from "../../api/errors.js";

const PLAN_LABELS = { FREE: "Grátis", BASIC: "Básico", PREMIUM: "Premium" };
const STATUS_LABELS = { ACTIVE: "Ativa", INACTIVE: "Inativa (bloqueia login)" };
const ACADEMIC_MODEL_LABELS = {
  SECONDARY: "Ensino secundário (turma fixa por série)",
  HIGHER_ED: "Técnico/Superior (créditos e ofertas de curso)",
};

const emptyForm = {
  name: "",
  address: "",
  email: "",
  slug: "",
  plan: "FREE",
  academicModel: "",
  status: "ACTIVE",
};

// school === null → modo criação. school preenchido → modo edição (slug não
// pode ser trocado depois de criado).
export default function SchoolFormDialog({ open, school, onClose, onSaved }) {
  const isEditing = Boolean(school);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      school
        ? {
            name: school.name || "",
            address: school.address || "",
            email: school.email || "",
            slug: school.slug || "",
            plan: school.plan || "FREE",
            academicModel: school.academicModel || "",
            status: school.status || "ACTIVE",
          }
        : emptyForm
    );
  }, [open, school]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        const { name, address, email, plan, status } = form;
        await updateSchool(school.id, { name, address, email, plan, status });
      } else {
        const { name, address, email, slug, plan, academicModel } = form;
        await createSchool({ name, address, email, slug, plan, academicModel });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a escola."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar escola" : "Nova escola"}</DialogTitle>
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
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Endereço"
                value={form.address}
                onChange={handleChange("address")}
                fullWidth
                required
              />
            </Grid>
            {!isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Slug"
                  value={form.slug}
                  onChange={handleChange("slug")}
                  fullWidth
                  required
                  helperText="Identificador único, ex: escola-sao-joao"
                />
              </Grid>
            )}
            {!isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Tipo de instituição"
                  value={form.academicModel}
                  onChange={handleChange("academicModel")}
                  fullWidth
                  required
                  helperText="Não pode ser alterado depois de criado"
                >
                  {Object.entries(ACADEMIC_MODEL_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tipo de instituição"
                  value={ACADEMIC_MODEL_LABELS[form.academicModel] || form.academicModel}
                  fullWidth
                  disabled
                  helperText="Fixo desde o cadastro"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField select label="Plano" value={form.plan} onChange={handleChange("plan")} fullWidth>
                {Object.entries(PLAN_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {isEditing && (
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
