import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppBar from "./components/AppBar";
import SideNav from "./components/SideNav";
import MobileNav from "./components/MobileNav";
import { StatsProvider } from "./contexts/StatsContext";
import ErrorBoundary from "./components/ErrorBoundary"; // ✅ 추가

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

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
            navigate("/login");
          }
        } catch (err) {
          console.error("Firestore 오류:", err);
          setError("사용자 역할을 가져오지 못했습니다. 다시 로그인해 주세요.");
          setRole(null);
          navigate("/login");
        }
      } else {
        setRole(null);
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <StatsProvider>
          <div className="hidden md:block">
            <SideNav role={role} onLogout={handleLogout} />
          </div>
          <div className="block md:hidden">
            <MobileNav role={role} onLogout={handleLogout} />
          </div>
          <div className="flex-1 flex flex-col">
            <AppBar role={role} onLogout={handleLogout} />
            <main className="flex-1 p-4">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard role={role} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                {role === "pending" && (
                  <Route path="/pending" element={<PendingPage />} />
                )}
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
                    {role === "admin" && (
                      <Route path="/admin" element={<AdminPanel />} />
                    )}
                  </>
                )}
                {role === "teacher" && (
                  <>
                    <Route path="/attendance-teacher" element={<AttendanceTeacherPage />} />
                    <Route path="/performance-teacher" element={<PerformanceTeacherPage />} />
                  </>
                )}
                {role === "user" && (
                  <Route path="/my-performance" element={<MyPerformancePage />} />
                )}
                <Route path="*" element={<div className="text-center">404: 페이지를 찾을 수 없습니다.</div>} />
              </Routes>
            </main>
          </div>
        </StatsProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;