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
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { deleteSubject, listSubjects } from "../../api/subjects.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import SubjectFormDialog from "./SubjectFormDialog.jsx";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function SubjectsListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubjects(await listSubjects());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as disciplinas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingSubject(null);
    setFormOpen(true);
  }

  function openEdit(subject) {
    setEditingSubject(subject);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteSubject(deletingSubject.id);
      setDeletingSubject(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a disciplina."));
      setDeletingSubject(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Disciplinas
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nova disciplina
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de disciplinas">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Carga horária</TableCell>
              <TableCell>Status</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canManage ? 6 : 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && subjects.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5}>
                  <Box textAlign="center" py={6} role="status">
                    <MenuBookOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma disciplina cadastrada
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Nova disciplina" para cadastrar a primeira.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              subjects.map((subject) => (
                <TableRow key={subject.id} hover>
                  <TableCell>{subject.code || "—"}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.level || "—"}</TableCell>
                  <TableCell>{subject.workloadHours ? `${subject.workloadHours}h` : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={subject.active === false ? "Inativa" : "Ativa"}
                      color={subject.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Editar ${subject.name}`}
                        onClick={() => openEdit(subject)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Excluir ${subject.name}`}
                        onClick={() => setDeletingSubject(subject)}
                        size="small"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SubjectFormDialog
        open={formOpen}
        subject={editingSubject}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingSubject)}
        title="Excluir disciplina"
        description={`Tem certeza que deseja excluir ${deletingSubject?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingSubject(null)}
      />
    </Box>
  );
}
