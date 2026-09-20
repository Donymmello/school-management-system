import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Grid, Paper, Skeleton, TextField, Typography } from "@mui/material";
import { getSchool, updateSchool } from "../../api/schools.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

const emptyForm = { name: "", address: "", email: "", currency: "MZN", paymentEntity: "" };

// Self-service pra ADMIN configurar a própria escola (Fase 8, ver
// docs/project-rules.md, seção 6) — sem depender do SUPER_ADMIN pra
// mexer em "/escolas" (rota restrita à plataforma). Só os campos que fazem
// sentido a escola mexer sozinha: nome/endereço/email/moeda/entidade de
// pagamento. plan/status continuam bloqueados pro ADMIN no backend
// (decisão de billing da plataforma, ver school.controller.js updateSchool).
export default function SchoolSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const school = await getSchool(user.schoolId);
      setForm({
        name: school.name || "",
        address: school.address || "",
        email: school.email || "",
        currency: school.currency || "MZN",
        paymentEntity: school.paymentEntity || "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os dados da escola."));
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleCurrencyChange(event) {
    setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updateSchool(user.schoolId, {
        name: form.name,
        address: form.address,
        email: form.email,
        currency: form.currency,
        paymentEntity: form.paymentEntity || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar as configurações."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações da escola
        </Typography>
        <Skeleton variant="rounded" height={320} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações da escola
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Configurações salvas com sucesso.
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 640 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nome" value={form.name} onChange={handleChange("name")} fullWidth required />
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Moeda das propinas"
                value={form.currency}
                onChange={handleCurrencyChange}
                fullWidth
                required
                inputProps={{ maxLength: 3, style: { textTransform: "uppercase" } }}
                helperText='Código de 3 letras, ex: "MZN" (Metical), "USD", "AOA" (Kwanza)'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Entidade de pagamento"
                value={form.paymentEntity}
                onChange={handleChange("paymentEntity")}
                fullWidth
                helperText='Código que a escola divulga junto com a referência de cada propina (ex: "12345"). Deixe em branco pra não gerar entidade.'
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ mt: 3 }}>
            {submitting ? "Salvando…" : "Salvar configurações"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
