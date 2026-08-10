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
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { deleteTeacher, listTeachers } from "../../api/teachers.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import TeacherFormDialog from "./TeacherFormDialog.jsx";

const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function TeachersListPage() {
  const { user } = useAuth();
  const canDelete = DELETE_ROLES.includes(user?.role);

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeachers(await listTeachers());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os professores."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingTeacher(null);
    setFormOpen(true);
  }

  function openEdit(teacher) {
    setEditingTeacher(teacher);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteTeacher(deletingTeacher.id);
      setDeletingTeacher(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o professor."));
      setDeletingTeacher(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Professores
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Novo professor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de professores">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Disciplina</TableCell>
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

            {!loading && teachers.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box textAlign="center" py={6} role="status">
                    <SchoolOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum professor cadastrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clique em "Novo professor" para cadastrar o primeiro.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              teachers.map((teacher) => (
                <TableRow key={teacher.id} hover>
                  <TableCell>{teacher.employeeCode || "—"}</TableCell>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.subject || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={teacher.user?.active === false ? "Inativo" : "Ativo"}
                      color={teacher.user?.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar ${teacher.name}`}
                      onClick={() => openEdit(teacher)}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        aria-label={`Excluir ${teacher.name}`}
                        onClick={() => setDeletingTeacher(teacher)}
                        size="small"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TeacherFormDialog
        open={formOpen}
        teacher={editingTeacher}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingTeacher)}
        title="Excluir professor"
        description={`Tem certeza que deseja excluir ${deletingTeacher?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTeacher(null)}
      />
    </Box>
  );
}
