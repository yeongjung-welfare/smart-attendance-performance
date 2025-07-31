// src/components/PerformanceStatsTable.jsx (페이지네이션 수정)

import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import ExportButton from "./ExportButton";
import PerformanceSummaryDetail from "./PerformanceSummaryDetail";
import DownloadIcon from "@mui/icons-material/Download";
import { Button, Box, Typography, CircularProgress, Alert } from "@mui/material";
import { fetchAttendanceList } from "../services/performanceStatsAPI"; // 상단에 추가

function PerformanceStatsTable({ data, loading }) {
  console.log("[PerformanceStatsTable] 원본 stats 데이터 길이:", Array.isArray(data) ? data.length : 0);
  const [detail, setDetail] = useState(null);
  // ✅ 페이지네이션 상태 추가
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });

  // ✅ 안전한 데이터 처리 (기존 로직 완전 유지)
  const safeData = useMemo(() => {
  if (!Array.isArray(data)) return [];
const rawJanCount = data.filter(
    (row) =>
      row.subProgram?.includes("어르신 라인댄스") &&
      String(row.month).padStart(2, "0") === "01"
  ).length;
   console.log("[LOG][PerformanceStatsTable] 원본 data 기준 1월 어르신 라인댄스 건수:", rawJanCount);

  const mapped = data.map((row, idx) => {
    const monthStr =
  row.month && row.month.length === 2
    ? row.month
    : String(row.month).padStart(2, "0");
    const key = [
      row.function,
      row.team,
      row.unit,
      row.subProgram,
      row.year,
      monthStr,
      row.quarter,
    ].join("|");
    console.log("[UI_KEY]", key);
    return { ...row, id: row.id ?? idx, month: monthStr };
  });
// 1월 어르신 라인댄스 건수 확인 (safeData 기준)
  const safeJanCount = mapped.filter(
    (row) =>
      row.subProgram?.includes("어르신 라인댄스") &&
      row.month === "01"
  ).length;
  console.log("[LOG][PerformanceStatsTable] safeData 기준 1월 어르신 라인댄스 건수:", safeJanCount);

  return mapped;
}, [data]);

  // ✅ 기존 컬럼 정의 완전 유지 + 실적유형 컬럼 추가
  const columns = [
    { field: "function", headerName: "기능", width: 100 },
    { field: "team", headerName: "팀명", width: 120 },
    { field: "unit", headerName: "단위사업명", width: 140 },
    { field: "subProgram", headerName: "세부사업명", width: 160 },
    { 
      field: "performanceType", 
      headerName: "실적유형", 
      width: 100,
      renderCell: (params) => (
        <Box sx={{ 
          px: 1, 
          py: 0.5, 
          borderRadius: 1,
          backgroundColor: params.value === "대량" ? "warning.light" : "info.light",
          color: params.value === "대량" ? "warning.dark" : "info.dark",
          fontSize: "0.75rem",
          fontWeight: 600
        }}>
          {params.value || "개별"}
        </Box>
      )
    },
    { field: "year", headerName: "연도", width: 80 },
    { field: "month", headerName: "월", width: 80 },
    { field: "quarter", headerName: "분기", width: 80 },
    { field: "registered", headerName: "등록 인원", width: 100, type: "number" },
    { field: "actualMale", headerName: "실인원(남)", width: 100, type: "number" },
    { field: "actualFemale", headerName: "실인원(여)", width: 100, type: "number" },
    { field: "actualTotal", headerName: "실인원 합", width: 100, type: "number" },
    { field: "totalMale", headerName: "연인원(남)", width: 100, type: "number" },
    { field: "totalFemale", headerName: "연인원(여)", width: 100, type: "number" },
    { field: "totalSum", headerName: "연인원 합", width: 100, type: "number" },
    { field: "paidMale", headerName: "유료(남)", width: 100, type: "number" },
    { field: "paidFemale", headerName: "유료(여)", width: 100, type: "number" },
    { field: "paidSum", headerName: "유료 합", width: 100, type: "number" },
    { field: "freeMale", headerName: "무료(남)", width: 100, type: "number" },
    { field: "freeFemale", headerName: "무료(여)", width: 100, type: "number" },
    { field: "freeSum", headerName: "무료 합", width: 100, type: "number" },
    {
      field: "sessions",
      headerName: "횟수(운영일수)",
      width: 120,
      type: "number",
      renderCell: (params) => {
        // ✅ 기존 로직 완전 유지
        if (params.row.performanceType?.trim() === "대량") return "";
        return params.value ?? 0;
      }
    },
    { field: "cases", headerName: "건수", width: 80, type: "number" },
    {
  field: "actions",
  headerName: "상세",
  width: 100,
  sortable: false,
  filterable: false,
  disableColumnMenu: true,
  renderCell: (params) => (
    <Button
      onClick={async () => {
        // ✅ 상세보기 클릭 시 Firestore에서 raw 참여자 목록 조회
        const details = await fetchAttendanceList({
          function: params.row.function,
          team: params.row.team,
          unit: params.row.unit,
          subProgram: params.row.subProgram,
          year: params.row.year,
          month: params.row.month
        });
console.log("[LOG] fetchAttendanceList 호출 파라미터 month:", params.row.month);
        setDetail({
          function: params.row.function,
          team: params.row.team,
          unit: params.row.unit,
          subProgram: params.row.subProgram,
          year: params.row.year,
          month: params.row.month,
          quarter: params.row.quarter,
          sessions: params.row.performanceType?.trim() === "대량" ? "" : params.row.sessions,
          cases: params.row.cases,
          registered: {
            male: params.row.registeredMale ?? 0,
            female: params.row.registeredFemale ?? 0,
            total: params.row.registered ?? 0
          },
          actual: {
            male: params.row.actualMale ?? 0,
            female: params.row.actualFemale ?? 0,
            total: params.row.actualTotal ?? 0
          },
          totalVisits: {
            male: params.row.totalMale ?? 0,
            female: params.row.totalFemale ?? 0,
            total: params.row.totalSum ?? 0
          },
          paid: {
            male: params.row.paidMale ?? 0,
            female: params.row.paidFemale ?? 0,
            total: params.row.paidSum ?? 0
          },
          free: {
            male: params.row.freeMale ?? 0,
            female: params.row.freeFemale ?? 0,
            total: params.row.freeSum ?? 0
          },
          details // ✅ 새로 불러온 참여자 목록 포함
        });
      }}
      startIcon={<DownloadIcon />}
    >
      상세
    </Button>
  )
}
  ];

  // ✅ 로딩 상태 처리
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          통계 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // ✅ 데이터 없음 상태 처리
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        표시할 통계 데이터가 없습니다.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* ✅ 기존 ExportButton 완전 유지 */}
      <ExportButton
  data={safeData.map((row, idx) => {
    if (
      row.subProgram.includes("어르신 라인댄스") &&
      String(row.month).padStart(2, "0") === "01"
    ) {
      console.log("[LOG] ExportButton data map에 포함된 1월 어르신 라인댄스 row:", row);
    }
    const key = [
      row.function,
      row.team,
      row.unit,
      row.subProgram,
      row.year,
      row.month,
      row.quarter,
    ].join("|");
    console.log("[EXCEL_KEY]", key);

    const perfType =
      typeof row.performanceType === "string" &&
      row.performanceType.trim() === "대량"
        ? "대량"
        : "개별";

    const sessionsVal = perfType === "대량" ? "" : row.sessions ?? 0;

    return {
      id: row.id ?? idx,
      function: row.function ?? "",
      team: row.team ?? "",
      unit: row.unit ?? "",
      subProgram: row.subProgram ?? "",
      year: row.year ?? "",
      month: String(row.month).padStart(2, "0"), // ← 반드시 2자리 문자열
      quarter: row.quarter ?? "",
      performanceType: perfType,
      registered: row.registered ?? 0,
      actualMale: row.actualMale ?? 0,
      actualFemale: row.actualFemale ?? 0,
      actualTotal: row.actualTotal ?? 0,
      totalMale: row.totalMale ?? 0,
      totalFemale: row.totalFemale ?? 0,
      totalSum: row.totalSum ?? 0,
      paidMale: row.paidMale ?? 0,
      paidFemale: row.paidFemale ?? 0,
      paidSum: row.paidSum ?? 0,
      freeMale: row.freeMale ?? 0,
      freeFemale: row.freeFemale ?? 0,
      freeSum: row.freeSum ?? 0,
      sessions: sessionsVal,
      cases: row.cases ?? 0,
    };
  })}
  fileName="실적통계.xlsx"
  label="엑셀 다운로드"
  headers={[
    ["function", "기능"],
    ["team", "팀명"],
    ["unit", "단위사업명"],
    ["subProgram", "세부사업명"],
    ["year", "연도"],
    ["month", "월"],
    ["quarter", "분기"],
    ["performanceType", "실적유형"],
    ["registered", "등록 인원"],
    ["actualMale", "실인원(남)"],
    ["actualFemale", "실인원(여)"],
    ["actualTotal", "실인원 합"],
    ["totalMale", "연인원(남)"],
    ["totalFemale", "연인원(여)"],
    ["totalSum", "연인원 합"],
    ["paidMale", "유료(남)"],
    ["paidFemale", "유료(여)"],
    ["paidSum", "유료 합"],
    ["freeMale", "무료(남)"],
    ["freeFemale", "무료(여)"],
    ["freeSum", "무료 합"],
    ["sessions", "횟수(운영일수)"],
    ["cases", "건수"],
  ]}
  onClick={() => {
    const suspected = safeData.filter(
      (r) =>
        typeof r.performanceType === "string" &&
        r.performanceType.trim() === "대량" &&
        String(r.month).padStart(2, "0") === "01" &&
        r.subProgram.includes("어르신 라인댄스")
    );
    console.log("대량 어르신 라인댄스 1월 데이터(safeData):", suspected);

    console.log(
      "원본 데이터 어르신 라인댄스 1월:",
      data.filter(
        (row) =>
          row.subProgram.includes("어르신 라인댄스") &&
          String(row.month).padStart(2, "0") === "01"
      )
    );
  }}
/>

      {/* ✅ DataGrid - 페이지네이션 문제 완전 해결 */}
      <DataGrid
        rows={safeData}
        columns={columns}
        // ✅ 페이지네이션 모델 제대로 연결
        paginationModel={paginationModel}
        onPaginationModelChange={(newModel) => {
          console.log("📊 페이지네이션 변경:", newModel);
          setPaginationModel(newModel);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        autoHeight
        getRowId={(row) => row.id}
        disableSelectionOnClick
        hideFooterSelectedRowCount
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8f9fa",
            fontWeight: 600,
            fontSize: "0.9rem"
          },
          "& .MuiDataGrid-cell": {
            fontSize: { xs: "0.85rem", sm: "0.9rem" }
          },
          "& .MuiDataGrid-row": {
            "&:hover": { backgroundColor: "#f5f5f5" }
          }
        }}
      />

      {/* ✅ 기존 detail 모달 완전 유지 */}
      {detail && (
  <PerformanceSummaryDetail
  summary={detail}
  onClose={() => setDetail(null)}
/>
)}
    </Box>
  );
}

export default PerformanceStatsTable;