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
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import { listSchools } from "../../api/schools.js";
import { getErrorMessage } from "../../api/errors.js";
import SchoolFormDialog from "./SchoolFormDialog.jsx";

const PLAN_LABELS = { FREE: "Grátis", BASIC: "Básico", PREMIUM: "Premium" };
const ACADEMIC_MODEL_LABELS = { SECONDARY: "Ensino secundário", HIGHER_ED: "Técnico/Superior" };

export default function SchoolsListPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSchools(await listSchools());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar as escolas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingSchool(null);
    setFormOpen(true);
  }

  function openEdit(school) {
    setEditingSchool(school);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Escolas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nova escola
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Escolas com status "Inativa" ficam com login bloqueado para todos os usuários — use isso
        pra suspender contas inadimplentes até a cobrança automática existir.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de escolas">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && schools.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box textAlign="center" py={6} role="status">
                    <DomainOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhuma escola cadastrada
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clique em "Nova escola" para cadastrar a primeira.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              schools.map((school) => (
                <TableRow key={school.id} hover>
                  <TableCell>{school.name}</TableCell>
                  <TableCell>{school.slug}</TableCell>
                  <TableCell>{ACADEMIC_MODEL_LABELS[school.academicModel] || school.academicModel}</TableCell>
                  <TableCell>{PLAN_LABELS[school.plan] || school.plan}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={school.status === "INACTIVE" ? "Inativa" : "Ativa"}
                      color={school.status === "INACTIVE" ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar ${school.name}`}
                      onClick={() => openEdit(school)}
                      size="small"
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SchoolFormDialog
        open={formOpen}
        school={editingSchool}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </Box>
  );
}
