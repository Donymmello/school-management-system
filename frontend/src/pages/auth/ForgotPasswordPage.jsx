import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import { forgotPassword } from "../../api/auth.js";
import { getErrorMessage } from "../../api/errors.js";
import AuthCard from "./AuthCard.jsx";

// Pede o email e dispara o pedido de reset. O backend sempre devolve a
// mesma mensagem genérica (exista o email ou não) — não dá pra usar isso
// pra descobrir quem tem conta no sistema, então a tela também não
// diferencia "enviado" de "não encontrado".
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível processar o pedido."));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Verifique seu email">
        <Alert severity="success" sx={{ mb: 2 }}>
          Se o email {email} estiver cadastrado, você vai receber um link para redefinir a senha.
          O link expira em 15 minutos.
        </Alert>
        <Link component={RouterLink} to="/login" variant="body2">
          Voltar para o login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Esqueci minha senha" subtitle="Informe o email da sua conta para receber um link de redefinição.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          autoFocus
          autoComplete="email"
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Enviando…" : "Enviar link de redefinição"}
        </Button>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Lembrou a senha?{" "}
          </Typography>
          <Link component={RouterLink} to="/login" variant="body2">
            Voltar para o login
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
