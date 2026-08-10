import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function AuthCard({ title, subtitle, children, maxWidth = 420 }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Paper>
    </Box>
  );
}
