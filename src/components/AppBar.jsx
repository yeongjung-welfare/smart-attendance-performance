import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button,
  Box,
  Menu,
  MenuItem,
  Divider
} from "@mui/material";
import MobileNav from "./MobileNav";

function AppBar({ role, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleClose = () => setMobileOpen(false);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  // ✅ 역할별 표시 텍스트
  const getRoleDisplay = (role) => {
    switch (role) {
      case "admin": return "관리자";
      case "manager": return "매니저";
      case "teacher": return "강사";
      case "pending": return "승인대기";
      default: return "사용자";
    }
  };

  return (
    <>
      <MuiAppBar position="static" sx={{ zIndex: 1201 }}>
        <Toolbar>
          {/* ✅ 모바일 메뉴 버튼 */}
          <IconButton
            color="inherit"
            aria-label="메뉴 열기"
            edge="start"
            onClick={handleToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* ✅ 제목 */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            출석 및 실적 관리 시스템
          </Typography>

          {/* ✅ 사용자 정보 및 로그아웃 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              startIcon={<AccountCircleIcon />}
              onClick={handleUserMenuOpen}
              sx={{ mr: 1 }}
            >
              {getRoleDisplay(role)}
            </Button>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  현재 역할: {getRoleDisplay(role)}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </MuiAppBar>

      {/* ✅ 모바일 네비게이션 */}
      <MobileNav 
        open={mobileOpen} 
        onClose={handleClose} 
        role={role} 
      />
    </>
  );
}

export default AppBar;