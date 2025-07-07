import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { TextField, MenuItem, Button } from "@mui/material";

function AttendanceStats({ data, onFilter }) {
  const [filters, setFilters] = useState({
    date: "",
    function: "",
    unit: "",
    subProgram: "",
    name: ""
  });

  // 필터링된 데이터 계산
  const filtered = data.filter(row =>
    (!filters.date || row.date === filters.date) &&
    (!filters.function || row.function === filters.function) &&
    (!filters.unit || row.unit === filters.unit) &&
    (!filters.subProgram || row.subProgram === filters.subProgram) &&
    (!filters.name || row.name.includes(filters.name))
  );

  // 필터 결과를 부모로 전달
  useEffect(() => {
    if (onFilter) onFilter(filtered);
  }, [filtered, onFilter]);

  const columns = [
    { field: "date", headerName: "날짜", width: 110 },
    { field: "function", headerName: "기능", width: 120 },
    { field: "unit", headerName: "단위사업명", width: 130 },
    { field: "subProgram", headerName: "세부사업명", width: 130 },
    { field: "name", headerName: "이름", width: 100 },
    { field: "attended", headerName: "출석", width: 80,
      valueGetter: (params) => params.row.attended ? "O" : "X"
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <TextField
          label="날짜"
          type="date"
          size="small"
          value={filters.date}
          onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
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
          label="이름"
          size="small"
          value={filters.name}
          onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
        />
        <Button onClick={() => setFilters({ date: "", function: "", unit: "", subProgram: "", name: "" })}>
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
        출석률: {filtered.length > 0
          ? Math.round(filtered.filter(r => r.attended).length / filtered.length * 100)
          : 0
        }%
        (출석 {filtered.filter(r => r.attended).length} / 전체 {filtered.length})
      </div>
    </div>
  );
}

export default AttendanceStats;