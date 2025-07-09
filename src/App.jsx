import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppBar from "./components/AppBar";
import SideNav from "./components/SideNav";
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
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setRole(snap.data().role || null);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Firestore 오류:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    setRole(null);
    navigate("/login");
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav role={role} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AppBar />
        <main className="flex-1 p-4">
          <Routes>
            {/* 기본 경로 */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* 공통 */}
            <Route path="/dashboard" element={<Dashboard role={role} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* 승인 대기자 */}
            {role === "pending" && (
              <>
                <Route path="/pending" element={<PendingPage />} />
                <Route path="*" element={<Navigate to="/pending" replace />} />
              </>
            )}

            {/* 관리자 */}
            {role === "admin" && (
              <>
                <Route path="/members" element={<MemberManage />} />
                <Route path="/members/quick-register" element={<MemberQuickRegister />} />
                <Route path="/subprogram-members" element={<SubProgramMemberManage />} />
                <Route path="/attendance" element={<AttendancePerformanceManage />} />
                <Route path="/performance-stats" element={<PerformanceStatsPage />} />
                <Route path="/team-map" element={<TeamSubProgramMapManage />} />
                <Route path="/teacher-map" element={<TeacherSubProgramMapManage />} />
                <Route path="/admin" element={<AdminPanel />} />
              </>
            )}

            {/* 강사 */}
            {role === "teacher" && (
              <>
                <Route path="/attendance" element={<AttendancePerformanceManage />} />
                <Route path="/performance-stats" element={<PerformanceStatsPage />} />
              </>
            )}

            {/* 일반 사용자 */}
            {role === "user" && (
              <>
                <Route path="/my-performance" element={<MyPerformancePage />} />
              </>
            )}

            {/* 기타 잘못된 경로 */}
            <Route path="*" element={<div>404: 페이지를 찾을 수 없습니다.</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;