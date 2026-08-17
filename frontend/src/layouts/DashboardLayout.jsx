import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../context/AuthContext.jsx";
import NavDrawer, { DRAWER_WIDTH } from "./NavDrawer.jsx";
import ChangePasswordDialog from "../components/ChangePasswordDialog.jsx";

const ROLE_LABELS = {
  SUPER_ADMIN: "Dono da plataforma",
  ADMIN: "Administrador",
  DIRECTOR: "Diretor(a)",
  SECRETARY: "Secretaria",
  TEACHER: "Professor(a)",
  STUDENT: "Aluno(a)",
  STAFF: "Colaborador(a)",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const schoolName = user?.school?.name;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: "background.paper",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton
              aria-label="Abrir menu de navegação"
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {schoolName || "Sistema de Gestão Escolar"}
          </Typography>
          <IconButton
            aria-label="Abrir menu do usuário"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </Avatar>
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled sx={{ opacity: "1 !important" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ROLE_LABELS[user?.role] || user?.role}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setChangePasswordOpen(true);
              }}
            >
              Trocar senha
            </MenuItem>
            <MenuItem onClick={logout}>Sair</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

      <NavDrawer
        role={user?.role}
        academicModel={user?.school?.academicModel}
        variant={isDesktop ? "permanent" : "temporary"}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
