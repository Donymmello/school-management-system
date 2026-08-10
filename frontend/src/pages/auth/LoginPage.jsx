import React, { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Link, TextField } from "@mui/material";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/errors.js";
import AuthCard from "./AuthCard.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = new URLSearchParams(location.search).get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar. Confira email e senha."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse o sistema de gestão da sua escola.">
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
        <TextField
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          autoComplete="current-password"
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={submitting}
          sx={{ mt: 2 }}
        >
          {submitting ? "Entrando…" : "Entrar"}
        </Button>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/registrar-escola" variant="body2">
            Sua escola ainda não tem conta? Cadastre-se
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
