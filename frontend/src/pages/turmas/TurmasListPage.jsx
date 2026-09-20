import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { deleteTurma, listTurmas } from "../../api/turmas.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import TurmaFormDialog from "./TurmaFormDialog.jsx";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function TurmasListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const canDelete = DELETE_ROLES.includes(user?.role);

  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState(null);
  const [deletingTurma, setDeletingTurma] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTurmas(await listTurmas());
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
    setEditingTurma(null);
    setFormOpen(true);
  }

  function openEdit(turma) {
    setEditingTurma(turma);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteTurma(deletingTurma.id);
      setDeletingTurma(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a turma."));
      setDeletingTurma(null);
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
              <TableCell>Nome</TableCell>
              <TableCell>Série</TableCell>
              <TableCell>Sala principal</TableCell>
              <TableCell>Ano letivo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && turmas.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box textAlign="center" py={6} role="status">
                    <GroupsOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
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
              turmas.map((turma) => (
                <TableRow key={turma.id} hover>
                  <TableCell>{turma.name}</TableCell>
                  <TableCell>{turma.grade || "—"}</TableCell>
                  <TableCell>{turma.classroom?.name || "—"}</TableCell>
                  <TableCell>{turma.academicYear || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={turma.active === false ? "Inativa" : "Ativa"}
                      color={turma.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Disciplinas">
                      <IconButton
                        aria-label={`Disciplinas da turma ${turma.name}`}
                        component={RouterLink}
                        to={`/turmas/${turma.id}/disciplinas`}
                        size="small"
                      >
                        <MenuBookOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <IconButton aria-label={`Editar ${turma.name}`} onClick={() => openEdit(turma)} size="small">
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                    {canDelete && (
                      <IconButton
                        aria-label={`Excluir ${turma.name}`}
                        onClick={() => setDeletingTurma(turma)}
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

      <TurmaFormDialog open={formOpen} turma={editingTurma} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(deletingTurma)}
        title="Excluir turma"
        description={`Tem certeza que deseja excluir ${deletingTurma?.name}? Só é possível se ela não tiver alunos ou disciplinas atribuídas.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTurma(null)}
      />
    </Box>
  );
}
