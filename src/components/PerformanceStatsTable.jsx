import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import ExportButton from "./ExportButton";
import PerformanceSummaryDetail from "./PerformanceSummaryDetail";
import DownloadIcon from "@mui/icons-material/Download";
import { Button } from "@mui/material";

function PerformanceStatsTable({ data, loading }) {
  const [detail, setDetail] = useState(null);

  const columns = [
    { field: "function", headerName: "기능", width: 100 },
    { field: "year", headerName: "연도", width: 80 },
    { field: "month", headerName: "월", width: 80 },
    { field: "quarter", headerName: "분기", width: 80 },
    { field: "team", headerName: "팀명", width: 120 },
    { field: "unit", headerName: "단위사업명", width: 140 },
    { field: "subProgram", headerName: "세부사업명", width: 160 },
    { field: "registered", headerName: "등록 인원", width: 100 },
    { field: "actualMale", headerName: "실인원(남)", width: 100 },
    { field: "actualFemale", headerName: "실인원(여)", width: 100 },
    { field: "actualTotal", headerName: "실인원 합", width: 100 },
    { field: "totalMale", headerName: "연인원(남)", width: 100 },
    { field: "totalFemale", headerName: "연인원(여)", width: 100 },
    { field: "totalSum", headerName: "연인원 합", width: 100 },
    { field: "paidMale", headerName: "유료(남)", width: 100 },
    { field: "paidFemale", headerName: "유료(여)", width: 100 },
    { field: "paidSum", headerName: "유료 합", width: 100 },
    { field: "freeMale", headerName: "무료(남)", width: 100 },
    { field: "freeFemale", headerName: "무료(여)", width: 100 },
    { field: "freeSum", headerName: "무료 합", width: 100 },
    { field: "sessions", headerName: "횟수", width: 80 },
    { field: "cases", headerName: "건수", width: 80 },
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
    <div className="my-4">
      <ExportButton data={data} fileName="실적통계.xlsx" label="엑셀 다운로드" />
      <DataGrid
        rows={data}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        autoHeight
        getRowId={row => row.id || `${row.function}-${row.unit}-${row.subProgram}-${row.year}-${row.month}-${row.team}`}
        loading={loading}
      />
      {detail && (
        <PerformanceSummaryDetail
          summary={detail}
          onClose={() => setDetail(null)}
        />
      )}
      {(!data || data.length === 0) && (
        <div className="text-gray-500 mt-8">조회 결과가 없습니다.</div>
      )}
    </div>
  );
}

export default PerformanceStatsTable;