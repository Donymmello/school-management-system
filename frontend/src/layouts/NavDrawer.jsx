import React from "react";
import { NavLink } from "react-router-dom";
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

export const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { to: "/painel", label: "Início", icon: <SpaceDashboardOutlinedIcon />, roles: null },
  {
    to: "/alunos",
    label: "Alunos",
    icon: <GroupsOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR"],
  },
  {
    to: "/salas",
    label: "Salas",
    icon: <MeetingRoomOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"],
  },
  {
    // Turma pedagógica (aluno+professor+disciplina) — não confundir com
    // "Salas" acima (sala física, ex-"Turmas"). Ver docs/project-rules.md,
    // seção 6, item 7.
    to: "/turmas",
    label: "Turmas",
    icon: <GroupsOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"],
    academicModel: "SECONDARY",
  },
  {
    to: "/professores",
    label: "Professores",
    icon: <SchoolOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"],
  },
  {
    to: "/staff",
    label: "Staff",
    icon: <BadgeOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"],
  },
  {
    to: "/disciplinas",
    label: "Disciplinas",
    icon: <MenuBookOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER"],
  },
  {
    to: "/cursos",
    label: "Cursos",
    icon: <AccountBalanceOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"],
    academicModel: "HIGHER_ED",
  },
  {
    to: "/ofertas",
    label: "Ofertas de curso",
    icon: <CollectionsBookmarkOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"],
    academicModel: "HIGHER_ED",
  },
  {
    to: "/matriculas",
    label: "Matrículas",
    icon: <AssignmentIndOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "STUDENT"],
    academicModel: "HIGHER_ED",
  },
  {
    // Fase 9a — só STUDENT, ver App.jsx MY_SCHEDULE_ROLES.
    to: "/meu-horario",
    label: "Meu horário",
    icon: <ScheduleOutlinedIcon />,
    roles: ["STUDENT"],
  },
  {
    // Fase 9c — só STUDENT, ver App.jsx STUDY_PLAN_ROLES.
    to: "/meu-plano-de-estudos",
    label: "Meu plano de estudos",
    icon: <AutoStoriesOutlinedIcon />,
    roles: ["STUDENT"],
  },
  {
    // Fase 9d — só STUDENT, ver App.jsx ACADEMIC_STATUS_ROLES.
    to: "/minha-situacao-curricular",
    label: "Situação curricular",
    icon: <AssessmentOutlinedIcon />,
    roles: ["STUDENT"],
  },
  {
    to: "/frequencia",
    label: "Frequência",
    icon: <EventAvailableOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER", "STUDENT"],
  },
  {
    to: "/notas",
    label: "Notas",
    icon: <GradeOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "TEACHER", "STAFF", "STUDENT"],
  },
  {
    to: "/propinas",
    label: "Propinas",
    icon: <ReceiptLongOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "STUDENT"],
  },
  {
    // Fase 8 — atrasadas + a vencer, com entidade/referência. Mesmos papéis
    // de "Propinas" (ver backend/routes/fees.routes.js READ_ROLES).
    to: "/propinas/alertas",
    label: "Alertas de propinas",
    icon: <NotificationsActiveOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "STUDENT"],
  },
  {
    to: "/escolas",
    label: "Escolas",
    icon: <DomainOutlinedIcon />,
    roles: ["SUPER_ADMIN"],
  },
  {
    // Fase 8 — self-service pra ADMIN configurar a própria escola
    // (entidade de pagamento, moeda) sem depender do SUPER_ADMIN, já que
    // "/escolas" é restrito à plataforma. Ver
    // backend/controllers/school.controller.js updateSchool.
    to: "/escola/configuracoes",
    label: "Configurações da escola",
    icon: <SettingsOutlinedIcon />,
    roles: ["ADMIN"],
  },
  {
    to: "/auditoria",
    label: "Auditoria",
    icon: <HistoryOutlinedIcon />,
    roles: null,
  },
];

// academicModel: modelo acadêmico da escola do usuário logado (null pro
// SUPER_ADMIN, que não pertence a nenhuma escola e por isso nunca é
// restrito por esse filtro — ver docs/project-rules.md, seção 5).
export default function NavDrawer({ role, academicModel, mobileOpen, onClose, variant }) {
  const items = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.academicModel && role !== "SUPER_ADMIN" && item.academicModel !== academicModel) return false;
    return true;
  });

  const content = (
    <>
      <Toolbar />
      <Divider />
      <List sx={{ py: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === "/painel"}
            onClick={onClose}
            sx={{
              mx: 1,
              borderRadius: 1,
              "&.active": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": { color: "primary.contrastText" },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === "permanent" ? true : mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
      }}
    >
      {content}
    </Drawer>
  );
}
