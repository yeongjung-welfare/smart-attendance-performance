import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar as MuiAppBar, Toolbar, Typography, IconButton } from "@mui/material";
import MobileNav from "./MobileNav";

function AppBar({ role, onLogout }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = () => setOpen(false);

  return (
    <>
      <MuiAppBar position="static" color="primary">
        <Toolbar className="flex justify-between">
          <IconButton
            color="inherit"
            aria-label="menu"
            edge="start"
            onClick={handleToggle}
            className="md:hidden"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            출석 및 실적 관리 시스템
          </Typography>
        </Toolbar>
      </MuiAppBar>

      <MobileNav open={open} onClose={handleClose} role={role} onLogout={onLogout} />
    </>
  );
}

export default AppBar;