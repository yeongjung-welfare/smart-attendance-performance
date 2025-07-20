import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchProgramStructure()
      .then((data) => {
        setProgramStructure(data);
      })
      .catch((err) => {
        setProgramError(err.message);
      });

    const loadStats = async () => {
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
    };

    loadStats();
  }, []);

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-full bg-[#f7f9fa] min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">대시보드</h2>

      {programError && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          프로그램 구조 로딩 실패: {programError}
        </div>
      )}

      <div
        className="flex flex-wrap gap-3 sm:gap-4 mb-8"
        style={{
          rowGap: "18px",
          columnGap: "18px"
        }}
      >
        <DashboardCard title="전체 회원 수" value={stats.totalMembers} color="primary" />
        <DashboardCard title="오늘 출석" value={stats.todayAttendance} color="success" />
        <DashboardCard title="승인 대기자" value={stats.pendingUsers} color="warning" />
        <DashboardCard title="프로그램 수" value={stats.totalPrograms} color="info" />
        <DashboardCard title="이달 신규등록자" value={stats.totalNewUsersThisMonth} color="secondary" />
        <DashboardCard title="인기 세부사업" value={stats.topSubProgram || "-"} color="error" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <ErrorBoundary>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 h-full min-h-[300px]">
            <AttendancePerformanceChart mode="performance" data={performanceData} />
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 h-full min-h-[300px]">
            <AttendancePerformanceChart mode="attendance" data={attendanceData} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default Dashboard;