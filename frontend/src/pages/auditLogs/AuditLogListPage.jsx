import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
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
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import { listAuditLogs, listMyAuditLogs } from "../../api/auditLogs.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function AuditLogListPage() {
  const { user } = useAuth();
  // ADMIN/SUPER_ADMIN veem o log da escola toda (ou de todas, pro
  // SUPER_ADMIN sem filtro — ver backend/middleware/tenant.middleware.js).
  // Qualquer outro papel só vê as próprias ações (GET /logs-audit/meus).
  const seesAllLogs = ADMIN_ROLES.includes(user?.role);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(seesAllLogs ? await listAuditLogs() : await listMyAuditLogs());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o log de auditoria."));
    } finally {
      setLoading(false);
    }
  }, [seesAllLogs]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h4" component="h1">
          {seesAllLogs ? "Log de auditoria" : "Minhas ações"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {seesAllLogs
            ? "Histórico de ações registradas no sistema."
            : "Histórico das suas próprias ações no sistema."}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Log de auditoria">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              {seesAllLogs && <TableCell>Usuário</TableCell>}
              <TableCell>Ação</TableCell>
              <TableCell>Entidade</TableCell>
              <TableCell>Descrição</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: seesAllLogs ? 5 : 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && logs.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={seesAllLogs ? 5 : 4}>
                  <Box textAlign="center" py={6} role="status">
                    <HistoryOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum registro encontrado
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{formatDateTime(log.created_at || log.createdAt)}</TableCell>
                  {seesAllLogs && (
                    <TableCell>
                      {log.user ? `${log.user.name} (${log.user.role})` : "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip size="small" label={log.action} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {log.entity}
                    {log.entityId ? ` #${log.entityId}` : ""}
                  </TableCell>
                  <TableCell>{log.description || "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
