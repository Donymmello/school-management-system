import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-dialog-title">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}>
          {loading ? "Aguarde…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
