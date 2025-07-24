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
  Paper,
  TextField
} from "@mui/material";
import { getSubProgramMembers } from "../services/subProgramMemberAPI"; // ✅ 수정
import { saveAttendanceRecords } from "../services/attendancePerformanceAPI";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가
import useSnackbar from "../components/useSnackbar";

function TeacherAttendanceForm({ subPrograms }) {
  const [SnackbarComp, showSnackbar] = useSnackbar(); // ✅ 수정
  const [selectedSubProgram, setSelectedSubProgram] = useState("");
  const [members, setMembers] = useState([]);
  const [checked, setChecked] = useState({});
  const [date, setDate] = useState(getCurrentKoreanDate()); // ✅ 수정

  // 세부사업 선택 → 이용자 불러오기
  useEffect(() => {
    if (selectedSubProgram) {
      getSubProgramMembers({ 세부사업명: selectedSubProgram }).then((data) => { // ✅ 수정
        const activeMembers = data.filter(m => m.이용상태 !== "종결"); // ✅ 활성 회원만
        setMembers(activeMembers);
        const initCheck = {};
        activeMembers.forEach((m) => {
          initCheck[m.id] = false;
        });
        setChecked(initCheck);
      }).catch((error) => {
        console.error("회원 목록 로드 실패:", error);
        setMembers([]);
        showSnackbar("회원 목록을 불러올 수 없습니다.", "error");
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

    if (!selectedSubProgram || !date) {
      showSnackbar("세부사업명과 날짜를 선택하세요.", "warning");
      return;
    }

    try {
      const normalizedDate = normalizeDate(date); // ✅ 날짜 정규화

      const records = selected.map((m) => ({
        날짜: normalizedDate, // ✅ 정규화된 날짜 사용
        세부사업명: selectedSubProgram, // ✅ 필드명 통일
        이용자명: m.이용자명, // ✅ 필드명 통일
        성별: m.성별 || "",
        연락처: m.연락처 || "",
        "내용(특이사항)": "",
        출석여부: true, // ✅ 출석으로 설정
        고유아이디: m.고유아이디 || ""
      }));

      console.log("📤 강사 출석 등록 데이터:", {
        selectedSubProgram,
        date,
        normalizedDate,
        recordCount: records.length
      });

      const results = await saveAttendanceRecords(records);
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        showSnackbar(`${successCount}명 출석 등록 완료${failedCount > 0 ? `, ${failedCount}명 실패` : ''}`, "success");
        // 체크박스 초기화
        const resetCheck = {};
        members.forEach((m) => {
          resetCheck[m.id] = false;
        });
        setChecked(resetCheck);
      } else {
        showSnackbar("출석 등록에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("출석 저장 실패:", error);
      showSnackbar("출석 저장 중 오류가 발생했습니다: " + error.message, "error");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {SnackbarComp}
      
      <Typography variant="h5" gutterBottom>
        강사 출석 등록
      </Typography>

      {/* 날짜 선택 */}
      <TextField
        label="출석 날짜"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      {/* 세부사업명 선택 */}
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
        <>
          <Typography variant="h6" gutterBottom>
            출석자 선택 ({normalizeDate(date)}일)
          </Typography>
          {members.map((m) => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={checked[m.id] || false}
                onChange={() => handleCheck(m.id)}
              />
              <ListItemText 
                primary={`${m.이용자명} (${m.성별 || '-'})`}
                secondary={m.연락처 || '연락처 없음'}
              />
            </div>
          ))}
          
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={Object.values(checked).every(v => !v)}
          >
            출석 저장
          </Button>
        </>
      )}

      {selectedSubProgram && members.length === 0 && (
        <Typography color="text.secondary">
          해당 세부사업에 등록된 이용자가 없습니다.
        </Typography>
      )}
    </Paper>
  );
}

export default TeacherAttendanceForm;
