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

const quarterOptions = [
  { value: "1", label: "1분기(1~3월)" },
  { value: "2", label: "2분기(4~6월)" },
  { value: "3", label: "3분기(7~9월)" },
  { value: "4", label: "4분기(10~12월)" }
];

function PerformanceStatsPage() {
  const [teamMap, setTeamMap] = useState([]);
  const [filters, setFilters] = useState({
    function: "",
    team: "",
    unit: "",
    subProgram: "",
    months: [],
    quarters: []
  });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // 매핑 불러오기
  useEffect(() => {
    getAllTeamSubProgramMaps().then(setTeamMap);
  }, []);

  // 고정 옵션 (기능/팀명)
  const functionOptions = ["서비스제공기능", "지역조직화기능", "사례관리기능"];
  const teamOptions = [
    "서비스제공연계팀",
    "사례관리팀",
    "마을협력팀",
    "운영지원팀",
    "마을돌봄팀"
  ];

  // 동적 옵션 (단위/세부사업명)
  const unitOptions = filters.team
    ? [...new Set(teamMap.filter(m => m.teamName === filters.team && (!filters.function || m.functionType === filters.function)).map(m => m.mainProgramName))]
    : [];
  const subProgramOptions = filters.unit
    ? [...new Set(teamMap.filter(m => m.mainProgramName === filters.unit && (!filters.team || m.teamName === filters.team)).map(m => m.subProgramName))]
    : [];

  // 월 옵션(YYYY-MM, 최근 24개월)
  const now = new Date();
  const monthOptions = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(d.toISOString().slice(0, 7));
  }

  // 필터 변경
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === "function" ? { team: "", unit: "", subProgram: "" } : {}),
      ...(key === "team" ? { unit: "", subProgram: "" } : {}),
      ...(key === "unit" ? { subProgram: "" } : {})
    }));
  };

  // 조회
  const handleSearch = async () => {
    setLoading(true);
    const data = await fetchPerformanceStats({
      function: filters.function,
      team: filters.team,
      unit: filters.unit,
      subProgram: filters.subProgram,
      months: filters.months,
      quarters: filters.quarters
    });
    setStats(data);
    setLoading(false);
  };

  return (
    <Paper className="p-4 max-w-screen-xl mx-auto">
      <Typography variant="h5" gutterBottom>실적 통계/조회</Typography>
      <div className="flex flex-wrap gap-2 mb-6">
        <TextField
          select
          label="기능"
          value={filters.function}
          onChange={e => handleFilterChange("function", e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">전체</MenuItem>
          {functionOptions.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="팀명"
          value={filters.team}
          onChange={e => handleFilterChange("team", e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">전체</MenuItem>
          {teamOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="단위사업명"
          value={filters.unit}
          onChange={e => handleFilterChange("unit", e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={!filters.team}
        >
          <MenuItem value="">전체</MenuItem>
          {unitOptions.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="세부사업명"
          value={filters.subProgram}
          onChange={e => handleFilterChange("subProgram", e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={!filters.unit}
        >
          <MenuItem value="">전체</MenuItem>
          {subProgramOptions.map(sp => <MenuItem key={sp} value={sp}>{sp}</MenuItem>)}
        </TextField>
        <Autocomplete
          multiple
          options={monthOptions}
          value={filters.months}
          onChange={(_, value) => handleFilterChange("months", value)}
          renderInput={params => (
            <TextField {...params} label="월(복수선택)" sx={{ minWidth: 180 }} />
          )}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>분기(다중)</InputLabel>
          <Select
            multiple
            value={filters.quarters}
            onChange={e => handleFilterChange("quarters", e.target.value)}
            renderValue={selected => selected.map(q => `${q}분기`).join(", ")}
          >
            {quarterOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Checkbox checked={filters.quarters.indexOf(opt.value) > -1} />
                <ListItemText primary={opt.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearch} disabled={loading}>조회</Button>
      </div>
      <PerformanceStatsTable data={stats} loading={loading} />
    </Paper>
  );
}

export default PerformanceStatsPage;