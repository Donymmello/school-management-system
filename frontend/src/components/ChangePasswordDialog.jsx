import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { changePassword } from "../api/auth.js";
import { getErrorMessage } from "../api/errors.js";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

// Fecha uma promessa que já existia no formulário de criação de aluno
// ("pode trocar depois do primeiro acesso") mas nunca tinha sido
// implementada — ver docs/project-rules.md, seção 6, item 5. Acessível
// pelo menu do usuário (DashboardLayout), disponível pra qualquer papel
// logado.
export default function ChangePasswordDialog({ open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError(null);
    setSuccess(false);
  }, [open]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (form.newPassword.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("A confirmação não é igual à nova senha.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm(emptyForm);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível trocar a senha."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Trocar senha</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} role="status">
              Senha alterada com sucesso.
            </Alert>
          )}
          <TextField
            label="Senha atual"
            type="password"
            value={form.currentPassword}
            onChange={handleChange("currentPassword")}
            fullWidth
            required
            autoFocus
            autoComplete="current-password"
            margin="dense"
          />
          <TextField
            label="Nova senha"
            type="password"
            value={form.newPassword}
            onChange={handleChange("newPassword")}
            fullWidth
            required
            autoComplete="new-password"
            margin="dense"
            helperText="Mínimo de 6 caracteres."
          />
          <TextField
            label="Confirmar nova senha"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            fullWidth
            required
            autoComplete="new-password"
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={submitting}>
            {success ? "Fechar" : "Cancelar"}
          </Button>
          {!success && (
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Salvando…" : "Trocar senha"}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
