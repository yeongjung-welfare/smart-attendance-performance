// src/pages/PerformanceStatsPage.jsx (전체 수정본)
import React, { useEffect, useState } from "react";
import { fetchPerformanceStats } from "../services/performanceStatsAPI";
import { getAllTeamSubProgramMaps } from "../services/teamSubProgramMapAPI";
import PerformanceStatsTable from "../components/PerformanceStatsTable";
import {
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";
import { useStats } from "../contexts/StatsContext";
import { teamSubProgramMap } from "../data/teamSubProgramMap";

const quarterOptions = [
  { value: "1", label: "1분기(1~3월)" },
  { value: "2", label: "2분기(4~6월)" },
  { value: "3", label: "3분기(7~9월)" },
  { value: "4", label: "4분기(10~12월)" }
];

// ✅ 실적유형 옵션 추가
const performanceTypeOptions = [
  { value: "전체", label: "전체" },
  { value: "개별", label: "개별실적" },
  { value: "대량", label: "대량실적" }
];

function PerformanceStatsPage() {
  const { stats, setStats, filters, setFilters } = useStats();
  const [teamMap, setTeamMap] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllTeamSubProgramMaps().then(setTeamMap);
  }, []);

  // subProgram에서 teamName을 동적으로 매핑하는 함수
  const getTeamName = (subProgram) => {
    for (const [team, subPrograms] of Object.entries(teamSubProgramMap)) {
      if (subPrograms.includes(subProgram)) return team;
    }
    return "미매칭 팀";
  };

  // 🔧 .trim() 보완 적용된 드롭다운 옵션 생성
  const functionOptions = [...new Set(teamMap.map(m => m.functionType?.trim()).filter(Boolean))];
  
  const teamOptions = filters.function
    ? [...new Set(
        teamMap
          .filter(m => m.functionType?.trim() === filters.function?.trim())
          .map(m => m.teamName?.trim())
      )]
    : [...new Set(teamMap.map(m => m.teamName?.trim()))];

  const unitOptions = filters.team
    ? [...new Set(
        teamMap
          .filter(m =>
            m.teamName?.trim() === filters.team?.trim() &&
            (!filters.function || m.functionType?.trim() === filters.function?.trim())
          )
          .map(m => m.mainProgramName?.trim())
      )]
    : [];

  const subProgramOptions = filters.unit
    ? [...new Set(
        teamMap
          .filter(m =>
            m.mainProgramName?.trim() === filters.unit?.trim() &&
            (!filters.team || m.teamName?.trim() === filters.team?.trim())
          )
          .map(m => m.subProgramName?.trim())
      )]
    : [];

  const now = new Date();
  const monthOptions = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(d.toISOString().slice(0, 7));
  }

  // 🔧 필터 변경 시 문자열은 trim() 처리
  const handleFilterChange = (key, value) => {
  let fixedValue = value;

  if (key === "months" && Array.isArray(value)) {
  fixedValue = value.map(v => {
    if (typeof v === "string" && v.length >= 7) {
      // yyyy-MM → MM 그대로 저장
      return v.slice(5, 7).trim().padStart(2, "0");
    }
    return String(v).padStart(2, "0");
  });
}

// ✅ months를 그대로 보존하도록 보완
if (key === "months") {
  setFilters(prev => ({
    ...prev,
    months: fixedValue,
  }));
  return;
}

  const trimmed = typeof fixedValue === "string" ? fixedValue.trim() : fixedValue;

  setFilters(prev => ({
    ...prev,
    [key]: trimmed,
    ...(key === "function" ? { team: "", unit: "", subProgram: "" } : {}),
    ...(key === "team" ? { unit: "", subProgram: "" } : {}),
    ...(key === "unit" ? { subProgram: "" } : {})
  }));
};

  // 집계: 횟수(운영일수)는 프로그램+날짜별 1회로만 합산(출석자 수와 무관)
  const handleSearch = async () => {
    setLoading(true);
    const data = await fetchPerformanceStats(filters);
    // 그대로 setStats에 넣어야 performanceType 손실 없음
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (stats.length === 0) handleSearch();
    // eslint-disable-next-line
  }, [stats.length]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        실적 통계/조회
      </Typography>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>기능</InputLabel>
          <Select
            value={filters.function || ""}
            onChange={(e) => handleFilterChange("function", e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            {functionOptions.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>팀명</InputLabel>
          <Select
            value={filters.team || ""}
            onChange={(e) => handleFilterChange("team", e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            {teamOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>단위사업명</InputLabel>
          <Select
            value={filters.unit || ""}
            onChange={(e) => handleFilterChange("unit", e.target.value)}
            disabled={!filters.team}
          >
            <MenuItem value="">전체</MenuItem>
            {unitOptions.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>세부사업명</InputLabel>
          <Select
            value={filters.subProgram || ""}
            onChange={(e) => handleFilterChange("subProgram", e.target.value)}
            disabled={!filters.unit}
          >
            <MenuItem value="">전체</MenuItem>
            {subProgramOptions.map(sp => <MenuItem key={sp} value={sp}>{sp}</MenuItem>)}
          </Select>
        </FormControl>

        {/* ✅ 실적유형 필터 추가 */}
        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>실적유형</InputLabel>
          <Select
            value={filters.performanceType || "전체"}
            onChange={(e) => handleFilterChange("performanceType", e.target.value)}
          >
            {performanceTypeOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          multiple
          options={monthOptions}
          value={filters.months || []}
          onChange={(_, value) => handleFilterChange("months", value)}
          renderInput={params => (
            <TextField {...params} label="월별(다중)" sx={{ minWidth: 180 }} />
          )}
        />

        <FormControl sx={{ minWidth: 120, background: "#fff" }}>
          <InputLabel>분기(다중)</InputLabel>
          <Select
            multiple
            value={filters.quarters || []}
            onChange={(e) => handleFilterChange("quarters", e.target.value)}
            renderValue={selected => selected.map(q => `${q}분기`).join(", ")}
          >
            {quarterOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={(filters.quarters || []).indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          {loading ? "조회중..." : "조회"}
        </Button>
      </div>

      <PerformanceStatsTable data={stats} loading={loading} />
    </Paper>
  );
}

export default PerformanceStatsPage;