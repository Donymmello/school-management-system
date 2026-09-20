import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { listCourseOfferingSubjects } from "../../api/courseOfferingSubjects.js";
import { listCourseOfferings } from "../../api/courseOfferings.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CourseOfferingSubjectFormDialog from "./CourseOfferingSubjectFormDialog.jsx";
import ScheduleManagerDialog from "./ScheduleManagerDialog.jsx";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const STATUS_LABELS = { PLANNED: "Planejada", ACTIVE: "Ativa", COMPLETED: "Concluída", CANCELED: "Cancelada" };
const STATUS_COLORS = { PLANNED: "default", ACTIVE: "success", COMPLETED: "info", CANCELED: "error" };

// Disciplinas atribuídas a uma oferta de curso específica (CourseOfferingSubject).
// GET /course-offering-subjects não filtra por oferta no backend — filtra
// aqui no cliente (ver docs/project-rules.md, seção 6, item 6).
export default function CourseOfferingSubjectsPage() {
  const { offeringId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const numericOfferingId = Number(offeringId);

  const [offering, setOffering] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, offerings] = await Promise.all([listCourseOfferingSubjects(), listCourseOfferings()]);
      setItems(all.filter((item) => item.courseOfferingId === numericOfferingId));
      setOffering(offerings.find((o) => o.id === numericOfferingId) || null);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as disciplinas desta oferta."));
    } finally {
      setLoading(false);
    }
  }, [numericOfferingId]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/ofertas")} sx={{ mb: 1 }}>
        Voltar para ofertas
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Box>
          <Typography variant="h4" component="h1">
            Disciplinas da oferta {offering?.code || ""}
          </Typography>
          {offering?.course?.displayName && (
            <Typography variant="body2" color="text.secondary">
              {offering.course.displayName}
            </Typography>
          )}
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Adicionar disciplina
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Disciplinas da oferta">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Professor</TableCell>
              <TableCell>Carga/semana</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && items.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box textAlign="center" py={6} role="status">
                    <MenuBookOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma disciplina atribuída a esta oferta ainda
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Adicionar disciplina" para começar.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.subject?.name}</TableCell>
                  <TableCell>{item.teacher?.name || "—"}</TableCell>
                  <TableCell>{item.weeklyHours}h</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[item.status] || item.status}
                      color={STATUS_COLORS[item.status] || "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {canManage && (
                      <Tooltip title="Editar">
                        <IconButton aria-label={`Editar ${item.subject?.name}`} size="small" onClick={() => openEdit(item)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Horário">
                      <IconButton
                        aria-label={`Horário de ${item.subject?.name}`}
                        size="small"
                        onClick={() => setScheduleTarget(item)}
                      >
                        <ScheduleOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Avaliações e notas">
                      <IconButton
                        aria-label={`Avaliações de ${item.subject?.name}`}
                        size="small"
                        component={RouterLink}
                        to={`/ofertas/${offeringId}/disciplinas/${item.id}/avaliacoes`}
                      >
                        <AssessmentOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CourseOfferingSubjectFormDialog
        open={formOpen}
        courseOfferingId={numericOfferingId}
        item={editingItem}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ScheduleManagerDialog
        open={Boolean(scheduleTarget)}
        courseOfferingSubject={scheduleTarget}
        onClose={() => setScheduleTarget(null)}
      />
    </Box>
  );
}
