// src/components/AttendancePerformanceForm.jsx
import React, { useState, useEffect } from "react";
import {
  TextField, Button, Paper, Typography, Alert,
  FormControlLabel, Checkbox, FormControl, InputLabel,
  Select, MenuItem, Grid, Box
} from "@mui/material";
import { getSubProgramMembers } from "../services/subProgramMemberAPI";
import { getStructureBySubProgram } from "../services/teamSubProgramMapAPI";
import { getProgramSessionsForMonth } from "../services/attendancePerformanceAPI";

function AttendancePerformanceForm({
  mode = "attendance",
  initialData = {},
  onSubmit,
  onClose,
  structure
}) {
  const [formData, setFormData] = useState({
    이용자명: initialData?.이용자명 || "",
    날짜: initialData?.날짜 || "",
    세부사업명: initialData?.세부사업명 || "",
    성별: initialData?.성별 || "",
    "내용(특이사항)": initialData?.["내용(특이사항)"] || "",
    출석여부: initialData?.출석여부 === true || initialData?.출석여부 === "true",
    고유아이디: initialData?.고유아이디 || "",
    유료무료: initialData?.유료무료 || "",
    기능: initialData?.기능 || "",
    팀명: initialData?.팀명 || "",
    단위사업명: initialData?.단위사업명 || "",
    횟수: initialData?.횟수 || 0
  });

  const [alert, setAlert] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);

  // 세부사업명 목록 추출
  const allSubs = [];
  if (structure && typeof structure === "object") {
    Object.values(structure).forEach(item => {
      if (item && item.세부사업명) allSubs.push(item.세부사업명);
    });
  }
  const subPrograms = Array.from(new Set(allSubs)).sort();

  // ✅ 세부사업명 변경 시 회원 목록 로드
  useEffect(() => {
    async function loadMembers() {
      if (formData.세부사업명) {
        try {
          const members = await getSubProgramMembers({ 세부사업명: formData.세부사업명 });
          const activeMembers = members.filter(m => m.이용상태 !== "종결");
          setAvailableMembers(activeMembers);
        } catch (err) {
          console.error("회원 목록 로드 실패:", err);
          setAvailableMembers([]);
        }
      } else {
        setAvailableMembers([]);
      }
    }
    loadMembers();
  }, [formData.세부사업명]);

  // 세부사업명 변경 시 기능/팀명/단위사업명 자동 매핑
  useEffect(() => {
    async function fetchStructureAndMember() {
      let update = {};

      // 세부사업명 → 기능/팀명/단위사업명 자동 매핑
      if (formData.세부사업명) {
        const map = await getStructureBySubProgram(formData.세부사업명);
        if (map) {
          update = {
            ...update,
            기능: map.function || "",
            팀명: map.team || "",
            단위사업명: map.unit || ""
          };
        }
      }

      // 유료무료, 고유아이디, 성별 자동 반영
      if (formData.세부사업명 && formData.이용자명) {
        const members = await getSubProgramMembers({ 세부사업명: formData.세부사업명 });
        const member = members.find(m => m.이용자명 === formData.이용자명);
        if (member) {
          update = {
            ...update,
            고유아이디: member.고유아이디,
            성별: member.성별 || formData.성별,
            유료무료: member.유료무료 || ""
          };
        }
      }

      if (Object.keys(update).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...update
        }));
      }
    }

    // ✅ 수정 모드일 때는 초기 데이터 로딩 후에만 실행
    if (mode === "attendance" || !initialData?.id) {
      fetchStructureAndMember();
    }
  }, [formData.세부사업명, formData.이용자명, mode, initialData?.id]);

  // 횟수 자동계산
  const calcSessions = async (세부사업명, 이용자명, 날짜) => {
    if (!세부사업명 || !날짜) return 1;
    const yearMonth = 날짜.slice(0, 7);
    
    try {
      const sessions = await getProgramSessionsForMonth(세부사업명, yearMonth);
      if (sessions && Number.isFinite(sessions)) return sessions;

      if (이용자명) {
        const { getAttendanceCountForMonth } = await import("../services/attendancePerformanceAPI");
        const count = await getAttendanceCountForMonth(세부사업명, 이용자명, yearMonth);
        return count + 1;
      }
      return 1;
    } catch {
      return 1;
    }
  };

  const handleChange = (key) => (e) => {
    setFormData({ ...formData, [key]: e.target.value });
  };

  const handleCheck = (e) => {
    setFormData({ ...formData, 출석여부: e.target.checked });
  };

  const handleUserNameChange = async (e) => {
    const 이용자명 = e.target.value;
    setFormData({ ...formData, 이용자명, 고유아이디: "" });

    if (이용자명 && formData.세부사업명) {
      const members = await getSubProgramMembers({ 세부사업명: formData.세부사업명 });
      const member = members.find(m => m.이용자명 === 이용자명);
      if (member) {
        setFormData(prev => ({
          ...prev,
          고유아이디: member.고유아이디,
          성별: member.성별 || prev.성별,
          유료무료: member.유료무료 || ""
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.이용자명 || !formData.날짜 || !formData.세부사업명) {
      setAlert({ type: "warning", message: "이용자명, 날짜, 세부사업명은 필수입니다." });
      return;
    }

    try {
      // 횟수 자동계산
      let 횟수 = formData.횟수;
      if (mode === "attendance") {
        횟수 = await calcSessions(formData.세부사업명, formData.이용자명, formData.날짜);
      }

      if (mode === "attendance") {
        await onSubmit({
          이용자명: formData.이용자명,
          날짜: formData.날짜,
          세부사업명: formData.세부사업명,
          성별: formData.성별,
          출석여부: formData.출석여부,
          고유아이디: formData.고유아이디,
          유료무료: formData.유료무료,
          기능: formData.기능,
          팀명: formData.팀명,
          단위사업명: formData.단위사업명,
          횟수
        });
        setAlert({ type: "success", message: "출석이 등록되었습니다." });
      } else {
        await onSubmit({
          이용자명: formData.이용자명,
          날짜: formData.날짜,
          세부사업명: formData.세부사업명,
          성별: formData.성별,
          "내용(특이사항)": formData["내용(특이사항)"],
          출석여부: formData.출석여부,
          고유아이디: formData.고유아이디,
          유료무료: formData.유료무료,
          기능: formData.기능,
          팀명: formData.팀명,
          단위사업명: formData.단위사업명,
          횟수,
          id: initialData?.id
        });
        setAlert({ type: "success", message: "실적이 수정되었습니다." });
      }

      // 등록 모드일 때만 폼 초기화
      if (mode === "attendance") {
        setFormData({
          이용자명: "",
          날짜: "",
          세부사업명: "",
          성별: "",
          "내용(특이사항)": "",
          출석여부: true,
          고유아이디: "",
          유료무료: "",
          기능: "",
          팀명: "",
          단위사업명: "",
          횟수: 0
        });
      }

      if (onClose) onClose();
    } catch (err) {
      setAlert({ type: "error", message: err?.message || "등록 실패" });
    }
  };

  // ✅ initialData 변경 시 폼 데이터 업데이트 (수정 모드 지원)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log("✅ initialData 업데이트:", initialData);
      setFormData({
        이용자명: initialData?.이용자명 || "",
        날짜: initialData?.날짜 || "",
        세부사업명: initialData?.세부사업명 || "",
        성별: initialData?.성별 || "",
        "내용(특이사항)": initialData?.["내용(특이사항)"] || "",
        출석여부: initialData?.출석여부 === true || initialData?.출석여부 === "true",
        고유아이디: initialData?.고유아이디 || "",
        유료무료: initialData?.유료무료 || "",
        기능: initialData?.기능 || "",
        팀명: initialData?.팀명 || "",
        단위사업명: initialData?.단위사업명 || "",
        횟수: initialData?.횟수 || 0
      });
    }
  }, [initialData]);

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        {mode === "attendance" ? "단건 출석 등록" : "실적 수정"}
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {/* ✅ 세부사업명 필드 - 수정 모드에서도 표시 */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>세부사업명</InputLabel>
              <Select
                value={formData.세부사업명}
                onChange={handleChange("세부사업명")}
                label="세부사업명"
                disabled={mode === "performance"} // ✅ 수정 모드에서는 읽기 전용
              >
                {subPrograms.map(sp => (
                  <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 이용자명 필드 */}
          <Grid item xs={12} sm={6}>
            {mode === "attendance" ? (
              <TextField
                fullWidth
                required
                label="이용자명"
                value={formData.이용자명}
                onChange={handleUserNameChange}
                list="member-names"
              />
            ) : (
              <TextField
                fullWidth
                required
                label="이용자명"
                value={formData.이용자명}
                InputProps={{ readOnly: true }}
                variant="filled"
              />
            )}
            
            {mode === "attendance" && (
              <datalist id="member-names">
                {availableMembers.map(member => (
                  <option key={member.id} value={member.이용자명} />
                ))}
              </datalist>
            )}
          </Grid>

          {/* 날짜 필드 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="날짜"
              value={formData.날짜}
              onChange={handleChange("날짜")}
              InputLabelProps={{ shrink: true }}
              disabled={mode === "performance"} // ✅ 수정 모드에서는 읽기 전용
            />
          </Grid>

          {/* 성별 필드 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>성별</InputLabel>
              <Select
                value={formData.성별}
                onChange={handleChange("성별")}
                label="성별"
              >
                <MenuItem value="남">남</MenuItem>
                <MenuItem value="여">여</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 고유아이디 필드 (읽기 전용) */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="고유아이디"
              value={formData.고유아이디}
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>

          {/* ✅ 수정 모드에서만 표시되는 필드들 */}
          {mode === "performance" && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="내용(특이사항)"
                  value={formData["내용(특이사항)"]}
                  onChange={handleChange("내용(특이사항)")}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="유료무료"
                  value={formData.유료무료}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="기능"
                  value={formData.기능}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="단위사업명"
                  value={formData.단위사업명}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
            </>
          )}

          {/* 출석여부 체크박스 */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.출석여부}
                  onChange={handleCheck}
                />
              }
              label="출석"
            />
          </Grid>
        </Grid>

        {/* 버튼 영역 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button onClick={onClose} variant="outlined">
            취소
          </Button>
          <Button type="submit" variant="contained">
            {mode === "attendance" ? "등록하기" : "수정하기"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default AttendancePerformanceForm;