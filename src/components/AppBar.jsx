import React from "react";
import { AppBar as MuiAppBar, Toolbar, Typography, Button } from "@mui/material";

function AppBar() {
  return (
    <MuiAppBar position="static" color="primary" className="shadow-md">
      <Toolbar>
        <Typography variant="h6" className="flex-1">영중종합사회복지관 이용자 출석·실적 관리</Typography>
        <Button color="inherit" href="/dashboard">대시보드</Button>
        <Button color="inherit" href="/members">회원관리</Button>
        <Button color="inherit" href="/admin">승인관리</Button>
      </Toolbar>
    </MuiAppBar>
  );
}

export default AppBar;
