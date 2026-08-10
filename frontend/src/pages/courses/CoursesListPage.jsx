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
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { deleteCourse, listCourses } from "../../api/courses.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import CourseFormDialog from "./CourseFormDialog.jsx";

const FACULTY_LABELS = {
  ENGINEERING: "Engenharia",
  ECONOMICS: "Economia",
  MEDICINE: "Medicina",
  SCIENCES: "Ciências",
  OTHER: "Outra",
};

const DEGREE_LABELS = {
  CERTIFICATE: "Certificado",
  DIPLOMA: "Diploma",
  BACHELOR: "Licenciatura",
  MASTER: "Mestrado",
  PHD: "Doutorado",
};

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function CoursesListPage() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const canDelete = DELETE_ROLES.includes(user?.role);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await listCourses());
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os cursos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingCourse(null);
    setFormOpen(true);
  }

  function openEdit(course) {
    setEditingCourse(course);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    load();
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteCourse(deletingCourse.id);
      setDeletingCourse(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível excluir o curso."));
      setDeletingCourse(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" component="h1">
          Cursos
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Novo curso
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="Lista de cursos">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Faculdade</TableCell>
              <TableCell>Grau</TableCell>
              <TableCell>Duração</TableCell>
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

            {!loading && courses.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6}>
                  <Box textAlign="center" py={6} role="status">
                    <AccountBalanceOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      Nenhum curso cadastrado
                    </Typography>
                    {canManage && (
                      <Typography variant="body2" color="text.secondary">
                        Clique em "Novo curso" para cadastrar o primeiro.
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              courses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.displayName}</TableCell>
                  <TableCell>{FACULTY_LABELS[course.faculty] || course.faculty}</TableCell>
                  <TableCell>{DEGREE_LABELS[course.degreeLevel] || course.degreeLevel}</TableCell>
                  <TableCell>{course.durationYears ? `${course.durationYears} anos` : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={course.active === false ? "Inativo" : "Ativo"}
                      color={course.active === false ? "default" : "success"}
                      variant="outlined"
                    />
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Editar ${course.displayName}`}
                        onClick={() => openEdit(course)}
                        size="small"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          aria-label={`Excluir ${course.displayName}`}
                          onClick={() => setDeletingCourse(course)}
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

      <CourseFormDialog
        open={formOpen}
        course={editingCourse}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingCourse)}
        title="Excluir curso"
        description={`Tem certeza que deseja excluir ${deletingCourse?.displayName}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingCourse(null)}
      />
    </Box>
  );
}
