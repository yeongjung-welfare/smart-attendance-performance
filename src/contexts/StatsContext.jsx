// src/contexts/StatsContext.jsx (기존 기능 유지하면서 확장)
import React, { createContext, useState, useContext, useCallback } from "react";

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    function: "",
    team: "",
    unit: "",
    subProgram: "",
    months: [],
    quarters: [],
    performanceType: "전체" // ✅ 새로 추가
  });

  // ✅ 통계 업데이트 함수 추가
  const updateStats = useCallback((newStats) => {
    setStats(newStats);
    setError(null);
  }, []);

  // ✅ 필터 리셋 함수 추가
  const resetFilters = useCallback(() => {
    setFilters({
      function: "",
      team: "",
      unit: "",
      subProgram: "",
      months: [],
      quarters: [],
      performanceType: "전체"
    });
  }, []);

  // ✅ 로딩 상태 관리 함수 추가
  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  // ✅ 에러 상태 관리 함수 추가
  const setErrorState = useCallback((errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  }, []);

  // ✅ 통계 데이터 클리어 함수 추가
  const clearStats = useCallback(() => {
    setStats([]);
    setError(null);
    setLoading(false);
  }, []);

  const value = {
    stats,
    setStats: updateStats,
    filters,
    setFilters,
    loading,
    setLoading: setLoadingState,
    error,
    setError: setErrorState,
    // ✅ 추가된 헬퍼 함수들
    resetFilters,
    clearStats
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
}
