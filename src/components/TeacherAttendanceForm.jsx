import React, { useEffect, useState } from "react";
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  ListItemText,
  Paper
} from "@mui/material";
import { getMembersBySubProgram } from "../services/memberAPI";
import { saveAttendanceRecords } from "../services/attendancePerformanceAPI";
import dayjs from "dayjs";
import useSnackbar from "../components/useSnackbar";

function TeacherAttendanceForm({ subPrograms }) {
  const { showSnackbar } = useSnackbar();
  const [selectedSubProgram, setSelectedSubProgram] = useState("");
  const [members, setMembers] = useState([]);
  const [checked, setChecked] = useState({});
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  // 세부사업 선택 → 이용자 불러오기
  useEffect(() => {
    if (selectedSubProgram) {
      getMembersBySubProgram(selectedSubProgram).then((data) => {
        setMembers(data);
        const initCheck = {};
        data.forEach((m) => {
          initCheck[m.id] = false;
        });
        setChecked(initCheck);
      });
    }
  }, [selectedSubProgram]);

  const handleCheck = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
  const selected = members.filter((m) => checked[m.id]);
  if (selected.length === 0) {
    showSnackbar("출석자를 선택하세요.", "warning");
    return;
  }

  try {
    const records = selected.map((m) => ({
      date,
      subProgram: selectedSubProgram,
      memberName: m.name,
      gender: m.gender,
      phone: m.phone || "",
      note: ""
    }));

    await saveAttendanceRecords(records);
    showSnackbar("출석 정보가 저장되었습니다.", "success");
  } catch (error) {
    console.error("출석 저장 실패:", error);
    showSnackbar("출석 저장 중 오류 발생", "error");
  }
};

  return (
    <Paper className="p-4 mt-4">
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>세부사업명</InputLabel>
        <Select
          value={selectedSubProgram}
          onChange={(e) => setSelectedSubProgram(e.target.value)}
          label="세부사업명"
        >
          {subPrograms.map((sp) => (
            <MenuItem key={sp} value={sp}>
              {sp}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSubProgram && members.length > 0 && (
        <div>
          <Typography variant="subtitle1" gutterBottom>
            출석자 선택 ({dayjs(date).format("YYYY년 MM월 DD일")})
          </Typography>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Checkbox
                checked={checked[m.id] || false}
                onChange={() => handleCheck(m.id)}
              />
              <ListItemText
                primary={m.name}
                secondary={`${m.gender || "-"} / ${m.phone || "-"}`}
              />
            </div>
          ))}
          <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
            출석 저장
          </Button>
        </div>
      )}

      {selectedSubProgram && members.length === 0 && (
        <Typography color="text.secondary">이용자 정보가 없습니다.</Typography>
      )}
    </Paper>
  );
}

export default TeacherAttendanceForm;