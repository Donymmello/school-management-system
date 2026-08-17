import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Divider, Link, MenuItem, TextField, Typography } from "@mui/material";
import { registerSchool } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/errors.js";
import AuthCard from "./AuthCard.jsx";

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ACADEMIC_MODEL_LABELS = {
  SECONDARY: "Ensino secundário (turma fixa por série)",
  HIGHER_ED: "Técnico/Superior (créditos e ofertas de curso)",
};

const initialForm = {
  schoolName: "",
  address: "",
  schoolEmail: "",
  slug: "",
  academicModel: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function RegisterSchoolPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field) {
    return (event) => {
      const value = event.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "schoolName" && !slugTouched) next.slug = slugify(value);
        return next;
      });
      if (field === "slug") setSlugTouched(true);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, school, user } = await registerSchool(form);
      setSession(token, { ...user, school });
      navigate("/painel", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível cadastrar a escola."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Cadastrar escola"
      subtitle="Crie a conta da sua escola e o primeiro usuário administrador."
      maxWidth={480}
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary">
          Dados da escola
        </Typography>
        <TextField
          label="Nome da escola"
          value={form.schoolName}
          onChange={handleChange("schoolName")}
          fullWidth
          required
          autoFocus
          margin="dense"
        />
        <TextField
          label="Endereço"
          value={form.address}
          onChange={handleChange("address")}
          fullWidth
          required
          margin="dense"
        />
        <TextField
          label="Email institucional"
          type="email"
          value={form.schoolEmail}
          onChange={handleChange("schoolEmail")}
          fullWidth
          required
          margin="dense"
        />
        <TextField
          label="Identificador (slug)"
          value={form.slug}
          onChange={handleChange("slug")}
          helperText="Usado para identificar sua escola no sistema. Só letras minúsculas, números e hífen."
          fullWidth
          required
          margin="dense"
        />
        <TextField
          select
          label="Tipo de instituição"
          value={form.academicModel}
          onChange={handleChange("academicModel")}
          helperText="Não pode ser alterado depois de cadastrado — escolha o que melhor descreve sua instituição hoje."
          fullWidth
          required
          margin="dense"
        >
          {Object.entries(ACADEMIC_MODEL_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary">
          Administrador da escola
        </Typography>
        <TextField
          label="Nome completo"
          value={form.adminName}
          onChange={handleChange("adminName")}
          fullWidth
          required
          margin="dense"
        />
        <TextField
          label="Email de acesso"
          type="email"
          value={form.adminEmail}
          onChange={handleChange("adminEmail")}
          fullWidth
          required
          margin="dense"
        />
        <TextField
          label="Senha"
          type="password"
          value={form.adminPassword}
          onChange={handleChange("adminPassword")}
          fullWidth
          required
          margin="dense"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting}
          sx={{ mt: 3 }}
        >
          {submitting ? "Cadastrando…" : "Cadastrar escola"}
        </Button>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Já tem conta? Entrar
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
