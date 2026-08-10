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
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { deleteAttendance, listAttendance } from "../../api/attendance.js";
import { getErrorMessage } from "../../api/errors.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import AttendanceFormDialog from "./AttendanceFormDialog.jsx";

const STATUS_LABELS = { PRESENT: "Presente", ABSENT: "Ausente", LATE: "Atrasado", JUSTIFIED: "Falta justificada" };
const STATUS_COLORS = { PRESENT: "success", ABSENT: "error", LATE: "warning", JUSTIFIED: "default" };

export default function AttendanceListPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await listAttendance());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a frequência."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteAttendance(deletingRecord.id);
      setDeletingRecord(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o registro."));
      setDeletingRecord(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Frequência
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Registrar frequência
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de frequência">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && records.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box textAlign="center" py={6} role="status">
                    <EventAvailableOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum registro de frequência
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clique em "Registrar frequência" para começar.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.student?.name || "—"}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[record.status] || record.status}
                      color={STATUS_COLORS[record.status] || "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar frequência de ${record.student?.name}`}
                      onClick={() => openEdit(record)}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`Excluir frequência de ${record.student?.name}`}
                      onClick={() => setDeletingRecord(record)}
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

      <AttendanceFormDialog
        open={formOpen}
        record={editingRecord}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingRecord)}
        title="Excluir registro de frequência"
        description={`Tem certeza que deseja excluir esse registro de ${deletingRecord?.student?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingRecord(null)}
      />
    </Box>
  );
}
