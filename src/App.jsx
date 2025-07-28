import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { koKR } from "@mui/x-data-grid/locales";
import { koKR as coreKoKR } from "@mui/material/locale";
import AppBar from "./components/AppBar";
import SideNav from "./components/SideNav";
import MobileNav from "./components/MobileNav";
import { StatsProvider } from "./contexts/StatsContext";
import ErrorBoundary from "./components/ErrorBoundary";

// 📄 페이지
import Dashboard from "./pages/Dashboard";
import MemberManage from "./pages/MemberManage";
import AdminPanel from "./pages/AdminPanel";
import AttendancePerformanceManage from "./pages/AttendancePerformanceManage";
import SubProgramMemberManage from "./pages/SubProgramMemberManage";
import TeamSubProgramMapManage from "./pages/TeamSubProgramMapManage";
import TeacherSubProgramMapManage from "./pages/TeacherSubProgramMapManage";
import PerformanceStatsPage from "./pages/PerformanceStatsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyPerformancePage from "./pages/MyPerformancePage";
import PendingPage from "./pages/PendingPage";
import MemberQuickRegister from "./pages/MemberQuickRegister";
import AttendanceTeacherPage from "./pages/AttendanceTeacherPage";
import PerformanceTeacherPage from "./pages/PerformanceTeacherPage";
import PerformanceBulkUploadPage from "./pages/PerformanceBulkUploadPage";

import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ✅ 한국어 테마 생성
const theme = createTheme(
  {
    palette: {
      mode: 'light',
    },
  },
  koKR, // DataGrid 한국어
  coreKoKR // Material-UI 코어 한국어
);

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "Users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userRole = userSnap.data().role || null;
            setRole(userRole);
          } else {
            setRole(null);
            if (!["/login", "/signup"].includes(location.pathname)) {
              navigate("/login");
            }
          }
        } catch (err) {
          console.error("Firestore 오류:", err);
          setError("사용자 역할을 가져오지 못했습니다. 다시 로그인해 주세요.");
          setRole(null);
          if (!["/login", "/signup"].includes(location.pathname)) {
            navigate("/login");
          }
        }
      } else {
        setRole(null);
        if (!["/login", "/signup"].includes(location.pathname)) {
          navigate("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      setRole(null);
      navigate("/login");
    }).catch((err) => {
      setError("로그아웃 중 오류가 발생했습니다: " + err.message);
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  // 로그인/회원가입 페이지는 별도 레이아웃 처리
  if (["/login", "/signup"].includes(location.pathname)) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </div>
      </ErrorBoundary>
    );
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <StatsProvider>
          {/* 데스크톱 사이드 네비게이션 */}
          <div className="hidden md:block">
            <SideNav role={role} onLogout={handleLogout} />
          </div>

          <div className="flex-1 flex flex-col">
            {/* AppBar - 항상 표시 */}
            <AppBar role={role} onLogout={handleLogout} />
            
            <main className="flex-1 p-4">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard role={role} />} />
                
                {/* 승인 대기 사용자용 */}
                {role === "pending" && (
                  <Route path="/pending" element={<PendingPage />} />
                )}
                
                {/* 관리자/매니저 전용 라우트 */}
                {(role === "admin" || role === "manager") && (
                  <>
                    <Route path="/members" element={<MemberManage />} />
                    <Route path="/members/quick-register" element={<MemberQuickRegister />} />
                    <Route path="/subprogram-members" element={<SubProgramMemberManage />} />
                    <Route path="/attendance" element={<AttendancePerformanceManage />} />
                    <Route path="/performance-stats" element={<PerformanceStatsPage />} />
                    <Route path="/team-map" element={<TeamSubProgramMapManage />} />
                    <Route path="/teacher-map" element={<TeacherSubProgramMapManage />} />
                    <Route path="/bulk-performance-upload" element={<PerformanceBulkUploadPage />} />
                  </>
                )}
                
                {/* 관리자 전용 라우트 */}
                {role === "admin" && (
                  <Route path="/admin" element={<AdminPanel />} />
                )}
                
                {/* 강사 전용 라우트 */}
                {role === "teacher" && (
                  <>
                    <Route path="/attendance-teacher" element={<AttendanceTeacherPage />} />
                    <Route path="/performance-teacher" element={<PerformanceTeacherPage />} />
                  </>
                )}
                
                {/* 일반 사용자 전용 라우트 */}
                {role === "user" && (
                  <Route path="/my-performance" element={<MyPerformancePage />} />
                )}
                
                {/* 404 페이지 */}
                <Route path="*" element={<div className="text-center">404: 페이지를 찾을 수 없습니다.</div>} />
              </Routes>
            </main>
          </div>
                </StatsProvider>
      </div>
    </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
