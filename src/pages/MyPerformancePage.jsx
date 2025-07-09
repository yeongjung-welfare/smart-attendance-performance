import React, { useEffect, useState } from "react";
import { fetchPerformanceStats } from "../services/performanceStatsAPI";
import { useUserRole } from "../hooks/useUserRole";
import PerformanceSummaryTable from "../components/PerformanceSummaryTable";

function MyPerformancePage() {
  const { role, uid } = useUserRole();
  const [stats, setStats] = useState([]);
  useEffect(() => {
    if (uid) {
      fetchPerformanceStats({ userId: uid }).then(setStats);
    }
  }, [uid]);
  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">내 실적</h2>
      <PerformanceSummaryTable summaries={stats} loading={false} />
    </div>
  );
}

export default MyPerformancePage;