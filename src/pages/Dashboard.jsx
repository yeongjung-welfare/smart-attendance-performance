import React, { useEffect, useState } from "react";
import { Container, Paper, Typography, Box, useTheme, useMediaQuery, Grid } from "@mui/material";
import DashboardCard from "../components/DashboardCard";
import AttendancePerformanceChart from "../components/AttendancePerformanceChart";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchProgramStructure } from "../api/fetchProgramStructure";
import {
  getTotalMembers,
  getTodayAttendance,
  getPendingUsers,
  getTotalPrograms,
  getTotalNewUsersThisMonth,
  getTopSubProgram,
  getMonthlyPerformanceData,
  getRecentAttendanceData
} from "../services/dashboardStatsAPI";

function Dashboard({ role }) {
  const [programStructure, setProgramStructure] = useState(null);
  const [programError, setProgramError] = useState(null);
  const [stats, setStats] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchProgramStructure()
      .then((data) => {
        setProgramStructure(data);
      })
      .catch((err) => {
        setProgramError(err.message);
      });

    const loadStats = async () => {
      try {
        if (role === "teacher") {
          // 강사는 제한된 통계만 조회
          const [
            totalMembers,
            todayAttendance,
            totalPrograms,
            topSubProgram,
            perfData,
            attendData
          ] = await Promise.all([
            getTotalMembers(),
            getTodayAttendance(),
            getTotalPrograms(),
            getTopSubProgram(),
            getMonthlyPerformanceData(),
            getRecentAttendanceData()
          ]);

          setStats({
            totalMembers,
            todayAttendance,
            pendingUsers: "권한 없음",           // 강사는 승인 대기자 확인 불가
            totalPrograms,
            totalNewUsersThisMonth: "권한 없음", // 강사는 신규 회원 통계 확인 불가
            topSubProgram
          });
          setPerformanceData(perfData);
          setAttendanceData(attendData);
        } else {
          // 관리자/매니저는 전체 통계 조회 (기존 로직)
          const [
            totalMembers,
            todayAttendance,
            pendingUsers,
            totalPrograms,
            totalNewUsersThisMonth,
            topSubProgram,
            perfData,
            attendData
          ] = await Promise.all([
            getTotalMembers(),
            getTodayAttendance(),
            getPendingUsers(),
            getTotalPrograms(),
            getTotalNewUsersThisMonth(),
            getTopSubProgram(),
            getMonthlyPerformanceData(),
            getRecentAttendanceData()
          ]);

          setStats({
            totalMembers,
            todayAttendance,
            pendingUsers,
            totalPrograms,
            totalNewUsersThisMonth,
            topSubProgram
          });
          setPerformanceData(perfData);
          setAttendanceData(attendData);
        }
      } catch (error) {
        console.error("대시보드 통계 로드 오류:", error);
        // 오류 발생 시 기본값 설정
        setStats({
          totalMembers: 0,
          todayAttendance: 0,
          pendingUsers: 0,
          totalPrograms: 0,
          totalNewUsersThisMonth: 0,
          topSubProgram: "데이터 없음"
        });
      }
    };

    loadStats();
  }, [role]); // ✅ role 의존성 추가

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 4, 
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
          }}
        >
          대시보드
        </Typography>

        {/* ✅ MUI v7 Grid 사용법 */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title="전체 회원 수"
              value={stats.totalMembers || 0}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title="오늘 출석자"
              value={stats.todayAttendance || 0}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title="승인 대기"
              value={stats.pendingUsers || 0}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title="전체 프로그램"
              value={stats.totalPrograms || 0}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title="이번 달 신규"
              value={stats.totalNewUsersThisMonth || 0}
              color="secondary"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <DashboardCard
              title={stats.topSubProgram || "탑구B"}
              value="대관"
              color="error"
            />
          </Grid>
        </Grid>

        {/* 차트 섹션 */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                minHeight: 400
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                월별 실적 통계
              </Typography>
              <AttendancePerformanceChart 
                data={performanceData} 
                type="performance" 
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                minHeight: 400
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                최근 7일간 실적 통계
              </Typography>
              <AttendancePerformanceChart 
                data={attendanceData} 
                type="attendance" 
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ErrorBoundary>
  );
}

export default Dashboard;
