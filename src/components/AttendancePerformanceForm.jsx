import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox
} from "@mui/material";

function AttendancePerformanceForm({
  mode = "attendance",
  initialData = {},
  onSubmit,
  onClose,
  structure
}) {
  const [formData, setFormData] = useState({
    이름: initialData?.name || "",
    날짜: initialData?.date || "",
    세부사업명: initialData?.subProgram || "",
    성별: initialData?.gender || "",
    내용: initialData?.note || "",
    attended: initialData?.attended ?? true
  });
  const [alert, setAlert] = useState(null);

  // 세부사업명 옵션 추출
  const allSubs = [];
  if (structure && typeof structure === "object") {
    Object.values(structure).forEach(units =>
      Object.values(units || {}).forEach(subs => allSubs.push(...(subs || [])))
    );
  }
  const subPrograms = Array.from(new Set(allSubs)).sort();

  const handleChange = (key) => (e) => {
    setFormData({ ...formData, [key]: e.target.value });
  };
  const handleCheck = (e) => {
    setFormData({ ...formData, attended: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.이름 || !formData.날짜 || !formData.세부사업명) {
      setAlert({ type: "warning", message: "이름, 날짜, 세부사업명은 필수입니다." });
      return;
    }
    try {
      if (mode === "attendance") {
        await onSubmit({
          name: formData.이름,
          date: formData.날짜,
          subProgram: formData.세부사업명,
          gender: formData.성별,
          attended: formData.attended
        });
        setAlert({ type: "success", message: "출석이 등록되었습니다." });
      } else {
        await onSubmit({
          name: formData.이름,
          date: formData.날짜,
          subProgram: formData.세부사업명,
          gender: formData.성별,
          note: formData.내용,
          attended: formData.attended,
          id: initialData?.id
        });
        setAlert({ type: "success", message: "실적이 수정되었습니다." });
      }
      setFormData({
        이름: "",
        날짜: "",
        세부사업명: "",
        성별: "",
        내용: "",
        attended: true
      });
      if (onClose) onClose();
    } catch (err) {
      setAlert({ type: "error", message: err?.message || "등록 실패" });
    }
  };

  useEffect(() => {
    setFormData({
      이름: initialData?.name || "",
      날짜: initialData?.date || "",
      세부사업명: initialData?.subProgram || "",
      성별: initialData?.gender || "",
      내용: initialData?.note || "",
      attended: initialData?.attended ?? true
    });
  }, [initialData]);

  return (
    <Paper className="p-4 max-w-[600px] w-full mx-auto">
      <Typography variant="h6" gutterBottom>
        {mode === "attendance" ? "단건 출석 등록" : "실적 수정"}
      </Typography>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      <form onSubmit={handleSubmit} autoComplete="off">
        <TextField
          label="이름"
          value={formData.이름}
          onChange={handleChange("이름")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="날짜"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.날짜}
          onChange={handleChange("날짜")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          select
          label="세부사업명"
          value={formData.세부사업명}
          onChange={handleChange("세부사업명")}
          fullWidth
          margin="normal"
          SelectProps={{ native: true }}
          required
        >
          <option value="">세부사업명 선택</option>
          {subPrograms.map(sp => (
            <option key={sp} value={sp}>{sp}</option>
          ))}
        </TextField>
        <TextField
          label="성별 (선택)"
          value={formData.성별}
          onChange={handleChange("성별")}
          fullWidth
          margin="normal"
        />
        {mode === "performance" && (
          <TextField
            label="내용 (특이사항)"
            value={formData.내용}
            onChange={handleChange("내용")}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        )}
        {mode === "attendance" && (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.attended}
                onChange={handleCheck}
                color="primary"
              />
            }
            label="출석"
            sx={{ mt: 1 }}
          />
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          {mode === "attendance" ? "등록하기" : "수정하기"}
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

export default AttendancePerformanceForm;