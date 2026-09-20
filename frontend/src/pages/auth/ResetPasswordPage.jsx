import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Link, TextField } from "@mui/material";
import { resetPassword } from "../../api/auth.js";
import { getErrorMessage } from "../../api/errors.js";
import AuthCard from "./AuthCard.jsx";

const MIN_LENGTH = 6;

// Segunda metade do fluxo de esqueci minha senha: cola o token (recebido
// por email, ou colado direto na URL) + escolhe a nova senha. Token
// expira em 15 minutos (ver backend/controllers/auth.controller.js).
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`A nova senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível redefinir a senha. O link pode ter expirado."));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="Senha redefinida">
        <Alert severity="success" sx={{ mb: 2 }}>
          Sua senha foi alterada com sucesso. Já pode entrar com a nova senha.
        </Alert>
        <Button component={RouterLink} to="/login" variant="contained" fullWidth size="large">
          Ir para o login
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Redefinir senha" subtitle="Cole o token recebido por email e escolha a nova senha.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}
        <TextField
          label="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          fullWidth
          required
          autoFocus={!tokenFromUrl}
          margin="normal"
          helperText="Veio no link do email de redefinição."
        />
        <TextField
          label="Nova senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          autoComplete="new-password"
          margin="normal"
          autoFocus={Boolean(tokenFromUrl)}
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          autoComplete="new-password"
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Redefinindo…" : "Redefinir senha"}
        </Button>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Voltar para o login
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
