import { createTheme } from "@mui/material/styles";

// Paleta discreta (azul-petróleo + neutros), nada de roxo/gradiente genérico.
const theme = createTheme({
  palette: {
    primary: { main: "#0f5c66" },
    secondary: { main: "#b5651d" },
    background: { default: "#f5f6f8" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderBottom: "1px solid rgba(0,0,0,0.08)" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid rgba(0,0,0,0.08)" },
      },
    },
  },
});

export default theme;
