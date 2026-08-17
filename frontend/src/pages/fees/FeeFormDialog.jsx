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
import { createFee, updateFee } from "../../api/fees.js";
import { listStudents } from "../../api/students.js";
import { getErrorMessage } from "../../api/errors.js";

const emptyForm = { studentId: "", description: "", amount: "", dueDate: "", notes: "" };

// fee === null → modo criação. fee preenchido → modo edição (aluno não pode
// ser trocado depois de lançado, mesmo padrão de Notas/Frequência).
export default function FeeFormDialog({ open, fee, onClose, onSaved }) {
  const isEditing = Boolean(fee);
  const [form, setForm] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      fee
        ? {
            studentId: fee.studentId,
            description: fee.description,
            amount: fee.amount,
            dueDate: fee.dueDate,
            notes: fee.notes || "",
          }
        : emptyForm
    );
    listStudents().then(setStudents).catch(() => setStudents([]));
  }, [open, fee]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const amount = Number(form.amount);
      if (isEditing) {
        await updateFee(fee.id, {
          description: form.description,
          amount,
          dueDate: form.dueDate,
          notes: form.notes || null,
        });
      } else {
        await createFee({ ...form, amount });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a propina."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar propina" : "Lançar propina"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Aluno"
                value={form.studentId}
                onChange={handleChange("studentId")}
                fullWidth
                required
                autoFocus
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterado depois de lançado" : undefined}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} {s.studentCode ? `(${s.studentCode})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={form.description}
                onChange={handleChange("description")}
                fullWidth
                required
                helperText='Ex: "Mensalidade Março/2026"'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Valor"
                type="number"
                value={form.amount}
                onChange={handleChange("amount")}
                fullWidth
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vencimento"
                type="date"
                value={form.dueDate}
                onChange={handleChange("dueDate")}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                value={form.notes}
                onChange={handleChange("notes")}
                fullWidth
                multiline
                minRows={2}
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
