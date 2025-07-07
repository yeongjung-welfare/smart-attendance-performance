// src/components/PerformanceStats.jsx
import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { TextField, MenuItem, Button } from "@mui/material";

function PerformanceStats({ data, onFilter }) {
  const [filters, setFilters] = useState({
    function: "",
    unit: "",
    subProgram: "",
    month: "",
    name: ""
  });

  // 필터링된 데이터
  const filtered = data.filter(row =>
    (!filters.function || row.function === filters.function) &&
    (!filters.unit || row.unit === filters.unit) &&
    (!filters.subProgram || row.subProgram === filters.subProgram) &&
    (!filters.month || String(row.month) === String(filters.month)) &&
    (!filters.name || row.name.includes(filters.name))
  );

  useEffect(() => {
    if (onFilter) onFilter(filtered);
  }, [filtered, onFilter]);

  const columns = [
    { field: "function", headerName: "기능", width: 120 },
    { field: "unit", headerName: "단위사업명", width: 130 },
    { field: "subProgram", headerName: "세부사업명", width: 130 },
    { field: "실인원", headerName: "실인원", width: 100 },
    { field: "연인원", headerName: "연인원", width: 100 },
    { field: "name", headerName: "이름", width: 100 },
    { field: "result", headerName: "실적", width: 100 },
    { field: "date", headerName: "날짜", width: 110 }
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <TextField
          label="기능"
          select
          size="small"
          value={filters.function}
          onChange={e => setFilters(f => ({ ...f, function: e.target.value }))}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="서비스제공기능">서비스제공기능</MenuItem>
          <MenuItem value="사례관리기능">사례관리기능</MenuItem>
          <MenuItem value="지역조직화기능">지역조직화기능</MenuItem>
        </TextField>
        <TextField
          label="단위사업명"
          size="small"
          value={filters.unit}
          onChange={e => setFilters(f => ({ ...f, unit: e.target.value }))}
        />
        <TextField
          label="세부사업명"
          size="small"
          value={filters.subProgram}
          onChange={e => setFilters(f => ({ ...f, subProgram: e.target.value }))}
        />
        <TextField
          label="월"
          size="small"
          value={filters.month}
          onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
        />
        <TextField
          label="이름"
          size="small"
          value={filters.name}
          onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
        />
        <Button onClick={() => setFilters({ function: "", unit: "", subProgram: "", month: "", name: "" })}>
          초기화
        </Button>
      </div>
      <DataGrid
        rows={filtered}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20, 50]}
        autoHeight
        getRowId={row => row.id}
      />
      <div className="mt-4 font-bold">
        실인원 합계: {filtered.reduce((acc, row) => acc + (row.실인원 || 0), 0)} / 연인원 합계: {filtered.reduce((acc, row) => acc + (row.연인원 || 0), 0)}
      </div>
    </div>
  );
}

export default PerformanceStats;