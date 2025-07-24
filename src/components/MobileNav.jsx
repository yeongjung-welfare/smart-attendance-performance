import React from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, List, ListItem, ListItemText, Divider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function MobileNav({ role, open, onClose, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <div style={{ width: 280, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>메뉴</h2>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <List>
          {/* 공통 */}
          <ListItem button onClick={() => { navigate("/dashboard"); onClose(); }}>
            <ListItemText primary="대시보드" />
          </ListItem>

          {/* 이용자 관리 - 관리자/매니저만 */}
          {(role === "admin" || role === "manager") && (
            <>
              <Divider />
              <ListItem button onClick={() => { navigate("/members"); onClose(); }}>
                <ListItemText primary="전체 이용자 관리" />
              </ListItem>
              <ListItem button onClick={() => { navigate("/subprogram-members"); onClose(); }}>
                <ListItemText primary="세부사업별 이용자 관리" />
              </ListItem>
            </>
          )}

          {/* 출석·실적 관리 */}
          {(role === "admin" || role === "manager" || role === "teacher") && (
            <>
              <Divider />
              {(role === "admin" || role === "manager") && (
                <ListItem button onClick={() => { navigate("/attendance"); onClose(); }}>
                  <ListItemText primary="출석·실적 등록 및 관리" />
                </ListItem>
              )}
              {role === "teacher" && (
                <>
                  <ListItem button onClick={() => { navigate("/attendance-teacher"); onClose(); }}>
                    <ListItemText primary="출석·실적 등록 및 관리" />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => { handleLogout(); onClose(); }}
                    sx={{
                      backgroundColor: '#fee2e2',
                      borderRadius: '8px',
                      margin: '8px 0',
                      '&:hover': {
                        backgroundColor: '#fecaca',
                      },
                    }}
                  >
                    <ListItemText primary="로그아웃" primaryTypographyProps={{ color: '#dc2626', fontWeight: 'medium' }} />
                  </ListItem>
                </>
              )}
              {(role === "admin" || role === "manager") && (
                <ListItem button onClick={() => { navigate("/bulk-performance-upload"); onClose(); }}>
                  <ListItemText primary="대량 실적 업로드" />
                </ListItem>
              )}
              {(role === "admin" || role === "manager") && (
                <ListItem button onClick={() => { navigate("/performance-stats"); onClose(); }}>
                  <ListItemText primary="실적 통계/조회" />
                </ListItem>
              )}
            </>
          )}

          {/* 매칭 관리 - 관리자/매니저만 */}
          {(role === "admin" || role === "manager") && (
            <>
              <Divider />
              <ListItem button onClick={() => { navigate("/team-map"); onClose(); }}>
                <ListItemText primary="팀-세부사업 매칭 관리" />
              </ListItem>
              <ListItem button onClick={() => { navigate("/teacher-map"); onClose(); }}>
                <ListItemText primary="강사-세부사업 매칭 관리" />
              </ListItem>
            </>
          )}

          {/* 관리자 전용 */}
          {role === "admin" && (
            <>
              <Divider />
              <ListItem button onClick={() => { navigate("/admin"); onClose(); }}>
                <ListItemText primary="승인관리" />
              </ListItem>
              <ListItem
                button
                onClick={() => { handleLogout(); onClose(); }}
                sx={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  margin: '8px 0',
                  '&:hover': {
                    backgroundColor: '#fecaca',
                  },
                }}
              >
                <ListItemText primary="로그아웃" primaryTypographyProps={{ color: '#dc2626', fontWeight: 'medium' }} />
              </ListItem>
            </>
          )}

          {/* 매니저용 로그아웃 */}
          {role === "manager" && (
            <>
              <Divider />
              <ListItem
                button
                onClick={() => { handleLogout(); onClose(); }}
                sx={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  margin: '8px 0',
                  '&:hover': {
                    backgroundColor: '#fecaca',
                  },
                }}
              >
                <ListItemText primary="로그아웃" primaryTypographyProps={{ color: '#dc2626', fontWeight: 'medium' }} />
              </ListItem>
            </>
          )}

          {/* 비로그인 상태: 로그인/회원가입 */}
          {!role && (
            <>
              <Divider />
              <ListItem button onClick={() => { navigate("/login"); onClose(); }}>
                <ListItemText primary="로그인" />
              </ListItem>
              <ListItem button onClick={() => { navigate("/signup"); onClose(); }}>
                <ListItemText primary="회원가입" />
              </ListItem>
            </>
          )}
        </List>
      </div>
    </Drawer>
  );
}

export default MobileNav;