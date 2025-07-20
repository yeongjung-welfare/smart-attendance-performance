import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { TextField, MenuItem, Button } from "@mui/material";
import AttendancePerformanceChart from "./AttendancePerformanceChart";
import ExportButton from "./ExportButton";
import { teamSubProgramMap } from "../data/teamSubProgramMap"; // 팀-세부사업 매핑 데이터 추가

const functionOptions = ["서비스제공기능", "사례관리기능", "지역조직화기능"];
const genderOptions = ["", "남", "여"];
const paidOptions = ["", "유료", "무료"];
const ageGroups = [
  "", "0~9세(영유아)", "10대", "20대", "30대", "40대", "50대", "60대", "70대 이상"
];
const protectionOptions = [
  "", "기초생활수급자", "차상위계층", "장애인", "한부모가정", "국가유공자", "일반"
];

function AttendancePerformanceStats({ mode, data, onFilter }) {
  const [filters, setFilters] = useState({
    date: "",
    function: "",
    unit: "",
    subProgram: "",
    name: "",
    gender: "",
    paidType: "",
    ageGroup: "",
    protectionStatus: "",
    month: "",
    userId: ""
  });

  // subProgram에서 teamName을 동적으로 매핑하는 함수
  const getTeamName = (subProgram) => {
    for (const [team, subPrograms] of Object.entries(teamSubProgramMap)) {
      if (subPrograms.includes(subProgram)) return team;
    }
    return "미매칭 팀"; // 매핑되지 않으면 기본값
  };

  // 데이터에 teamName을 동적으로 추가
  const enrichedData = data.map(row => ({
    ...row,
    teamName: row.teamName || getTeamName(row.subProgram) // teamName이 없으면 매핑
  }));

  const filtered = enrichedData.filter(row =>
    (!filters.date || row.date === filters.date) &&
    (!filters.function || row.function === filters.function) &&
    (!filters.unit || row.unit === filters.unit) &&
    (!filters.subProgram || row.subProgram === filters.subProgram) &&
    (!filters.name || row.name.includes(filters.name)) &&
    (!filters.gender || row.gender === filters.gender) &&
    (!filters.paidType || row.paidType === filters.paidType) &&
    (!filters.ageGroup || row.ageGroup === filters.ageGroup) &&
    (!filters.protectionStatus || row.protectionStatus === filters.protectionStatus) &&
    (!filters.month || (row.date && row.date.startsWith(filters.month))) &&
    (!filters.userId || row.userId === filters.userId)
  );

  useEffect(() => {
    if (onFilter) onFilter(filtered);
  }, [filtered, onFilter]);

  // 실인원(고유아이디 기준 중복 없는 인원) 집계
  const uniqueUserCount = new Set(filtered.map(r => r.userId)).size;
  // 연인원(전체 건수)
  const totalCount = filtered.length;
  // 출석자 수(출석여부 true)
  const attendedCount = filtered.filter(r => r.attended).length;

  const columns = mode === "attendance"
    ? [
        { field: "userId", headerName: "고유아이디", width: 120 },
        { field: "date", headerName: "날짜", width: 110 },
        { field: "function", headerName: "기능", width: 120 }, // 기능 추가
        { field: "unit", headerName: "단위사업명", width: 130 }, // 단위사업명 추가
        { field: "subProgram", headerName: "세부사업명", width: 130 },
        { field: "name", headerName: "이용자명", width: 100 },
        { field: "gender", headerName: "성별", width: 80 },
        { field: "attended", headerName: "출석여부", width: 80,
          valueGetter: (params) => params.row.attended ? "출석" : "결석"
        },
        { field: "teamName", headerName: "팀명", width: 120 } // 팀명 추가
      ]
    : [
        { field: "userId", headerName: "고유아이디", width: 120 },
        { field: "date", headerName: "날짜", width: 110 },
        { field: "function", headerName: "기능", width: 120 }, // 기능 추가
        { field: "unit", headerName: "단위사업명", width: 130 }, // 단위사업명 추가
        { field: "subProgram", headerName: "세부사업명", width: 130 },
        { field: "name", headerName: "이용자명", width: 100 },
        { field: "gender", headerName: "성별", width: 80 },
        { field: "paidType", headerName: "유/무료", width: 80 },
        { field: "ageGroup", headerName: "연령대", width: 100 },
        { field: "protectionStatus", headerName: "보호구분", width: 110 },
        { field: "result", headerName: "출석여부", width: 100 },
        { field: "note", headerName: "내용(특이사항)", width: 120 },
        { field: "teamName", headerName: "팀명", width: 120 } // 팀명 추가
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
          {functionOptions.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
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
          label="이용자명"
          size="small"
          value={filters.name}
          onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
        />
        <TextField
          label="고유아이디"
          size="small"
          value={filters.userId}
          onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
        />
        {mode === "performance" && (
          <>
            <TextField
              label="성별"
              select
              size="small"
              value={filters.gender}
              onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value="">전체</MenuItem>
              {genderOptions.slice(1).map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
            <TextField
              label="유/무료"
              select
              size="small"
              value={filters.paidType}
              onChange={e => setFilters(f => ({ ...f, paidType: e.target.value }))}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value="">전체</MenuItem>
              {paidOptions.slice(1).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField
              label="연령대"
              select
              size="small"
              value={filters.ageGroup}
              onChange={e => setFilters(f => ({ ...f, ageGroup: e.target.value }))}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="">전체</MenuItem>
              {ageGroups.slice(1).map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField
              label="보호구분"
              select
              size="small"
              value={filters.protectionStatus}
              onChange={e => setFilters(f => ({ ...f, protectionStatus: e.target.value }))}
              sx={{ minWidth: 110 }}
            >
              <MenuItem value="">전체</MenuItem>
              {protectionOptions.slice(1).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField
              label="조회월"
              type="month"
              size="small"
              value={filters.month}
              onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}
        <Button onClick={() => setFilters({
          date: "", function: "", unit: "", subProgram: "", name: "",
          gender: "", paidType: "", ageGroup: "", protectionStatus: "", month: "", userId: ""
        })}>
          초기화
        </Button>
      </div>

      <AttendancePerformanceChart mode={mode} data={filtered} />

      <div className="my-2">
        <ExportButton
          data={filtered}
          fileName={mode === "attendance" ? "출석통계.xlsx" : "실적통계.xlsx"}
          label="엑셀 다운로드"
          headers={mode === "attendance" ? [
            ["고유아이디", "userId"],
            ["날짜", "date"],
            ["기능", "function"],
            ["단위사업명", "unit"],
            ["세부사업명", "subProgram"],
            ["이용자명", "name"],
            ["성별", "gender"],
            ["출석여부", "attended", (v) => v ? "출석" : "결석"],
            ["팀명", "teamName"]
          ] : [
            ["고유아이디", "userId"],
            ["날짜", "date"],
            ["기능", "function"],
            ["단위사업명", "unit"],
            ["세부사업명", "subProgram"],
            ["이용자명", "name"],
            ["성별", "gender"],
            ["유/무료", "paidType"],
            ["연령대", "ageGroup"],
            ["보호구분", "protectionStatus"],
            ["출석여부", "result"],
            ["내용(특이사항)", "note"],
            ["팀명", "teamName"]
          ]}
        />
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
        {mode === "attendance"
          ? <>실인원(중복 없는 인원): {uniqueUserCount}명 / 출석률: {totalCount > 0 ? Math.round(attendedCount / totalCount * 100) : 0}% (출석 {attendedCount} / 전체 {totalCount})</>
          : <>실적 건수: {totalCount}건 / 실인원(중복 없는 인원): {uniqueUserCount}명</>
        }
      </div>
    </div>
  );
}

export default AttendancePerformanceStats;