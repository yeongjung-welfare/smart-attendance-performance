import React, { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Alert
} from "@mui/material";
import { savePerformance } from "../services/attendancePerformanceAPI";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가

function PerformanceSingleRegisterForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    날짜: "", // ✅ 필드명 한글로 통일
    세부사업명: "", // ✅ 필드명 한글로 통일
    등록인원: "",
    실인원: "",
    연인원: "",
    건수: "",
    비고: ""
  });

  const [alert, setAlert] = useState(null);

  const handleChange = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.세부사업명) {
      setAlert({ type: "warning", message: "세부사업명은 필수입니다." });
      return;
    }

    // ✅ 날짜 검증 및 정규화
    const normalizedDate = form.날짜 ? normalizeDate(form.날짜) : "";
    if (form.날짜 && !normalizedDate) {
      setAlert({ type: "warning", message: "날짜 형식 오류 (YYYY-MM-DD)" });
      return;
    }

    try {
      await savePerformance({
        날짜: normalizedDate || getCurrentKoreanDate(), // ✅ 정규화된 날짜 또는 오늘 날짜
        세부사업명: form.세부사업명, // ✅ 필드명 통일
        등록인원: Number(form.등록인원) || 0,
        실인원: Number(form.실인원) || 0,
        연인원: Number(form.연인원) || 0,
        건수: Number(form.건수) || 0,
        비고: form.비고 || "",
        실적유형: "대량" // ✅ 대량실적으로 구분
      });

      setAlert({ type: "success", message: "실적이 등록되었습니다." });
      
      // ✅ 폼 초기화
      setForm({
        날짜: "",
        세부사업명: "",
        등록인원: "",
        실인원: "",
        연인원: "",
        건수: "",
        비고: ""
      });

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setAlert({ type: "error", message: err?.message || "등록 실패" });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        실적 단건 등록
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* ✅ 날짜 필드 */}
        <TextField
          fullWidth
          label="날짜 (선택사항, 비어있으면 오늘 날짜)"
          type="date"
          value={form.날짜}
          onChange={handleChange("날짜")}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />

        {/* ✅ 세부사업명 필드 */}
        <TextField
          fullWidth
          label="세부사업명 *"
          value={form.세부사업명}
          onChange={handleChange("세부사업명")}
          sx={{ mb: 2 }}
          required
        />

        {/* ✅ 등록인원 필드 */}
        <TextField
          fullWidth
          label="등록인원"
          type="number"
          value={form.등록인원}
          onChange={handleChange("등록인원")}
          sx={{ mb: 2 }}
        />

        {/* ✅ 실인원 필드 */}
        <TextField
          fullWidth
          label="실인원"
          type="number"
          value={form.실인원}
          onChange={handleChange("실인원")}
          sx={{ mb: 2 }}
        />

        {/* ✅ 연인원 필드 */}
        <TextField
          fullWidth
          label="연인원"
          type="number"
          value={form.연인원}
          onChange={handleChange("연인원")}
          sx={{ mb: 2 }}
        />

        {/* ✅ 건수 필드 */}
        <TextField
          fullWidth
          label="건수"
          type="number"
          value={form.건수}
          onChange={handleChange("건수")}
          sx={{ mb: 2 }}
        />

        {/* ✅ 비고 필드 */}
        <TextField
          fullWidth
          label="비고"
          multiline
          rows={3}
          value={form.비고}
          onChange={handleChange("비고")}
          sx={{ mb: 2 }}
        />

        {/* ✅ 버튼 영역 */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onClose && (
            <Button onClick={onClose} variant="outlined">
              닫기
            </Button>
          )}
          <Button type="submit" variant="contained">
            등록하기
          </Button>
        </div>
      </form>
    </Paper>
  );
}

export default PerformanceSingleRegisterForm;
