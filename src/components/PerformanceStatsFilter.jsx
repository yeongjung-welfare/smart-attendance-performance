import React from "react";
import { TextField, MenuItem, Button } from "@mui/material";

const functions = ["서비스제공기능", "사례관리기능", "지역조직화기능"];
const protectionOptions = [
  "전체", "기초생활수급자", "차상위계층", "장애인", "한부모가정", "국가유공자", "일반"
];
const genderOptions = ["전체", "남", "여"];
const ageGroups = [
  "전체", "0~9세(영유아)", "10대", "20대", "30대", "40대", "50대", "60대", "70대 이상"
];
const paidOptions = ["전체", "유료", "무료"];

function PerformanceStatsFilter({ filters, setFilters, onReset }) {
  return (
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
        {functions.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
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
        label="성별"
        select
        size="small"
        value={filters.gender}
        onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}
        sx={{ minWidth: 80 }}
      >
        {genderOptions.map(g => <MenuItem key={g} value={g === "전체" ? "" : g}>{g}</MenuItem>)}
      </TextField>
      <TextField
        label="연령대"
        select
        size="small"
        value={filters.ageGroup}
        onChange={e => setFilters(f => ({ ...f, ageGroup: e.target.value }))}
        sx={{ minWidth: 120 }}
      >
        {ageGroups.map(a => <MenuItem key={a} value={a === "전체" ? "" : a}>{a}</MenuItem>)}
      </TextField>
      <TextField
        label="보호구분"
        select
        size="small"
        value={filters.protectionStatus}
        onChange={e => setFilters(f => ({ ...f, protectionStatus: e.target.value }))}
        sx={{ minWidth: 120 }}
      >
        {protectionOptions.map(p => <MenuItem key={p} value={p === "전체" ? "" : p}>{p}</MenuItem>)}
      </TextField>
      <TextField
        label="유/무료"
        select
        size="small"
        value={filters.paidType}
        onChange={e => setFilters(f => ({ ...f, paidType: e.target.value }))}
        sx={{ minWidth: 80 }}
      >
        {paidOptions.map(p => <MenuItem key={p} value={p === "전체" ? "" : p}>{p}</MenuItem>)}
      </TextField>
      <TextField
        label="조회월"
        type="month"
        size="small"
        value={filters.month}
        onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
      <Button onClick={onReset}>초기화</Button>
    </div>
  );
}

export default PerformanceStatsFilter;