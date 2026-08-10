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
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";

export const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { to: "/", label: "Início", icon: <SpaceDashboardOutlinedIcon />, roles: null },
  {
    to: "/alunos",
    label: "Alunos",
    icon: <GroupsOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR"],
  },
  {
    to: "/turmas",
    label: "Turmas",
    icon: <MeetingRoomOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER"],
  },
  {
    to: "/professores",
    label: "Professores",
    icon: <SchoolOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"],
  },
  {
    to: "/disciplinas",
    label: "Disciplinas",
    icon: <MenuBookOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER"],
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
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR"],
    academicModel: "HIGHER_ED",
  },
  {
    to: "/frequencia",
    label: "Frequência",
    icon: <EventAvailableOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER"],
  },
  {
    to: "/notas",
    label: "Notas",
    icon: <GradeOutlinedIcon />,
    roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER"],
  },
  {
    to: "/escolas",
    label: "Escolas",
    icon: <DomainOutlinedIcon />,
    roles: ["SUPER_ADMIN"],
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
            end={item.to === "/"}
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
