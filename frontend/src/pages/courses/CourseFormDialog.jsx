import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { createCourse, updateCourse } from "../../api/courses.js";
import { getErrorMessage } from "../../api/errors.js";

const NAME_LABELS = {
  SOFTWARE_ENGINEERING: "Engenharia de Software",
  CIVIL_ENGINEERING: "Engenharia Civil",
  COMPUTER_ENGINEERING: "Engenharia Informática",
  DATA_SCIENCE: "Ciência de Dados",
  ACCOUNTING: "Contabilidade",
  FINANCE: "Finanças",
  MEDICINE: "Medicina",
  NURSING: "Enfermagem",
  MATHEMATICS: "Matemática",
  PHYSICS: "Física",
  OTHER: "Outro",
};

const FACULTY_LABELS = {
  ENGINEERING: "Engenharia",
  ECONOMICS: "Economia",
  MEDICINE: "Medicina",
  SCIENCES: "Ciências",
  OTHER: "Outra",
};

const DEGREE_LABELS = {
  CERTIFICATE: "Certificado",
  DIPLOMA: "Diploma",
  BACHELOR: "Licenciatura",
  MASTER: "Mestrado",
  PHD: "Doutorado",
};

const emptyForm = {
  name: "SOFTWARE_ENGINEERING",
  displayName: "",
  faculty: "ENGINEERING",
  durationYears: "",
  degreeLevel: "BACHELOR",
  active: true,
};

// course === null → modo criação. course preenchido → modo edição.
// name/faculty definem o código gerado e não são editáveis depois de criado.
export default function CourseFormDialog({ open, course, onClose, onSaved }) {
  const isEditing = Boolean(course);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      course
        ? {
            name: course.name || "SOFTWARE_ENGINEERING",
            displayName: course.displayName || "",
            faculty: course.faculty || "ENGINEERING",
            durationYears: course.durationYears ?? "",
            degreeLevel: course.degreeLevel || "BACHELOR",
            active: course.active ?? true,
          }
        : emptyForm
    );
  }, [open, course]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateCourse(course.id, {
          displayName: form.displayName,
          durationYears: form.durationYears === "" ? null : Number(form.durationYears),
          degreeLevel: form.degreeLevel,
          active: form.active,
        });
      } else {
        await createCourse({
          ...form,
          durationYears: form.durationYears === "" ? null : Number(form.durationYears),
        });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o curso."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Editar curso" : "Novo curso"}</DialogTitle>
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
                label="Nome de exibição"
                value={form.displayName}
                onChange={handleChange("displayName")}
                fullWidth
                required
                autoFocus
                helperText='Ex: "Engenharia de Software — Noturno"'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Área"
                value={form.name}
                onChange={handleChange("name")}
                fullWidth
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterada depois de criado" : undefined}
              >
                {Object.entries(NAME_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Faculdade"
                value={form.faculty}
                onChange={handleChange("faculty")}
                fullWidth
                disabled={isEditing}
                helperText={isEditing ? "Não pode ser alterada depois de criada" : undefined}
              >
                {Object.entries(FACULTY_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Grau"
                value={form.degreeLevel}
                onChange={handleChange("degreeLevel")}
                fullWidth
              >
                {Object.entries(DEGREE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duração (anos)"
                type="number"
                value={form.durationYears}
                onChange={handleChange("durationYears")}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.active}
                      onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                    />
                  }
                  label="Ativo"
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
