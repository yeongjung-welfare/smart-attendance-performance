// src/pages/AttendanceTeacherPage.jsx

import React, { useState, useEffect } from "react";
import { Typography, Paper, Alert, CircularProgress, Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import AttendancePerformanceManage from "./AttendancePerformanceManage";
import { getMySubPrograms } from "../services/teacherSubProgramMapAPI";

function AttendanceTeacherPage() {
  const { currentUser, userSubPrograms } = useAuth(); // ✅ userSubPrograms 추가
  const [mySubPrograms, setMySubPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubPrograms() {
      if (currentUser?.email) {
        try {
          // ✅ AuthContext의 userSubPrograms 우선 사용 (자동 로드된 데이터)
          if (userSubPrograms && userSubPrograms.length > 0) {
            setMySubPrograms(userSubPrograms);
            console.log("✅ AuthContext에서 세부사업 로드:", userSubPrograms);
          } else {
            // ✅ 기존 API 호출 로직 완전 유지 (백업)
            const subPrograms = await getMySubPrograms(currentUser.email);
            setMySubPrograms(subPrograms);
            console.log("✅ API에서 세부사업 로드:", subPrograms);
          }
        } catch (error) {
          console.error("세부사업 로드 오류:", error);
          setError("담당 세부사업을 불러오는데 실패했습니다.");
          setMySubPrograms([]);
        }
      } else {
        setMySubPrograms([]);
      }
      setLoading(false);
    }

    loadSubPrograms();
  }, [currentUser?.email, userSubPrograms]); // ✅ userSubPrograms 의존성 추가

  // ✅ 기존 로딩 화면 완전 유지
  if (loading) {
    return (
      <Paper sx={{ p: 3, m: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>담당 세부사업을 불러오는 중...</Typography>
      </Paper>
    );
  }

  // ✅ 기존 에러 화면 완전 유지
  if (error) {
    return (
      <Paper sx={{ p: 3, m: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  // ✅ 기존 세부사업 없음 화면 완전 유지
  if (mySubPrograms.length === 0) {
    return (
      <Paper sx={{ p: 3, m: 2 }}>
        <Typography variant="h4" gutterBottom>
          출석 등록/관리 (강사 전용)
        </Typography>
        <Alert severity="info">
          담당 세부사업이 없습니다. 관리자에게 문의하세요.
        </Alert>
      </Paper>
    );
  }

  // ✅ 기존 메인 화면 완전 유지
  return (
    <Box>
      <Paper sx={{ p: 2, m: 2, mb: 1 }}>
        <Typography variant="h4" gutterBottom>
          출석 등록/관리 (강사 전용)
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          담당 세부사업: {mySubPrograms.map(sp => sp.subProgramName || sp).join(", ")}
        </Alert>
      </Paper>
      
      {/* ✅ 기존 AttendancePerformanceManage 컴포넌트 재사용 완전 유지 */}
      <AttendancePerformanceManage />
    </Box>
  );
}

export default AttendanceTeacherPage;
