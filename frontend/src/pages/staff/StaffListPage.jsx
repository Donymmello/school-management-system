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
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { deleteStaff, listStaff } from "../../api/staff.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import StaffFormDialog from "./StaffFormDialog.jsx";

const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function StaffListPage() {
  const { user } = useAuth();
  const canDelete = DELETE_ROLES.includes(user?.role);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStaff(await listStaff());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os colaboradores."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingStaff(null);
    setFormOpen(true);
  }

  function openEdit(member) {
    setEditingStaff(member);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o colaborador."));
      setDeletingStaff(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Staff
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Novo colaborador
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de colaboradores">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && staff.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box textAlign="center" py={6} role="status">
                    <BadgeOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum colaborador cadastrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clique em "Novo colaborador" para cadastrar o primeiro.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              staff.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>{member.employeeCode || "—"}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.position || "—"}</TableCell>
                  <TableCell>{member.department || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={member.user?.active === false ? "Inativo" : "Ativo"}
                      color={member.user?.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar ${member.name}`}
                      onClick={() => openEdit(member)}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        aria-label={`Excluir ${member.name}`}
                        onClick={() => setDeletingStaff(member)}
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

      <StaffFormDialog
        open={formOpen}
        staffMember={editingStaff}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingStaff)}
        title="Excluir colaborador"
        description={`Tem certeza que deseja excluir ${deletingStaff?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingStaff(null)}
      />
    </Box>
  );
}
