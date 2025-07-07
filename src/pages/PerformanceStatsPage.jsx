// src/pages/PerformanceStatsPage.jsx
import React, { useState, useEffect } from "react";
import {
  TextField,
  MenuItem,
  Button,
  Autocomplete
} from "@mui/material";
import {
  fetchPerformances,
  generateExtendedPerformanceSummaries as generatePerformanceSummaries
} from "../services/performanceAPI";
import { useProgramStructure } from "../hooks/useProgramStructure";
import PerformanceSummaryTable from "../components/PerformanceSummaryTable";
import ExportButton from "../components/ExportButton";

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const m = `${i + 1}`.padStart(2, "0");
  return { label: `${i + 1}월`, value: m };
});

function PerformanceStatsPage() {
  const structure = useProgramStructure();

  const [performanceSummaries, setPerformanceSummaries] = useState([]);
  const [filters, setFilters] = useState({
    function: "",
    unit: "",
    subProgram: "",
    months: [],
    quarter: ""
  });
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchPerformances()
      .then((raw) => {
        const summarized = generatePerformanceSummaries(raw);
        setPerformanceSummaries(summarized);
        setFiltered(summarized); // 최초 설정
      })
      .catch((err) => console.error("실적 불러오기 실패:", err));
  }, []);

  const functionOptions = Object.keys(structure).sort();
  const unitOptions = filters.function
    ? Object.keys(structure[filters.function] || {}).sort()
    : [];
  const subProgramOptions = filters.function && filters.unit
    ? (structure[filters.function][filters.unit] || []).sort()
    : [];

  const handleSearch = () => {
    let data = performanceSummaries;

    if (filters.function) {
      data = data.filter(d => d.function === filters.function);
    }
    if (filters.unit) {
      data = data.filter(d => d.unit === filters.unit);
    }
    if (filters.subProgram) {
      data = data.filter(d => d.subProgram === filters.subProgram);
    }
    if (filters.months.length > 0) {
      data = data.filter(d => {
        if (!d.date) return false;
        const m = d.date.slice(5, 7);
        return filters.months.includes(m);
      });
    }
    if (filters.quarter) {
      const q = parseInt(filters.quarter, 10);
      const start = (q - 1) * 3 + 1;
      const end = q * 3;
      data = data.filter(d => {
        if (!d.date) return false;
        const m = parseInt(d.date.slice(5, 7), 10);
        return m >= start && m <= end;
      });
    }

    setFiltered(data);
  };

  const handleReset = () => {
    setFilters({
      function: "",
      unit: "",
      subProgram: "",
      months: [],
      quarter: ""
    });
    setFiltered(performanceSummaries);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">실적 통계/조회</h2>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <TextField
          label="기능"
          select
          size="small"
          value={filters.function}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              function: e.target.value,
              unit: "",
              subProgram: ""
            }))
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">전체</MenuItem>
          {functionOptions.map((f) => (
            <MenuItem key={f} value={f}>
              {f}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="단위사업명"
          select
          size="small"
          value={filters.unit}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              unit: e.target.value,
              subProgram: ""
            }))
          }
          sx={{ minWidth: 160 }}
          disabled={!filters.function}
        >
          <MenuItem value="">전체</MenuItem>
          {unitOptions.map((u) => (
            <MenuItem key={u} value={u}>
              {u}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="세부사업명"
          select
          size="small"
          value={filters.subProgram}
          onChange={(e) =>
            setFilters((f) => ({ ...f, subProgram: e.target.value }))
          }
          sx={{ minWidth: 160 }}
          disabled={!filters.unit}
        >
          <MenuItem value="">전체</MenuItem>
          {subProgramOptions.map((sp) => (
            <MenuItem key={sp} value={sp}>
              {sp}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          multiple
          options={monthOptions}
          getOptionLabel={(option) => option.label}
          value={monthOptions.filter((m) => filters.months.includes(m.value))}
          onChange={(_, values) =>
            setFilters((f) => ({
              ...f,
              months: values.map((v) => v.value),
              quarter: ""
            }))
          }
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField {...params} label="월(단중선택)" size="small" />
          )}
        />

        <TextField
          label="분기"
          select
          size="small"
          value={filters.quarter}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              quarter: e.target.value,
              months: []
            }))
          }
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="1">1분기</MenuItem>
          <MenuItem value="2">2분기</MenuItem>
          <MenuItem value="3">3분기</MenuItem>
          <MenuItem value="4">4분기</MenuItem>
        </TextField>

        <Button variant="contained" onClick={handleSearch}>조회</Button>
        <Button onClick={handleReset}>초기화</Button>
      </div>

      <div style={{ minHeight: 400, maxHeight: "60vh", overflowX: "auto", overflowY: "auto" }}>
        <div style={{ minWidth: 1600 }}>
          <PerformanceSummaryTable summaries={filtered} />
          {filtered.length === 0 && (
            <div className="text-gray-500 mt-8">조회 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformanceStatsPage;