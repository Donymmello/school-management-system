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
import { createStudent, updateStudent } from "../../api/students.js";
import { listTurmas } from "../../api/turmas.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Códigos têm de bater com ID_DOCUMENT_TYPES em backend/models/student.js —
// é de lá que vem o validate: { isIn } que recusa qualquer outro valor.
const ID_DOCUMENT_TYPES = [
  { value: "BI", label: "Bilhete de Identidade" },
  { value: "PASSPORT", label: "Passaporte" },
  { value: "OTHER", label: "Outro" },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  birthday: "",
  grade: "",
  telephone: "",
  idCard: "",
  idNumber: "",
  notes: "",
  turmaId: "",
};

// student === null → modo criação. student preenchido → modo edição.
export default function StudentFormDialog({ open, student, onClose, onSaved }) {
  const { user } = useAuth();
  const isSecondary = user?.school?.academicModel === "SECONDARY";
  const isEditing = Boolean(student);
  const [form, setForm] = useState(emptyForm);
  const [turmas, setTurmas] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      student
        ? {
            name: student.name || "",
            email: student.email || "",
            password: "",
            birthday: student.birthday || "",
            grade: student.grade || "",
            telephone: student.telephone || "",
            idCard: student.idCard || "",
            idNumber: student.idNumber || "",
            notes: student.notes ?? "",
            turmaId: student.turmaId || "",
          }
        : emptyForm
    );
    if (isSecondary) {
      listTurmas()
        .then(setTurmas)
        .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as turmas.")));
    }
  }, [open, student, isSecondary]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        const { password, ...editable } = form;
        await updateStudent(student.id, {
          ...editable,
          notes: editable.notes === "" ? null : Number(editable.notes),
          turmaId: editable.turmaId || null,
        });
      } else {
        await createStudent({ ...form, turmaId: form.turmaId || null });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o aluno."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar aluno" : "Novo aluno"}</DialogTitle>
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
                  helperText="O aluno pode trocar depois do primeiro acesso."
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data de nascimento"
                type="date"
                value={form.birthday}
                onChange={handleChange("birthday")}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Série/turma (texto livre)"
                value={form.grade}
                onChange={handleChange("grade")}
                fullWidth
              />
            </Grid>
            {isSecondary && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Turma"
                  value={form.turmaId}
                  onChange={handleChange("turmaId")}
                  fullWidth
                  helperText="Opcional — vincula o aluno a uma turma cadastrada"
                >
                  <MenuItem value="">— Sem turma —</MenuItem>
                  {turmas.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefone"
                value={form.telephone}
                onChange={handleChange("telephone")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Tipo de documento"
                value={form.idCard}
                onChange={handleChange("idCard")}
                fullWidth
              >
                <MenuItem value="">— Sem documento —</MenuItem>
                {ID_DOCUMENT_TYPES.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Número do documento"
                value={form.idNumber}
                onChange={handleChange("idNumber")}
                fullWidth
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nota"
                  type="number"
                  value={form.notes}
                  onChange={handleChange("notes")}
                  fullWidth
                  inputProps={{ step: "0.1" }}
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
