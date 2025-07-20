import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import { isPresent } from "../utils/attendanceUtils"; // 출석여부 판별 함수 반드시 import

function PerformanceStats({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const total = data.length;
  // 출석자 집계는 반드시 isPresent 함수로!
  const attended = data.filter(d => isPresent(d.출석여부)).length;
  const absent = total - attended;
  const attendRate = total > 0 ? Math.round((attended / total) * 100) : 0;
  const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        border: "1px solid #e3e6ea",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { sm: "center" },
        justifyContent: "space-between"
      }}
    >
      <Typography variant="subtitle1" fontWeight={600}>
        전체: <span style={{ color: "#1976d2" }}>{total}</span>명
      </Typography>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
      <Typography variant="subtitle1">
        출석: <span style={{ color: "#388e3c", fontWeight: 700 }}>{attended}</span>명 ({attendRate}%)
      </Typography>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
      <Typography variant="subtitle1">
        결석: <span style={{ color: "#d32f2f", fontWeight: 700 }}>{absent}</span>명 ({absentRate}%)
      </Typography>
    </Box>
  );
}

export default PerformanceStats;