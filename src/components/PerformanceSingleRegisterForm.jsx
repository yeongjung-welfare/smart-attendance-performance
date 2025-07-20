import React, { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Alert
} from "@mui/material";
import { savePerformance } from "../services/attendancePerformanceAPI";

function PerformanceSingleRegisterForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    date: "",
    subProgram: "",
    registered: "",
    actual: "",
    total: "",
    cases: "",
    note: ""
  });
  const [alert, setAlert] = useState(null);

  const handleChange = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subProgram) {
      setAlert({ type: "warning", message: "세부사업명은 필수입니다." });
      return;
    }
    if (form.date && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      setAlert({ type: "warning", message: "날짜 형식 오류 (YYYY-MM-DD)" });
      return;
    }
    try {
      await savePerformance({
        date: form.date || "",
        subProgram: form.subProgram,
        registered: Number(form.registered) || 0,
        actual: Number(form.actual) || 0,
        total: Number(form.total) || 0,
        cases: Number(form.cases) || 0,
        note: form.note || ""
      });
      setAlert({ type: "success", message: "실적이 등록되었습니다." });
      setForm({
        date: "",
        subProgram: "",
        registered: "",
        actual: "",
        total: "",
        cases: "",
        note: ""
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setAlert({ type: "error", message: err?.message || "등록 실패" });
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, width: "100%", mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        실적 단건 등록
      </Typography>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      <form onSubmit={handleSubmit} autoComplete="off">
        <TextField
          label="날짜"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.date}
          onChange={handleChange("date")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="세부사업명 (필수)"
          value={form.subProgram}
          onChange={handleChange("subProgram")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="등록인원"
          type="number"
          value={form.registered}
          onChange={handleChange("registered")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="실인원"
          type="number"
          value={form.actual}
          onChange={handleChange("actual")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="연인원"
          type="number"
          value={form.total}
          onChange={handleChange("total")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="건수"
          type="number"
          value={form.cases}
          onChange={handleChange("cases")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="비고"
          value={form.note}
          onChange={handleChange("note")}
          fullWidth
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          등록하기
        </Button>
        <Button
          onClick={onClose}
          fullWidth
          sx={{ mt: 1 }}
        >
          닫기
        </Button>
      </form>
    </Paper>
  );
}

export default PerformanceSingleRegisterForm;