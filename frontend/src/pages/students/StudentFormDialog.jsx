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
import { createStudent, updateStudent } from "../../api/students.js";
import { getErrorMessage } from "../../api/errors.js";

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
};

// student === null → modo criação. student preenchido → modo edição.
export default function StudentFormDialog({ open, student, onClose, onSaved }) {
  const isEditing = Boolean(student);
  const [form, setForm] = useState(emptyForm);
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
          }
        : emptyForm
    );
  }, [open, student]);

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
        });
      } else {
        await createStudent(form);
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
                label="Série/turma"
                value={form.grade}
                onChange={handleChange("grade")}
                fullWidth
              />
            </Grid>
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
                label="Documento de identidade"
                value={form.idCard}
                onChange={handleChange("idCard")}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Número de identificação"
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
