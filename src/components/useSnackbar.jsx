import React, { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

/**
 * 스낵바를 사용하는 커스텀 훅.
 * 사용: const [SnackbarComp, showSnackbar] = useSnackbar();
 * showSnackbar("메시지", "success" | "error" | "warning" | "info");
 */
function useSnackbar() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");

  const showSnackbar = (msg, type = "info") => {
    setMessage(msg);
    setSeverity(type);
    setOpen(true);
  };

  const SnackbarComponent = (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );

  return [SnackbarComponent, showSnackbar];
}

export default useSnackbar;