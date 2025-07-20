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
    <Drawer anchor="left" open={open} onClose={onClose} className="md:hidden">
      <div className="w-64">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-lg">메뉴</span>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </div>
        <Divider />
        <List>
          {/* 공통 */}
          <ListItem>
            <ListItemText primary="공통" className="font-semibold text-gray-600" />
          </ListItem>
          <ListItem component="button" onClick={() => { navigate("/dashboard"); onClose(); }}>
            <ListItemText primary="대시보드" />
          </ListItem>

          {/* 이용자 관리 */}
          {(role === "admin" || role === "manager") && (
            <>
              <ListItem>
                <ListItemText primary="이용자 관리" className="font-semibold text-gray-600" />
              </ListItem>
              <ListItem component="button" onClick={() => { navigate("/members"); onClose(); }}>
                <ListItemText primary="전체 이용자 관리" />
              </ListItem>
              <ListItem component="button" onClick={() => { navigate("/subprogram-members"); onClose(); }}>
                <ListItemText primary="세부사업별 이용자 관리" />
              </ListItem>
            </>
          )}

          {/* 출석·실적 관리 */}
          {(role === "admin" || role === "manager" || role === "teacher") && (
            <>
              <ListItem>
                <ListItemText primary="출석·실적 관리" className="font-semibold text-gray-600" />
              </ListItem>
              {(role === "admin" || role === "manager") && (
                <ListItem component="button" onClick={() => { navigate("/attendance"); onClose(); }}>
                  <ListItemText primary="출석·실적 등록 및 관리" />
                </ListItem>
              )}
              {role === "teacher" && (
                <ListItem component="button" onClick={() => { navigate("/attendance-teacher"); onClose(); }}>
                  <ListItemText primary="출석·실적 등록 및 관리" />
                </ListItem>
              )}
              {(role === "admin" || role === "manager") && (
                <ListItem component="button" onClick={() => { navigate("/bulk-performance-upload"); onClose(); }}>
                  <ListItemText primary="대량 실적 업로드" />
                </ListItem>
              )}
              {(role === "admin" || role === "manager" || role === "teacher") && (
                <ListItem component="button" onClick={() => { navigate("/performance-stats"); onClose(); }}>
                  <ListItemText primary="실적 통계/조회" />
                </ListItem>
              )}
            </>
          )}

          {/* 매칭 관리 */}
          {(role === "admin" || role === "manager") && (
            <>
              <ListItem>
                <ListItemText primary="매칭 관리" className="font-semibold text-gray-600" />
              </ListItem>
              <ListItem component="button" onClick={() => { navigate("/team-map"); onClose(); }}>
                <ListItemText primary="팀-세부사업 매칭 관리" />
              </ListItem>
              <ListItem component="button" onClick={() => { navigate("/teacher-map"); onClose(); }}>
                <ListItemText primary="강사-세부사업 매칭 관리" />
              </ListItem>
            </>
          )}

          {/* 관리자 전용 */}
          {role === "admin" && (
            <>
              <ListItem>
                <ListItemText primary="관리자 전용" className="font-semibold text-gray-600" />
              </ListItem>
              <ListItem component="button" onClick={() => { navigate("/admin"); onClose(); }}>
                <ListItemText primary="승인관리" />
              </ListItem>
            </>
          )}
        </List>
        <Divider />
        {role ? (
          <List>
            <ListItem component="button" onClick={() => { handleLogout(); onClose(); }}>
              <ListItemText primary="로그아웃" className="text-red-500" />
            </ListItem>
          </List>
        ) : (
          <>
            <ListItem component="button" onClick={() => { navigate("/login"); onClose(); }}>
              <ListItemText primary="로그인" />
            </ListItem>
            <ListItem component="button" onClick={() => { navigate("/signup"); onClose(); }}>
              <ListItemText primary="회원가입" />
            </ListItem>
          </>
        )}
      </div>
    </Drawer>
  );
}

export default MobileNav;