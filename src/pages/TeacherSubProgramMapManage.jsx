import React, { useEffect, useState } from "react";
import {
  getAllTeacherSubProgramMaps,
  addTeacherSubProgramMap,
  deleteTeacherSubProgramMap
} from "../services/teacherSubProgramMapAPI";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert
} from "@mui/material";

function TeacherSubProgramMapManage() {
  const [maps, setMaps] = useState([]);
  const [form, setForm] = useState({ 강사명: "", 이메일: "", 세부사업명: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔄 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllTeacherSubProgramMaps();
      setMaps(data);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 폼 필드 변경
  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // 등록
  const handleAdd = async () => {
    setError("");
    if (!form.강사명 || !form.이메일 || !form.세부사업명) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    try {
      await addTeacherSubProgramMap(form);
      setForm({ 강사명: "", 이메일: "", 세부사업명: "" });
      fetchData();
    } catch (err) {
      console.error("추가 실패:", err);
      setError("등록 중 오류가 발생했습니다.");
    }
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await deleteTeacherSubProgramMap(id);
      fetchData();
    } catch (err) {
      console.error("삭제 실패:", err);
      setError("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <Paper className="p-4 max-w-screen-lg mx-auto">
      <Typography variant="h6" gutterBottom>강사-세부사업 매칭 관리</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <div className="flex flex-wrap gap-2 mb-4">
        <TextField label="강사명" value={form.강사명} onChange={handleChange("강사명")} />
        <TextField label="이메일" value={form.이메일} onChange={handleChange("이메일")} />
        <TextField label="세부사업명" value={form.세부사업명} onChange={handleChange("세부사업명")} />
        <Button variant="contained" onClick={handleAdd} disabled={loading}>추가</Button>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>강사명</TableCell>
            <TableCell>이메일</TableCell>
            <TableCell>세부사업명</TableCell>
            <TableCell>삭제</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maps.length > 0 ? maps.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.teacherName}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.subProgramName}</TableCell>
              <TableCell>
                <Button color="error" onClick={() => handleDelete(m.id)}>삭제</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default TeacherSubProgramMapManage;