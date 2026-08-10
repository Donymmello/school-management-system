import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { deleteStudent, listStudents } from "../../api/students.js";
import { getErrorMessage } from "../../api/errors.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import StudentFormDialog from "./StudentFormDialog.jsx";

export default function StudentsListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await listStudents());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os alunos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingStudent(null);
    setFormOpen(true);
  }

  function openEdit(student) {
    setEditingStudent(student);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o aluno."));
      setDeletingStudent(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Alunos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Novo aluno
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de alunos">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Série/turma</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && students.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box textAlign="center" py={6} role="status">
                    <GroupsOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum aluno cadastrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clique em "Novo aluno" para cadastrar o primeiro.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.studentCode}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.grade || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={student.user?.active === false ? "Inativo" : "Ativo"}
                      color={student.user?.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar ${student.name}`}
                      onClick={() => openEdit(student)}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`Excluir ${student.name}`}
                      onClick={() => setDeletingStudent(student)}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StudentFormDialog
        open={formOpen}
        student={editingStudent}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        title="Excluir aluno"
        description={`Tem certeza que deseja excluir ${deletingStudent?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingStudent(null)}
      />
    </Box>
  );
}
