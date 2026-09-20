import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { deleteFee, listFees, markFeeStatus } from "../../api/fees.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import FeeFormDialog from "./FeeFormDialog.jsx";

const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];

// "Atrasado" não é um valor de status guardado no banco — é derivado aqui na
// hora de mostrar (pendente + vencimento no passado), pra não deixar dado
// parado mentir depois que o relógio passa do vencimento (ver
// docs/project-rules.md, seção 6, item 5).
function isOverdue(fee) {
  if (fee.status !== "PENDING") return false;
  return new Date(fee.dueDate) < new Date(new Date().toDateString());
}

// Fase 8: quando paga, mostra como/por quem foi confirmada (MANUAL sempre
// tem confirmedBy; WEBHOOK ainda não é usado por nenhum gateway real neste
// sistema, mas o campo já existe — ver backend/services/feePayment.service.js).
function statusChip(fee) {
  if (fee.status === "PAID") {
    const confirmedLabel =
      fee.paymentMethod === "WEBHOOK"
        ? "Confirmado automaticamente via webhook"
        : fee.confirmedBy?.name
        ? `Confirmado por ${fee.confirmedBy.name}`
        : "Confirmado manualmente";
    return (
      <Tooltip title={confirmedLabel}>
        <Chip size="small" label="Pago" color="success" variant="outlined" />
      </Tooltip>
    );
  }
  if (isOverdue(fee)) return <Chip size="small" label="Atrasado" color="error" variant="outlined" />;
  return <Chip size="small" label="Pendente" color="warning" variant="outlined" />;
}

// Fase 8: entidade+referência de pagamento (ver docs/project-rules.md,
// seção 6) — propinas lançadas antes desta fase não têm reference (coluna
// nova, ficou null nas linhas antigas), daí o fallback "—".
function PaymentReferenceCell({ fee, onCopy }) {
  if (!fee.reference) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const label = fee.entity ? `Entidade ${fee.entity} · Ref ${fee.reference}` : `Ref ${fee.reference}`;
  const copyText = fee.entity ? `Entidade: ${fee.entity}\nReferência: ${fee.reference}` : fee.reference;

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Typography variant="body2">{label}</Typography>
      <Tooltip title="Copiar referência">
        <IconButton size="small" onClick={() => onCopy(copyText)}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function FeesListPage() {
  const { user } = useAuth();
  const canDelete = DELETE_ROLES.includes(user?.role);
  // Portal do aluno: STUDENT só lê as próprias propinas (auto-escopado no
  // backend) — sem criar/editar/excluir/marcar pago (ver
  // docs/project-rules.md, seção 6, item 5).
  const readOnly = user?.role === "STUDENT";

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deletingFee, setDeletingFee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);

  function handleCopyReference(text) {
    navigator.clipboard?.writeText(text).then(
      () => setCopiedMessage("Referência copiada."),
      () => setCopiedMessage("Não foi possível copiar. Copie manualmente.")
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFees(await listFees());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as propinas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingFee(null);
    setFormOpen(true);
  }

  function openEdit(fee) {
    setEditingFee(fee);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleToggleStatus(fee) {
    setUpdatingId(fee.id);
    try {
      await markFeeStatus(fee.id, fee.status === "PAID" ? "PENDING" : "PAID");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível atualizar o status da propina."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteFee(deletingFee.id);
      setDeletingFee(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir a propina."));
      setDeletingFee(null);
    } finally {
      setDeleting(false);
    }
  }

  const colCount = readOnly ? 6 : 7;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          {readOnly ? "Minhas propinas" : "Propinas"}
        </Typography>
        {!readOnly && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Lançar propina
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de propinas">
          <TableHead>
            <TableRow>
              {!readOnly && <TableCell>Aluno</TableCell>}
              <TableCell>Descrição</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Referência</TableCell>
              <TableCell>Status</TableCell>
              {!readOnly && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && fees.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Box textAlign="center" py={6} role="status">
                    <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma propina lançada
                    </Typography>
                    {!readOnly && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Lançar propina" para começar.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              fees.map((fee) => (
                <TableRow key={fee.id} hover>
                  {!readOnly && <TableCell>{fee.student?.name || "—"}</TableCell>}
                  <TableCell>{fee.description}</TableCell>
                  <TableCell>
                    {Number(fee.amount).toFixed(2)} {fee.currency}
                  </TableCell>
                  <TableCell>{fee.dueDate}</TableCell>
                  <TableCell>
                    <PaymentReferenceCell fee={fee} onCopy={handleCopyReference} />
                  </TableCell>
                  <TableCell>{statusChip(fee)}</TableCell>
                  {!readOnly && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={
                          fee.status === "PAID"
                            ? `Marcar como pendente: ${fee.description}`
                            : `Marcar como paga: ${fee.description}`
                        }
                        onClick={() => handleToggleStatus(fee)}
                        disabled={updatingId === fee.id}
                        size="small"
                      >
                        {fee.status === "PAID" ? (
                          <UndoIcon fontSize="small" />
                        ) : (
                          <CheckCircleOutlineIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        aria-label={`Editar propina: ${fee.description}`}
                        onClick={() => openEdit(fee)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          aria-label={`Excluir propina: ${fee.description}`}
                          onClick={() => setDeletingFee(fee)}
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

      <FeeFormDialog open={formOpen} fee={editingFee} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(deletingFee)}
        title="Excluir propina"
        description={`Tem certeza que deseja excluir a propina "${deletingFee?.description}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingFee(null)}
      />

      <Snackbar
        open={Boolean(copiedMessage)}
        autoHideDuration={2500}
        onClose={() => setCopiedMessage(null)}
        message={copiedMessage}
      />
    </Box>
  );
}
