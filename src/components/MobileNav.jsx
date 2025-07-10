import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Drawer, List, ListItem, ListItemText, Divider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function MobileNav({ role, open, onClose, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  const commonLinks = [
    { label: "대시보드", path: "/dashboard" }
  ];

  const adminLinks = [
    { label: "전체 이용자 관리", path: "/members" },
    { label: "세부사업별 이용자 관리", path: "/subprogram-members" },
    { label: "출석·실적 등록 및 관리", path: "/attendance" },
    { label: "실적 통계/조회", path: "/performance-stats" },
    { label: "팀-세부사업 매칭 관리", path: "/team-map" },
    { label: "강사-세부사업 매칭 관리", path: "/teacher-map" },
    { label: "승인관리", path: "/admin" },
  ];

  const managerLinks = [
    { label: "전체 이용자 관리", path: "/members" },
    { label: "세부사업별 이용자 관리", path: "/subprogram-members" },
    { label: "출석·실적 등록 및 관리", path: "/attendance" },
    { label: "실적 통계/조회", path: "/performance-stats" },
    { label: "팀-세부사업 매칭 관리", path: "/team-map" },
    { label: "강사-세부사업 매칭 관리", path: "/teacher-map" },
  ];

  const teacherLinks = [
    { label: "출석·실적 관리", path: "/attendance-teacher" },
    { label: "실적 통계/조회", path: "/performance-teacher" },
  ];

  const userLinks = [
    { label: "내 실적", path: "/my-performance" },
  ];

  const guestLinks = [
    { label: "로그인", path: "/login" },
    { label: "회원가입", path: "/signup" },
  ];

  const getRoleLinks = () => {
    switch (role) {
      case "admin": return adminLinks;
      case "manager": return managerLinks;
      case "teacher": return teacherLinks;
      case "user": return userLinks;
      default: return guestLinks;
    }
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose} className="md:hidden">
      <div className="w-64">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-lg">메뉴</span>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          {commonLinks.map((item) => (
            <ListItem button key={item.path} onClick={() => { navigate(item.path); onClose(); }}>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
          {getRoleLinks().map((item) => (
            <ListItem button key={item.path} onClick={() => { navigate(item.path); onClose(); }}>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
        {role ? (
          <List>
            <ListItem button onClick={() => { handleLogout(); onClose(); }}>
              <ListItemText primary="로그아웃" className="text-red-500" />
            </ListItem>
          </List>
        ) : null}
      </div>
    </Drawer>
  );
}

export default MobileNav;