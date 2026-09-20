import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { getFeeAlerts, markFeeStatus } from "../../api/fees.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

// Espelha MANAGE_ROLES de backend/routes/fees.routes.js — quem pode
// confirmar pagamento direto desta tela. STUDENT só lê as próprias
// (auto-escopado no backend, ver fee.controller.js getFeeAlerts).
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
const DAYS_AHEAD = 7;

function formatCurrencyAmount(amount, currency) {
  return `${Number(amount).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function ReferenceCell({ fee, onCopy }) {
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

function StudentAlertCard({ student, canManage, onMarkPaid, updatingId, onCopy }) {
  const rows = [
    ...student.overdue.map((fee) => ({ fee, situation: "overdue" })),
    ...student.dueSoon.map((fee) => ({ fee, situation: "dueSoon" })),
  ];

  const totalsEntries = Object.entries(student.totals || {});

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {student.studentName || "—"}
          </Typography>
          {student.studentCode && (
            <Typography variant="body2" color="text.secondary">
              {student.studentCode}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {totalsEntries.map(([currency, totals]) => (
            <React.Fragment key={currency}>
              {totals.overdue > 0 && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={`Atrasado: ${formatCurrencyAmount(totals.overdue, currency)}`}
                />
              )}
              {totals.dueSoon > 0 && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`A vencer: ${formatCurrencyAmount(totals.dueSoon, currency)}`}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>

      <TableContainer>
        <Table size="small" aria-label={`Propinas em alerta de ${student.studentName || "aluno"}`}>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Referência</TableCell>
              <TableCell>Situação</TableCell>
              {canManage && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ fee, situation }) => (
              <TableRow key={fee.id} hover>
                <TableCell>{fee.description}</TableCell>
                <TableCell>{fee.dueDate}</TableCell>
                <TableCell>{formatCurrencyAmount(fee.amount, fee.currency)}</TableCell>
                <TableCell>
                  <ReferenceCell fee={fee} onCopy={onCopy} />
                </TableCell>
                <TableCell>
                  {situation === "overdue" ? (
                    <Chip size="small" label="Atrasado" color="error" variant="outlined" />
                  ) : (
                    <Chip size="small" label="A vencer" color="warning" variant="outlined" />
                  )}
                </TableCell>
                {canManage && (
                  <TableCell align="right">
                    <Tooltip title="Marcar como paga">
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Marcar como paga: ${fee.description}`}
                          disabled={updatingId === fee.id}
                          onClick={() => onMarkPaid(fee)}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// Fase 8 (ver docs/project-rules.md, seção 6): propinas atrasadas + a
// vencer nos próximos dias, agrupadas por aluno, com entidade/referência
// de pagamento e a "situação financeira" (totais por moeda) sempre
// recalculada na hora — sem envio externo (SMS/WhatsApp/email) nesta
// rodada, decisão explícita do usuário: só painel.
export default function FeeAlertsPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getFeeAlerts(DAYS_AHEAD));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os alertas de propinas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleCopy(text) {
    navigator.clipboard?.writeText(text).then(
      () => setCopiedMessage("Referência copiada."),
      () => setCopiedMessage("Não foi possível copiar. Copie manualmente.")
    );
  }

  async function handleMarkPaid(fee) {
    setUpdatingId(fee.id);
    try {
      await markFeeStatus(fee.id, "PAID");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível marcar a propina como paga."));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Alertas de propinas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Propinas atrasadas e as que vencem nos próximos {DAYS_AHEAD} dias, com entidade e referência de
        pagamento de cada aluno.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        </>
      )}

      {!loading && !error && (data?.students?.length ?? 0) === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <NotificationsActiveOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Nenhum alerta no momento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sem propinas atrasadas nem a vencer nos próximos {DAYS_AHEAD} dias.
          </Typography>
        </Paper>
      )}

      {!loading &&
        data?.students?.map((student) => (
          <StudentAlertCard
            key={student.studentId}
            student={student}
            canManage={canManage}
            onMarkPaid={handleMarkPaid}
            updatingId={updatingId}
            onCopy={handleCopy}
          />
        ))}

      <Snackbar
        open={Boolean(copiedMessage)}
        autoHideDuration={2500}
        onClose={() => setCopiedMessage(null)}
        message={copiedMessage}
      />
    </Box>
  );
}
