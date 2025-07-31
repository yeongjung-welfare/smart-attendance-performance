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
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ 추가
import { useUser } from "../hooks/useUser";  // ✅ 추가
import { useUserRole } from "../hooks/useUserRole";  // ✅ 추가
import { getTeacherSubPrograms } from "../services/teacherSubProgramMapAPI";  // ✅ 추가

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
    횟수: initialData?.횟수 || 0,
    id: initialData?.id || ""   // ✅ 수정 모드에서 필요
  });

  const [alert, setAlert] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);

  // 세부사업명 목록 추출
  // ✅ 강사별 세부사업 필터링
  const [subPrograms, setSubPrograms] = useState([]);
  const { user } = useUser();
  const { role } = useUserRole();

  // 강사별 세부사업 필터링
  useEffect(() => {
  const loadSubPrograms = async () => {
    console.log("🔍 loadSubPrograms 시작:", { role, email: user?.email, structure });
    
    if (role === "teacher" && user?.email) {
      // 강사는 담당 세부사업만 조회
      try {
        const teacherPrograms = await getTeacherSubPrograms(user.email);
        const programNames = teacherPrograms.map(p => p.subProgramName || p.세부사업명);
        
        if (programNames.length > 0) {
          setSubPrograms(programNames);
          console.log("✅ 강사 담당 세부사업:", programNames);
        } else {
          // ✅ 백업: TeamSubProgramMap에서 조회
          console.warn("강사 담당 세부사업이 없음, 전체 목록에서 조회");
          const { getAllTeamSubProgramMaps } = await import("../services/teamSubProgramMapAPI");
          const allMaps = await getAllTeamSubProgramMaps();
          const backupPrograms = allMaps.map(m => m.subProgramName).filter(Boolean);
          setSubPrograms(Array.from(new Set(backupPrograms)).sort());
        }
      } catch (error) {
        console.error("강사 세부사업 조회 오류:", error);
        // ✅ 오류 시 백업 데이터 제공
        try {
          const { getAllTeamSubProgramMaps } = await import("../services/teamSubProgramMapAPI");
          const allMaps = await getAllTeamSubProgramMaps();
          const backupPrograms = allMaps.map(m => m.subProgramName).filter(Boolean);
          setSubPrograms(Array.from(new Set(backupPrograms)).sort());
          console.log("✅ 백업 세부사업 로드:", backupPrograms);
        } catch (backupErr) {
          console.error("백업 데이터 로드 실패:", backupErr);
          setSubPrograms([]);
        }
      }
    } else {
      // 관리자는 모든 세부사업 조회
      let allSubs = [];
      
      // ✅ structure에서 세부사업명 추출 (구조 개선)
      if (structure && typeof structure === "object") {
        console.log("🔍 structure 분석:", structure);
        Object.keys(structure).forEach(teamName => {
          const team = structure[teamName];
          if (team && typeof team === "object") {
            Object.keys(team).forEach(unitName => {
              const unit = team[unitName];
              if (Array.isArray(unit)) {
                allSubs.push(...unit);
              }
            });
          }
        });
      }
      
      // ✅ structure가 비어있거나 데이터가 없을 경우 백업 데이터 사용
      if (allSubs.length === 0) {
        console.warn("structure에서 세부사업명을 찾을 수 없음, API에서 조회");
        try {
          const { getAllTeamSubProgramMaps } = await import("../services/teamSubProgramMapAPI");
          const allMaps = await getAllTeamSubProgramMaps();
          const backupPrograms = allMaps.map(m => m.subProgramName).filter(Boolean);
          allSubs = backupPrograms;
          console.log("✅ 관리자 백업 세부사업 로드:", backupPrograms);
        } catch (err) {
          console.error("관리자 백업 데이터 로드 실패:", err);
        }
      }
      
      const uniqueSubs = Array.from(new Set(allSubs)).sort();
      setSubPrograms(uniqueSubs);
      console.log("✅ 관리자 세부사업 설정:", uniqueSubs);
    }
  };
  
  loadSubPrograms();
}, [role, user, structure]);

  // ✅ 세부사업명 변경 시 회원 목록 로드
