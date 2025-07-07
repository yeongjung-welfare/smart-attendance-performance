import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";

// 세부사업명을 기반으로 기능/단위사업명을 찾아주는 헬퍼
function mapStructure(subProgram, structure) {
  for (const func in structure) {
    for (const unit in structure[func]) {
      if (structure[func][unit].includes(subProgram)) {
        return { function: func, unit: unit };
      }
    }
  }
  return { function: "", unit: "" }; // 못 찾으면 빈 값 반환
}

function PerformanceTable({ performances, onEdit, structure }) {
  // columns 정의
  const columns = [
    {
      field: "function",
      headerName: "기능",
      width: 140,
      valueGetter: (params) =>
        mapStructure(params.row.subProgram, structure).function,
    },
    {
      field: "unit",
      headerName: "단위사업명",
      width: 160,
      valueGetter: (params) =>
        mapStructure(params.row.subProgram, structure).unit,
    },
    { field: "subProgram", headerName: "세부사업명", width: 150 },
    { field: "name", headerName: "이름", width: 100 },
    { field: "result", headerName: "실적", width: 100 },
    { field: "date", headerName: "날짜", width: 110 },
    { field: "note", headerName: "비고", width: 150 },
    {
      field: "actions",
      headerName: "관리",
      width: 100,
      renderCell: (params) => (
        <Button size="small" onClick={() => onEdit(params.row)}>
          수정
        </Button>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", minWidth: 900 }}>
      <DataGrid
        rows={performances}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        autoHeight
        disableSelectionOnClick
        getRowId={(row) => row.id}
      />
    </div>
  );
}

export default PerformanceTable;