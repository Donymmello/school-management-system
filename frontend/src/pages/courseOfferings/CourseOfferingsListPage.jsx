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
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import { deactivateCourseOffering, listCourseOfferings } from "../../api/courseOfferings.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import CourseOfferingFormDialog from "./CourseOfferingFormDialog.jsx";

const SEMESTER_LABELS = { S1: "1º semestre", S2: "2º semestre" };
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

export default function CourseOfferingsListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState(null);
  const [deactivatingOffering, setDeactivatingOffering] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOfferings(await listCourseOfferings());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as ofertas de curso."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingOffering(null);
    setFormOpen(true);
  }

  function openEdit(offering) {
    setEditingOffering(offering);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeactivateConfirm() {
    setDeactivating(true);
    try {
      await deactivateCourseOffering(deactivatingOffering.id);
      setDeactivatingOffering(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível desativar a oferta."));
      setDeactivatingOffering(null);
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Ofertas de curso
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nova oferta
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de ofertas de curso">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>Vagas</TableCell>
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

            {!loading && offerings.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6}>
                  <Box textAlign="center" py={6} role="status">
                    <CollectionsBookmarkOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma oferta de curso cadastrada
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Nova oferta" para cadastrar a primeira.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              offerings.map((offering) => (
                <TableRow key={offering.id} hover>
                  <TableCell>{offering.code}</TableCell>
                  <TableCell>{offering.course?.displayName || "—"}</TableCell>
                  <TableCell>{offering.academicYear}</TableCell>
                  <TableCell>{SEMESTER_LABELS[offering.semester] || offering.semester}</TableCell>
                  <TableCell>{offering.capacity}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={offering.active === false ? "Inativa" : "Ativa"}
                      color={offering.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Editar oferta ${offering.code}`}
                        onClick={() => openEdit(offering)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      {offering.active !== false && (
                        <IconButton
                          aria-label={`Desativar oferta ${offering.code}`}
                          onClick={() => setDeactivatingOffering(offering)}
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

      <CourseOfferingFormDialog
        open={formOpen}
        offering={editingOffering}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deactivatingOffering)}
        title="Desativar oferta de curso"
        description={`Tem certeza que deseja desativar a oferta ${deactivatingOffering?.code}? Novas matrículas deixarão de ser aceitas.`}
        confirmLabel="Desativar"
        confirmColor="error"
        loading={deactivating}
        onConfirm={handleDeactivateConfirm}
        onClose={() => setDeactivatingOffering(null)}
      />
    </Box>
  );
}
