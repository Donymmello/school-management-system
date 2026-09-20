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
import { createAssessment, updateAssessment } from "../../api/assessments.js";
import { getErrorMessage } from "../../api/errors.js";

const TYPE_OPTIONS = ["TEST", "ASSIGNMENT", "PROJECT", "EXAM"];
const TYPE_LABELS = { TEST: "Teste", ASSIGNMENT: "Trabalho", PROJECT: "Projeto", EXAM: "Exame" };

const CATEGORY_OPTIONS = ["CONTINUOUS", "EXAM"];
const CATEGORY_LABELS = { CONTINUOUS: "Avaliação contínua", EXAM: "Exame final" };
const CATEGORY_HELP = {
  CONTINUOUS: "Entra no cálculo da nota contínua, ponderada pelo peso abaixo.",
  EXAM: "Nota de exame — usada no resultado final quando o aluno não é dispensado.",
};

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "CLOSED"];
const STATUS_LABELS = { DRAFT: "Rascunho", PUBLISHED: "Publicada", CLOSED: "Encerrada" };

const emptyForm = {
  title: "",
  type: "TEST",
  category: "CONTINUOUS",
  maxScore: 20,
  weight: 10,
  assessmentDate: "",
  description: "",
  status: "DRAFT",
};

// assessment === null → modo criação. assessment preenchido → modo edição
// (courseOfferingSubjectId não é editável).
export default function AssessmentFormDialog({ open, courseOfferingSubjectId, assessment, onClose, onSaved }) {
  const isEditing = Boolean(assessment);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      assessment
        ? {
            title: assessment.title,
            type: assessment.type,
            category: assessment.category,
            maxScore: assessment.maxScore,
            weight: assessment.weight,
            assessmentDate: assessment.assessmentDate,
            description: assessment.description || "",
            status: assessment.status,
          }
        : emptyForm
    );
  }, [open, assessment]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        maxScore: Number(form.maxScore),
        weight: Number(form.weight),
      };
      if (isEditing) {
        await updateAssessment(assessment.id, payload);
      } else {
        await createAssessment({ ...payload, courseOfferingSubjectId });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a avaliação."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar avaliação" : "Nova avaliação"}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Título" value={form.title} onChange={handleChange("title")} fullWidth required autoFocus />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Tipo" value={form.type} onChange={handleChange("type")} fullWidth required>
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categoria"
                value={form.category}
                onChange={handleChange("category")}
                fullWidth
                required
                helperText={CATEGORY_HELP[form.category]}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Nota máxima"
                type="number"
                value={form.maxScore}
                onChange={handleChange("maxScore")}
                fullWidth
                required
                inputProps={{ min: 1, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Peso (%)"
                type="number"
                value={form.weight}
                onChange={handleChange("weight")}
                fullWidth
                required
                inputProps={{ min: 0, max: 100, step: "0.01" }}
                helperText="Soma dos pesos da disciplina não pode passar de 100%"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Data"
                type="date"
                value={form.assessmentDate}
                onChange={handleChange("assessmentDate")}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" value={form.status} onChange={handleChange("status")} fullWidth>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={form.description}
                onChange={handleChange("description")}
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
