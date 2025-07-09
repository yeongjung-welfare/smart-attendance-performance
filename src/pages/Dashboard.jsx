import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import AttendancePerformanceChart from "../components/AttendancePerformanceChart";
import ErrorBoundary from "../components/ErrorBoundary";
import { fetchProgramStructure } from "../api/fetchProgramStructure";

function Dashboard({ role }) {
  const [programStructure, setProgramStructure] = useState(null);
  const [programError, setProgramError] = useState(null);

  useEffect(() => {
    fetchProgramStructure()
      .then((data) => {
        console.log("✅ 프로그램 구조 불러오기 성공:", data);
        setProgramStructure(data);
      })
      .catch((err) => {
        console.error("❌ 프로그램 구조 호출 실패:", err.message);
        setProgramError(err.message);
      });
  }, []);

  const stats = {
    totalMembers: 120,
    todayAttendance: 87,
    pendingUsers: 3,
    totalPrograms: 8,
    totalTeachers: 5
  };

  // 예시 차트 데이터 (실제 운영시 API 연동)
  const performanceData = [
    { date: "2025-01", 실적: 30 },
    { date: "2025-02", 실적: 45 },
    { date: "2025-03", 실적: 50 },
    { date: "2025-04", 실적: 40 },
    { date: "2025-05", 실적: 60 }
  ];
  const attendanceData = [
    { date: "2025-07-01", 출석: 80 },
    { date: "2025-07-02", 출석: 90 },
    { date: "2025-07-03", 출석: 87 }
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">대시보드</h2>

      {programError && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          프로그램 구조 로딩 실패: {programError}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-8">
        <DashboardCard title="전체 회원 수" value={stats.totalMembers} color="primary" />
        <DashboardCard title="오늘 출석" value={stats.todayAttendance} color="success" />
        <DashboardCard title="승인 대기자" value={stats.pendingUsers} color="warning" />
        <DashboardCard title="프로그램 수" value={stats.totalPrograms} color="info" />
        <DashboardCard title="강사 수" value={stats.totalTeachers} color="secondary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ErrorBoundary>
          <AttendancePerformanceChart mode="performance" data={performanceData} />
        </ErrorBoundary>
        <ErrorBoundary>
          <AttendancePerformanceChart mode="attendance" data={attendanceData} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default Dashboard;