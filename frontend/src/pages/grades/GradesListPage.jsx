import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import { deleteGrade, listGrades } from "../../api/grades.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import GradeFormDialog from "./GradeFormDialog.jsx";

const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];
const READ_ONLY_ROLES = ["STUDENT"];

export default function GradesListPage() {
  const { user } = useAuth();
  const canDelete = DELETE_ROLES.includes(user?.role);
  // Portal do aluno: STUDENT só lê as próprias notas (auto-escopado no
  // backend) — sem criar/editar/excluir (ver docs/project-rules.md, seção 6,
  // item 5).
  const readOnly = READ_ONLY_ROLES.includes(user?.role);

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [deletingGrade, setDeletingGrade] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGrades(await listGrades());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as notas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingGrade(null);
    setFormOpen(true);
  }

  function openEdit(grade) {
    setEditingGrade(grade);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteGrade(deletingGrade.id);
      setDeletingGrade(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a nota."));
      setDeletingGrade(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          {readOnly ? "Minhas notas" : "Notas"}
        </Typography>
        {!readOnly && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Lançar nota
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de notas">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Disciplina</TableCell>
              <TableCell>Professor</TableCell>
              <TableCell>Período</TableCell>
              <TableCell>Nota</TableCell>
              {!readOnly && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: readOnly ? 5 : 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && grades.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={readOnly ? 5 : 6}>
                  <Box textAlign="center" py={6} role="status">
                    <GradeOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma nota lançada
                    </Typography>
                    {!readOnly && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Lançar nota" para começar.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              grades.map((grade) => (
                <TableRow key={grade.id} hover>
                  <TableCell>{grade.student?.name || "—"}</TableCell>
                  <TableCell>{grade.subject?.name || "—"}</TableCell>
                  <TableCell>{grade.teacher?.name || "—"}</TableCell>
                  <TableCell>{grade.term}</TableCell>
                  <TableCell>{grade.score}</TableCell>
                  {!readOnly && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Editar nota de ${grade.student?.name}`}
                        onClick={() => openEdit(grade)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          aria-label={`Excluir nota de ${grade.student?.name}`}
                          onClick={() => setDeletingGrade(grade)}
                          size="small"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GradeFormDialog
        open={formOpen}
        grade={editingGrade}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingGrade)}
        title="Excluir nota"
        description={`Tem certeza que deseja excluir essa nota de ${deletingGrade?.student?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingGrade(null)}
      />
    </Box>
  );
}
