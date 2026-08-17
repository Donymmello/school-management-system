import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import {
  approveEnrollment,
  cancelEnrollment,
  listEnrollments,
  rejectEnrollment,
} from "../../api/enrollments.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EnrollmentFormDialog from "./EnrollmentFormDialog.jsx";

const STATUS_LABELS = { PENDING: "Pendente", APPROVED: "Aprovada", REJECTED: "Rejeitada", CANCELLED: "Cancelada" };
const STATUS_COLORS = { PENDING: "warning", APPROVED: "success", REJECTED: "error", CANCELLED: "default" };
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

function RejectDialog({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Rejeitar matrícula</DialogTitle>
      <DialogContent>
        <TextField
          label="Motivo (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 1 }}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={() => onConfirm(reason)} color="error" variant="contained" disabled={loading}>
          {loading ? "Aguarde…" : "Rejeitar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EnrollmentsListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEnrollments(await listEnrollments());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as matrículas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      await approveEnrollment(approving.id);
      setApproving(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível aprovar a matrícula."));
      setApproving(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(reason) {
    setActionLoading(true);
    try {
      await rejectEnrollment(rejecting.id, reason);
      setRejecting(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível rejeitar a matrícula."));
      setRejecting(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      await cancelEnrollment(cancelling.id);
      setCancelling(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível cancelar a matrícula."));
      setCancelling(null);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          {user?.role === "STUDENT" ? "Minhas matrículas" : "Matrículas"}
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            Nova matrícula
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de matrículas">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Oferta de curso</TableCell>
              <TableCell>Status</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canManage ? 4 : 3 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && enrollments.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3}>
                  <Box textAlign="center" py={6} role="status">
                    <AssignmentIndOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma matrícula registrada
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Nova matrícula" para registrar a primeira.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>{enrollment.student?.name || "—"}</TableCell>
                  <TableCell>
                    {enrollment.courseOffering?.code} — {enrollment.courseOffering?.course?.displayName}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={enrollment.rejectionReason || ""} disableHoverListener={!enrollment.rejectionReason}>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[enrollment.status] || enrollment.status}
                        color={STATUS_COLORS[enrollment.status] || "default"}
                        variant="outlined"
                      />
                    </Tooltip>
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      {enrollment.status === "PENDING" && (
                        <>
                          <IconButton
                            aria-label={`Aprovar matrícula de ${enrollment.student?.name}`}
                            onClick={() => setApproving(enrollment)}
                            size="small"
                            color="success"
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label={`Rejeitar matrícula de ${enrollment.student?.name}`}
                            onClick={() => setRejecting(enrollment)}
                            size="small"
                            color="error"
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {enrollment.status === "APPROVED" && (
                        <IconButton
                          aria-label={`Cancelar matrícula de ${enrollment.student?.name}`}
                          onClick={() => setCancelling(enrollment)}
                          size="small"
                        >
                          <BlockOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EnrollmentFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(approving)}
        title="Aprovar matrícula"
        description={`Aprovar a matrícula de ${approving?.student?.name}?`}
        confirmLabel="Aprovar"
        loading={actionLoading}
        onConfirm={handleApprove}
        onClose={() => setApproving(null)}
      />

      <RejectDialog
        open={Boolean(rejecting)}
        loading={actionLoading}
        onConfirm={handleReject}
        onClose={() => setRejecting(null)}
      />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancelar matrícula"
        description={`Cancelar a matrícula de ${cancelling?.student?.name}?`}
        confirmLabel="Cancelar matrícula"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </Box>
  );
}
