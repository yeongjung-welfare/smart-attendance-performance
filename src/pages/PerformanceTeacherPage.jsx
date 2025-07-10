import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert
} from "@mui/material";
import useSnackbar from "../components/useSnackbar";
import { getTeacherSubPrograms } from "../services/teacherSubProgramMapAPI";
import { fetchPerformanceBySubProgram, savePerformance } from "../services/attendancePerformanceAPI";
import dayjs from "dayjs";

function PerformanceTeacherPage({ user }) {
  const { showSnackbar } = useSnackbar();
  const [subPrograms, setSubPrograms] = useState([]);
  const [selectedSubProgram, setSelectedSubProgram] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: "",
    total: "",
    note: "",
    date: dayjs().format("YYYY-MM-DD")
  });

  // 🔄 담당 세부사업 목록 로딩
  useEffect(() => {
    if (user?.email) {
      getTeacherSubPrograms(user.email).then(setSubPrograms).catch(console.error);
    }
  }, [user]);

  // 📦 선택된 세부사업의 기존 실적 조회
  useEffect(() => {
    if (selectedSubProgram) {
      fetchPerformanceBySubProgram(selectedSubProgram).then(setRows);
    } else {
      setRows([]);
    }
  }, [selectedSubProgram]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.total || !form.date || !selectedSubProgram) {
      showSnackbar("모든 항목을 입력해주세요", "warning");
      return;
    }

    try {
      await savePerformance({
        ...form,
        subProgram: selectedSubProgram,
        total: Number(form.total)
      });
      showSnackbar("실적이 저장되었습니다.", "success");
      setForm({ name: "", total: "", note: "", date: dayjs().format("YYYY-MM-DD") });
      const updated = await fetchPerformanceBySubProgram(selectedSubProgram);
      setRows(updated);
    } catch (err) {
      console.error("실적 저장 실패:", err);
      showSnackbar("저장 중 오류 발생", "error");
    }
  };

  return (
    <Paper className="p-4 max-w-screen-lg mx-auto">
      <Typography variant="h6" gutterBottom>강사 실적 등록</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>세부사업명</InputLabel>
        <Select
          value={selectedSubProgram}
          onChange={(e) => setSelectedSubProgram(e.target.value)}
          label="세부사업명"
        >
          {subPrograms.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSubProgram && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <TextField
            name="name"
            label="이용자명"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            name="total"
            label="연인원"
            value={form.total}
            onChange={handleChange}
            type="number"
            fullWidth
            required
          />
          <TextField
            name="note"
            label="비고"
            value={form.note}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="date"
            label="날짜"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.date}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
      )}

      <Button variant="contained" onClick={handleSave} sx={{ mb: 4 }}>
        실적 등록
      </Button>

      <Typography variant="h6" gutterBottom>기존 실적</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>날짜</TableCell>
            <TableCell>이름</TableCell>
            <TableCell>연인원</TableCell>
            <TableCell>비고</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.total}</TableCell>
                <TableCell>{r.note || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                등록된 실적이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default PerformanceTeacherPage;