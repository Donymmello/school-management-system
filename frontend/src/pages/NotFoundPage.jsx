import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

export default function NotFoundPage() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
      textAlign="center"
      px={2}
    >
      <Typography variant="h3" component="h1">
        404
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Essa página não existe.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Voltar para o início
      </Button>
    </Box>
  );
}
