import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
  const navigate = useNavigate();

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

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

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
      <MuiAppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#1976d2',
          color: '#ffffff'
        }}
      >
        <Toolbar>
          {/* 모바일 메뉴 버튼 - 로그인된 사용자만 */}
          {role && (
            <IconButton
              color="inherit"
              aria-label="메뉴 열기"
              edge="start"
              onClick={handleToggle}
              sx={{ 
                mr: 2, 
                display: { xs: 'block', sm: 'none' },
                color: '#ffffff'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* 제목 */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => navigate(role ? "/dashboard" : "/login")}
          >
            출석 및 실적 관리 시스템
          </Typography>

          {/* 로그인된 사용자 - 사용자 정보 및 로그아웃 */}
          {role && (
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              alignItems: 'center', 
              gap: 1 
            }}>
              {/* 사용자 역할 표시 버튼 */}
              <Button
                color="inherit"
                startIcon={<AccountCircleIcon />}
                onClick={handleUserMenuOpen}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {getRoleDisplay(role)}
              </Button>

              {/* 로그아웃 버튼 - 데스크톱에서 직접 표시 */}
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  minWidth: 'auto'
                }}
              >
                로그아웃
              </Button>

              {/* 사용자 메뉴 (역할 정보만 표시) */}
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
                PaperProps={{
                  sx: {
                    backgroundColor: '#ffffff',
                    color: '#212121'
                  }
                }}
              >
                <MenuItem disabled sx={{ color: '#757575' }}>
                  현재 역할: {getRoleDisplay(role)}
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* 비로그인 사용자 - 로그인/회원가입 버튼 */}
          {!role && (
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' }, 
              alignItems: 'center', 
              gap: 1 
            }}>
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                로그인
              </Button>
              <Button
                color="inherit"
                startIcon={<PersonAddIcon />}
                onClick={handleSignup}
                sx={{ 
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                회원가입
              </Button>
            </Box>
          )}

          {/* 모바일에서 로그인된 사용자 메뉴 */}
          {role && (
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <IconButton
                color="inherit"
                onClick={handleUserMenuOpen}
                sx={{ color: '#ffffff' }}
              >
                <AccountCircleIcon />
              </IconButton>
              
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
                PaperProps={{
                  sx: {
                    backgroundColor: '#ffffff',
                    color: '#212121'
                  }
                }}
              >
                <MenuItem disabled sx={{ color: '#757575' }}>
                  현재 역할: {getRoleDisplay(role)}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  로그아웃
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* 모바일에서 비로그인 사용자 메뉴 */}
          {!role && (
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <IconButton
                color="inherit"
                onClick={handleUserMenuOpen}
                sx={{ color: '#ffffff' }}
              >
                <AccountCircleIcon />
              </IconButton>
              
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
                PaperProps={{
                  sx: {
                    backgroundColor: '#ffffff',
                    color: '#212121'
                  }
                }}
              >
                <MenuItem onClick={() => { handleLogin(); handleUserMenuClose(); }}>
                  <LoginIcon sx={{ mr: 1 }} />
                  로그인
                </MenuItem>
                <MenuItem onClick={() => { handleSignup(); handleUserMenuClose(); }}>
                  <PersonAddIcon sx={{ mr: 1 }} />
                  회원가입
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </MuiAppBar>

      {/* 모바일 네비게이션 - 로그인된 사용자만 */}
      {role && (
        <MobileNav 
          role={role} 
          open={mobileOpen} 
          onClose={handleClose} 
          onLogout={onLogout} 
        />
      )}
    </>
  );
}

export default AppBar;
