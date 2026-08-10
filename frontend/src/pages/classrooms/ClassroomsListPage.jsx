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
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import { deleteClassroom, listClassrooms } from "../../api/classrooms.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import ClassroomFormDialog from "./ClassroomFormDialog.jsx";

const TYPE_LABELS = {
  NORMAL: "Sala comum",
  LAB: "Laboratório",
  AUDITORIUM: "Auditório",
  OFFICE: "Gabinete",
  OTHER: "Outro",
};

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

export default function ClassroomsListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [deletingClassroom, setDeletingClassroom] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClassrooms(await listClassrooms());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as turmas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingClassroom(null);
    setFormOpen(true);
  }

  function openEdit(classroom) {
    setEditingClassroom(classroom);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteClassroom(deletingClassroom.id);
      setDeletingClassroom(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a turma."));
      setDeletingClassroom(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Turmas
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nova turma
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de turmas">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Bloco</TableCell>
              <TableCell>Capacidade</TableCell>
              <TableCell>Status</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canManage ? 7 : 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && classrooms.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6}>
                  <Box textAlign="center" py={6} role="status">
                    <MeetingRoomOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma turma cadastrada
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Nova turma" para cadastrar a primeira.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              classrooms.map((classroom) => (
                <TableRow key={classroom.id} hover>
                  <TableCell>{classroom.code}</TableCell>
                  <TableCell>{classroom.name}</TableCell>
                  <TableCell>{TYPE_LABELS[classroom.type] || classroom.type}</TableCell>
                  <TableCell>{classroom.block || "—"}</TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={classroom.active === false ? "Inativa" : "Ativa"}
                      color={classroom.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Editar ${classroom.name}`}
                        onClick={() => openEdit(classroom)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`Excluir ${classroom.name}`}
                        onClick={() => setDeletingClassroom(classroom)}
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

      <ClassroomFormDialog
        open={formOpen}
        classroom={editingClassroom}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingClassroom)}
        title="Excluir turma"
        description={`Tem certeza que deseja excluir ${deletingClassroom?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingClassroom(null)}
      />
    </Box>
  );
}