useEffect(() => {
  async function loadMembers() {
    if (formData.세부사업명) {
      console.log("🔍 회원 목록 로드 시작:", formData.세부사업명);
      try {
        const members = await getSubProgramMembers({ 세부사업명: formData.세부사업명 });
        console.log("📋 조회된 전체 회원:", members);
        console.log("📋 회원 수:", members.length);
        
        // 각 회원의 이용상태 확인
        members.forEach(m => {
          console.log(`👤 ${m.이용자명}: 이용상태=${m.이용상태}, 세부사업명=${m.세부사업명}`);
        });
        
        const activeMembers = members.filter(m => m.이용상태 !== "종결");
        console.log("✅ 활성 회원 수:", activeMembers.length);
        console.log("✅ 활성 회원 목록:", activeMembers.map(m => m.이용자명));
        
        setAvailableMembers(activeMembers);
      } catch (err) {
        console.error("❌ 회원 목록 로드 실패:", err);
        setAvailableMembers([]);
      }
    } else {
      console.log("🔍 세부사업명이 비어있음");
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
      // ✅ 날짜 정규화 추가
      const normalizedDate = normalizeDate(formData.날짜);
      
      // 횟수 자동계산
      let 횟수 = formData.횟수;
      if (mode === "attendance") {
        횟수 = await calcSessions(formData.세부사업명, formData.이용자명, normalizedDate);
      }

      if (mode === "attendance") {
        await onSubmit({
          이용자명: formData.이용자명,
          날짜: normalizedDate, // ✅ 정규화된 날짜 사용
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
          날짜: normalizedDate, // ✅ 정규화된 날짜 사용
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
        날짜: initialData?.날짜 ? normalizeDate(initialData.날짜) : "", // ✅ 날짜 정규화 추가
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
  실적 수정
</Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* ✅ 세부사업명 필드 - 모드에 따라 다르게 표시 */}
<Grid item xs={12}>
  {mode === "attendance" ? (
    // 출석 등록 모드: 드롭다운 선택 가능
    <FormControl fullWidth>
      <InputLabel>세부사업명</InputLabel>
      <Select
        value={formData.세부사업명}
        onChange={handleChange("세부사업명")}
        label="세부사업명"
      >
        {subPrograms.map(sp => (
          <MenuItem key={sp} value={sp}>
            {sp}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ) : (
    // 실적 수정 모드: 읽기 전용 표시
    <TextField
      fullWidth
      label="세부사업명"
      value={formData.세부사업명}
      InputProps={{ 
        readOnly: true,
        style: { backgroundColor: '#f5f5f5' }
      }}
      helperText="실적 수정 시 세부사업명은 변경할 수 없습니다"
      variant="outlined"
    />
  )}
</Grid>

          {/* 이용자명 필드 - 통합 개선 */}
<Grid item xs={12}>
  {mode === "attendance" ? (
    <FormControl fullWidth>
      <InputLabel>이용자명 선택</InputLabel>
      <Select
        value={formData.이용자명}
        onChange={handleUserNameChange}
        label="이용자명 선택"
        displayEmpty
      >
        <MenuItem value="">
          <em>이용자를 선택하세요</em>
        </MenuItem>
        {availableMembers.map(member => (
          <MenuItem key={member.id} value={member.이용자명}>
            {member.이용자명} ({member.성별 || '성별미상'}) - {member.고유아이디 || 'ID없음'}
          </MenuItem>
        ))}
      </Select>
      {availableMembers.length === 0 && formData.세부사업명 && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          ⚠️ 해당 세부사업에 활성 이용자가 없습니다.
        </Typography>
      )}
    </FormControl>
  ) : (
    <TextField
      fullWidth
      label="이용자명"
      value={formData.이용자명}
      InputProps={{ 
        readOnly: true,
        style: { backgroundColor: '#f5f5f5' }
      }}
      helperText="실적 수정 시 이용자명은 변경할 수 없습니다"
    />
  )}
</Grid>

          {/* 날짜 필드 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="날짜"
              type="date"
              value={formData.날짜}
              onChange={handleChange("날짜")}
              InputLabelProps={{ shrink: true }}
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="고유아이디"
              value={formData.고유아이디}
              disabled
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

          {/* 버튼 영역 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onClose} variant="outlined">
                취소
              </Button>
              <Button type="submit" variant="contained">
                {mode === "attendance" ? "등록하기" : "수정하기"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default AttendancePerformanceForm;
