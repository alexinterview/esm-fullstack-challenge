import { ReactNode } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  loading?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const DetailDialog = ({
  open,
  onClose,
  title,
  loading = false,
  children,
  actions,
  maxWidth = "md",
}: DetailDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
    <DialogTitle
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {loading ? "Loading..." : title}
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </DialogContent>
    {actions && !loading && <DialogActions>{actions}</DialogActions>}
  </Dialog>
);
