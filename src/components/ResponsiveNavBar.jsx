import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const menuItems = [
  { label: "대시보드", path: "/" },
  { label: "회원 관리", path: "/members" },
  { label: "세부사업 이용자", path: "/subprogram-members" },
  { label: "출석/실적 관리", path: "/attendance-performance" },
  { label: "강사 매핑 관리", path: "/teacher-subprogram" }
];

const teacherMenu = [
  { label: "출석 등록", path: "/attendance-teacher" },
  { label: "실적 등록", path: "/performance-teacher" }
];

function ResponsiveNavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const toggleDrawer = () => setOpen(!open);

  const renderMenuList = () => {
    const routes = role === "teacher" ? teacherMenu : menuItems;
    return routes.map((item) => (
      <ListItem
        button
        key={item.path}
        component={Link}
        to={item.path}
        selected={location.pathname === item.path}
        onClick={toggleDrawer}
      >
        <ListItemText primary={item.label} />
      </ListItem>
    ));
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar className="flex justify-between">
          <div className="flex items-center gap-4">
            <IconButton color="inherit" onClick={toggleDrawer} edge="start" aria-label="menu">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component={Link} to="/" className="text-white no-underline">
              영중복지관 출석·실적 관리
            </Typography>
          </div>
          {currentUser?.email && (
            <Typography variant="body2" className="text-white">
              {currentUser.email} ({role})
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 240 }} role="presentation" onClick={toggleDrawer}>
          <List>{renderMenuList()}</List>
          <Divider />
          <List>
            <ListItem button component={Link} to="/logout">
              <ListItemText primary="로그아웃" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default ResponsiveNavBar;