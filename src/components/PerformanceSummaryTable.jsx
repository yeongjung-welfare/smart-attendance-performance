// PerformanceSummaryTable.jsx
import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PerformanceSummaryDetail from "./PerformanceSummaryDetail";
import { exportToExcel } from "../utils/exportToExcel";

function PerformanceSummaryTable({ summaries }) {
  const [detail, setDetail] = useState(null);

  const excelData = summaries.map((row) => ({
    기능: row.function,
    연도: row.year,
    월: row.month,
    분기: row.quarter,
    팀명: row.team,
    단위사업명: row.unit,
    세부사업명: row.subProgram,
    등록인원: row?.registered?.total ?? 0,
    실인원_남: row?.actual?.male ?? 0,
    실인원_여: row?.actual?.female ?? 0,
    실인원_합: row?.actual?.total ?? 0,
    연인원_남: row?.totalVisits?.male ?? 0,
    연인원_여: row?.totalVisits?.female ?? 0,
    연인원_합: row?.totalVisits?.total ?? 0,
    유료_남: row?.paid?.male ?? 0,
    유료_여: row?.paid?.female ?? 0,
    유료_합: row?.paid?.total ?? 0,
    무료_남: row?.free?.male ?? 0,
    무료_여: row?.free?.female ?? 0,
    무료_합: row?.free?.total ?? 0,
    횟수: row?.sessions ?? 0,
    건수: row?.cases ?? 0
  }));

  const columns = [
    { field: "function", headerName: "기능", width: 100 },
    { field: "year", headerName: "연도", width: 80 },
    { field: "month", headerName: "월", width: 80 },
    { field: "quarter", headerName: "분기", width: 80 },
    { field: "team", headerName: "팀명", width: 120 },
    { field: "unit", headerName: "단위사업명", width: 160 },
    { field: "subProgram", headerName: "세부사업명", width: 200 },
    { field: "registeredTotal", headerName: "등록 인원", width: 100, valueGetter: ({ row }) => row?.registered?.total ?? 0 },
    { field: "actualMale", headerName: "실인원(남)", width: 100, valueGetter: ({ row }) => row?.actual?.male ?? 0 },
    { field: "actualFemale", headerName: "실인원(여)", width: 100, valueGetter: ({ row }) => row?.actual?.female ?? 0 },
    { field: "actualTotal", headerName: "실인원 합", width: 100, valueGetter: ({ row }) => row?.actual?.total ?? 0 },
    { field: "visitMale", headerName: "연인원(남)", width: 100, valueGetter: ({ row }) => row?.totalVisits?.male ?? 0 },
    { field: "visitFemale", headerName: "연인원(여)", width: 100, valueGetter: ({ row }) => row?.totalVisits?.female ?? 0 },
    { field: "visitTotal", headerName: "연인원 합", width: 100, valueGetter: ({ row }) => row?.totalVisits?.total ?? 0 },
    { field: "paidMale", headerName: "유료(남)", width: 100, valueGetter: ({ row }) => row?.paid?.male ?? 0 },
    { field: "paidFemale", headerName: "유료(여)", width: 100, valueGetter: ({ row }) => row?.paid?.female ?? 0 },
    { field: "paidTotal", headerName: "유료 합", width: 100, valueGetter: ({ row }) => row?.paid?.total ?? 0 },
    { field: "freeMale", headerName: "무료(남)", width: 100, valueGetter: ({ row }) => row?.free?.male ?? 0 },
    { field: "freeFemale", headerName: "무료(여)", width: 100, valueGetter: ({ row }) => row?.free?.female ?? 0 },
    { field: "freeTotal", headerName: "무료 합", width: 100, valueGetter: ({ row }) => row?.free?.total ?? 0 },
    { field: "sessions", headerName: "횟수", width: 80, valueGetter: ({ row }) => row?.sessions ?? 0 },
    { field: "cases", headerName: "건수", width: 80, valueGetter: ({ row }) => row?.cases ?? 0 },
    {
      field: "actions",
      headerName: "상세",
      width: 100,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setDetail(params.row)}
        >
          상세보기
        </Button>
      )
    }
  ];

  return (
    <div style={{ minHeight: 400, maxHeight: "60vh", overflowX: "auto", overflowY: "auto" }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        sx={{ mb: 1 }}
        onClick={() =>
          exportToExcel({ data: excelData, fileName: "실적_통계", sheetName: "실적요약" })
        }
      >
        엑셀 다운로드
      </Button>

      <DataGrid
        rows={summaries}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        autoHeight
        getRowId={(row) =>
          row.programId || `${row.function}-${row.unit}-${row.subProgram}-${row.year}-${row.month}-${row.team}`
        }
      />

      {detail && (
        <PerformanceSummaryDetail
          summary={detail}
          onClose={() => setDetail(null)}
        />
      )}

      {(!summaries || summaries.length === 0) && (
        <div className="text-gray-500 mt-8">조회 결과가 없습니다.</div>
      )}
    </div>
  );
}

export default PerformanceSummaryTable;