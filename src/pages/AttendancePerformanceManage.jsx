// src/pages/AttendancePerformanceManage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Grid, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import AttendancePerformanceTable from "../components/AttendancePerformanceTable";
import AttendancePerformanceForm from "../components/AttendancePerformanceForm";
import AttendancePerformanceUploadForm from "../components/AttendancePerformanceUploadForm";
import PerformanceSingleRegisterForm from "../components/PerformanceSingleRegisterForm";
import ExportButton from "../components/ExportButton";
import PerformanceStats from "../components/PerformanceStats";
import { useUserRole } from "../hooks/useUserRole";
import useSnackbar from "../components/useSnackbar";
import { useUser } from "../hooks/useUser";
import { getTeacherSubPrograms } from "../services/teacherSubProgramMapAPI";
import {
  fetchAttendances,
  fetchPerformances,
  saveAttendanceRecords,
  updatePerformance,
  deletePerformance,
  deleteMultiplePerformances,
  uploadAttendanceData
} from "../services/attendancePerformanceAPI";
import { getSubProgramMembers, matchMember } from "../services/subProgramMemberAPI";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { generateUniqueId } from "../utils/utils";
import { isPresent } from "../utils/attendanceUtils";
import { getStructureBySubProgram, getAllTeamSubProgramMaps } from "../services/teamSubProgramMapAPI";
import { teamSubProgramMap } from "../data/teamSubProgramMap";

function AttendancePerformanceManage() {
  const [mode, setMode] = useState("attendance");
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSingleRegister, setShowSingleRegister] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    세부사업명: "",
    날짜: "",
    function: "",
    unit: "",
  });

  const { role: userRole, loading: roleLoading } = useUserRole();
  const [SnackbarComp, showSnackbar] = useSnackbar();
  const { user } = useUser();
  const [subProgramOptions, setSubProgramOptions] = useState([]);
  const [functionOptions, setFunctionOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [allSubPrograms, setAllSubPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const unsubscribeRef = useRef(null);
  const [programStructureMap, setProgramStructureMap] = useState({});

  // subProgram에서 teamName을 동적으로 매핑하는 함수
  const getTeamName = (subProgram) => {
    for (const [team, subPrograms] of Object.entries(teamSubProgramMap)) {
      if (subPrograms.includes(subProgram)) return team;
    }
    return "미매칭 팀";
  };

  // ✅ 38-55행을 다음으로 수정
useEffect(() => {
  async function fetchSubPrograms() {
    setLoading(true);
    setError("");
    try {
      if (userRole === "teacher" && user?.email) {
        // ✅ 강사용 세부사업 조회 개선
        const mySubs = await getTeacherSubPrograms(user.email);
        const subProgramNames = mySubs.map(sub => sub.subProgramName || sub);
        setSubProgramOptions(subProgramNames);
        console.log("✅ 강사 담당 세부사업:", subProgramNames);
      } else {
        // ✅ 기존 관리자 로직 완전 유지
        const teamMaps = await getAllTeamSubProgramMaps();
        const allMembers = await getSubProgramMembers({});
        const allSubs = Array.from(new Set([
          ...allMembers.map(m => m.세부사업명).filter(Boolean),
          ...teamMaps.map(m => m.subProgramName)
        ]));
        setSubProgramOptions(allSubs);
        setAllSubPrograms(allSubs);

        const allFunctions = Array.from(new Set([
          ...allMembers.map(m => m["기능"]).filter(Boolean),
          ...teamMaps.map(m => m.functionType)
        ]));
        const allUnits = Array.from(new Set([
          ...allMembers.map(m => m["단위사업명"]).filter(Boolean),
          ...teamMaps.map(m => m.mainProgramName)
        ]));
        setFunctionOptions(allFunctions);
        setUnitOptions(allUnits);
      }
    } catch (e) {
      setError("세부사업명/필터 옵션 불러오기 실패");
      console.error("세부사업 로드 오류:", e);
    }
    setLoading(false);
  }

  fetchSubPrograms();
}, [userRole, user]);

  useEffect(() => {
    async function loadStructure() {
      const map = {};
      for (const sub of allSubPrograms) {
        const struct = await getStructureBySubProgram(sub) || {};
        map[sub] = struct;
      }
      setProgramStructureMap(map);
    }
    loadStructure();
  }, [allSubPrograms]);

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (mode === "attendance" && filters.세부사업명 && filters.날짜) {
      const q = query(
        collection(db, "AttendanceRecords"),
        where("세부사업명", "==", filters.세부사업명),
        where("날짜", "==", filters.날짜)
      );

      unsubscribeRef.current = onSnapshot(q, async (snapshot) => {
        const attendances = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          출석여부: doc.data().출석여부 === true || doc.data().출석여부 === "true" || doc.data().출석여부 === 1
        }));

        const members = await getSubProgramMembers({ 세부사업명: filters.세부사업명 });
        const activeMembers = members.filter(member => member.이용상태 !== "종결");

        const dataRows = activeMembers.map(m => {
          const attendance = attendances.find(a => a.이용자명 === m.이용자명 && a.날짜 === filters.날짜);
          return {
            id: m.id,
            이용자명: m.이용자명,
            성별: m.성별,
            세부사업명: m.세부사업명,
            날짜: filters.날짜,
            출석여부: attendance ? isPresent(attendance.출석여부) : false,
            고유아이디: m.고유아이디 || generateUniqueId(),
            이용상태: m.이용상태
          };
        });

        console.log("📅 출석 데이터:", dataRows);
        dataRows.sort((a, b) => {
          const aKey = `${a.세부사업명 || ""}_${a.이용자명 || ""}`;
          const bKey = `${b.세부사업명 || ""}_${b.이용자명 || ""}`;
          return aKey.localeCompare(bKey, "ko");
        });
        setData(dataRows);
      });
    } else if (mode === "performance") {
  let q = collection(db, "PerformanceSummary");
  const conds = [];
  
  conds.push(where("실적유형", "!=", "대량"));
  
  // ✅ 강사 권한 시 담당 세부사업으로 제한
  if (userRole === "teacher" && subProgramOptions.length > 0) {
    // 강사 담당 세부사업 중 하나로 필터링 (첫 번째 사업으로 기본 설정)
    const teacherSubProgram = filters.세부사업명 || subProgramOptions[0];
    conds.push(where("세부사업명", "==", teacherSubProgram));
    
    // 강사는 본인 담당 세부사업만 조회하므로 다른 필터 제한
    if (filters.날짜) conds.push(where("날짜", "==", filters.날짜));
  } else {
    // 관리자/매니저는 기존 로직 유지
    if (filters.function) conds.push(where("function", "==", filters.function));
    if (filters.unit) conds.push(where("unit", "==", filters.unit));
    if (filters.세부사업명) conds.push(where("세부사업명", "==", filters.세부사업명));
    if (filters.날짜) conds.push(where("날짜", "==", filters.날짜));
  }
  
  if (conds.length > 0) q = query(q, ...conds);

      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          출석여부: doc.data().출석여부 === true || doc.data().출석여부 === "true" || doc.data().출석여부 === 1
        }));

        const enrichedRows = rows.map(row => ({
          ...row,
          teamName: row.team || getTeamName(row.세부사업명)
        }));

        console.log("📊 실적 데이터:", enrichedRows);
        enrichedRows.sort((a, b) => {
          const aKey = `${a.세부사업명 || ""}_${a.이용자명 || ""}`;
          const bKey = `${b.세부사업명 || ""}_${b.이용자명 || ""}`;
          return aKey.localeCompare(bKey, "ko");
        });
        setData(enrichedRows);
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [mode, filters.세부사업명, filters.날짜, filters.function, filters.unit]);

  const handleSearch = async () => {
    if (mode === "attendance") {
      return;
    } else {
      setLoading(true);
      setError("");
      try {
        // ✅ 강사 권한 시 담당 세부사업으로 필터링
let searchFilters = {
  function: filters.function,
  unit: filters.unit,
  세부사업명: filters.세부사업명,
  날짜: filters.날짜
};

if (userRole === "teacher" && subProgramOptions.length > 0) {
  // 강사는 담당 세부사업만 조회
  searchFilters = {
    세부사업명: filters.세부사업명 || subProgramOptions[0],
    날짜: filters.날짜
  };
}

const result = await fetchPerformances(searchFilters);

        console.log("실적 데이터:", result);
        if (result.length === 0) {
          setError("해당 조건에 맞는 실적 데이터가 없습니다.");
        } else {
          const enrichedResult = result.map(row => ({
            ...row,
            teamName: row.team || getTeamName(row.세부사업명)
          }));
          setData(enrichedResult);
        }
      } catch (e) {
        setError("실적 데이터 불러오기 실패: " + e.message);
      }
      setLoading(false);
    }
  };

  // ✅ 핵심 기능 복원: 개별 출석 체크 처리
  const handleCheck = async (updatedRow) => {
    setLoading(true);
    try {
      await saveAttendanceRecords([{
        이용자명: updatedRow.이용자명,
        날짜: updatedRow.날짜,
        세부사업명: updatedRow.세부사업명,
        성별: updatedRow.성별,
        출석여부: updatedRow.출석여부,
        고유아이디: updatedRow.고유아이디
      }]);
      showSnackbar(
        `${updatedRow.이용자명}님 ${updatedRow.출석여부 ? '출석' : '결석'} 처리 완료`, 
        "success"
      );
    } catch (e) {
      setError("출석 체크 실패");
      showSnackbar("출석 체크 실패", "error");
    }
    setLoading(false);
  };

  const handleBulkAttendanceSave = async (rows) => {
    if (!filters.날짜 || !filters.세부사업명) {
      showSnackbar("세부사업명과 날짜를 선택하세요.", "warning");
      return;
    }
    if (rows.length === 0) {
      showSnackbar("출석할 이용자를 선택하세요.", "warning");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await saveAttendanceRecords(rows.map(row => ({
        이용자명: row.이용자명,
        날짜: row.날짜,
        세부사업명: row.세부사업명,
        성별: row.성별,
        출석여부: row.출석여부 === true || row.출석여부 === "true",
        고유아이디: row.고유아이디
      })));
      showSnackbar(`선택된 ${rows.length}명 출석 저장 및 실적 자동 연동 완료`, "success");
      setMode("performance");
      await handleSearch();
    } catch (e) {
      setError("일괄 출석 저장 실패");
      showSnackbar("일괄 출석 저장 실패", "error");
    }
    setLoading(false);
  };

  const handleSingleRegister = async (formData) => {
    if (!formData.세부사업명 || !formData.날짜) {
      showSnackbar("세부사업명과 날짜를 입력하세요.", "warning");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const matchedMember = await matchMember(formData.이용자명, formData.생년월일, formData.연락처);
      const 고유아이디 = matchedMember ? matchedMember.고유아이디 : generateUniqueId();

      await saveAttendanceRecords([{
        ...formData,
        고유아이디,
        상태: matchedMember ? "매칭" : "신규"
      }]);
      showSnackbar("출석이 등록(실적 자동 연동)되었습니다.", "success");
      setShowForm(false);
      setMode("performance");
      await handleSearch();
    } catch (err) {
      setError("등록 실패");
      showSnackbar(err.message || "등록 실패", "error");
    }
    setLoading(false);
  };

  const handleUpload = async (rows) => {
    setLoading(true);
    setError("");
    try {
      const processedRows = await Promise.all(rows.map(async row => {
        const matchedMember = await matchMember(row.이용자명, row.생년월일, row.연락처);
        return {
          ...row,
          고유아이디: matchedMember ? matchedMember.고유아이디 : generateUniqueId(),
          상태: matchedMember ? "매칭" : "신규"
        };
      }));

      const result = await uploadAttendanceData(processedRows);
      console.log("📥 업로드된 출석 데이터:", processedRows);
      console.log("📥 업로드 결과:", result);
      setUploadResult(result);
      showSnackbar("대량 출석 등록(실적 자동 연동) 완료", "success");
      setShowUpload(false);
      setMode("performance");
      await handleSearch();
    } catch {
      setError("대량 등록 실패");
      showSnackbar("대량 등록 실패", "error");
    }
    setLoading(false);
  };

  const handleSinglePerformanceRegister = async () => {
    setLoading(true);
    setError("");
    await handleSearch();
    setShowSingleRegister(false);
    showSnackbar("실적 단건 등록 완료", "success");
    setLoading(false);
  };

  // ✅ 실적 수정 기능 완전 개선
  const handleEdit = (row) => {
    console.log("✅ 수정할 데이터:", row);
    setEditing({
      ...row,
      id: row.id,
      세부사업명: row.세부사업명 || "",
      이용자명: row.이용자명 || "",
      날짜: row.날짜 || "",
      성별: row.성별 || "",
      "내용(특이사항)": row["내용(특이사항)"] || "",
      출석여부: row.출석여부,
      고유아이디: row.고유아이디 || "",
      유료무료: row.유료무료 || row.feeType || "",
      기능: row.기능 || row.function || "",
      팀명: row.팀명 || row.team || "",
      단위사업명: row.단위사업명 || row.unit || "",
      횟수: row.횟수 || row.sessions || 1
    });
    setShowEditModal(true);
  };

  // ✅ 완전히 수정된 handleUpdate 함수 - undefined 값 완전 제거
  const handleUpdate = async (formData) => {
    setLoading(true);
    setError("");
    try {
      console.log("✅ 원본 폼 데이터:", formData);
      
      // ✅ undefined 값 제거 및 필요한 필드만 선별
      const updateData = {};
      
      // 필수 필드들
      if (formData.이용자명 !== undefined) updateData.이용자명 = formData.이용자명;
      if (formData.날짜 !== undefined) updateData.날짜 = formData.날짜;
      if (formData.세부사업명 !== undefined) updateData.세부사업명 = formData.세부사업명;
      if (formData.성별 !== undefined) updateData.성별 = formData.성별;
      if (formData["내용(특이사항)"] !== undefined) updateData["내용(특이사항)"] = formData["내용(특이사항)"];
      if (formData.출석여부 !== undefined) updateData.출석여부 = formData.출석여부;
      if (formData.고유아이디 !== undefined) updateData.고유아이디 = formData.고유아이디;
      if (formData.횟수 !== undefined) updateData.횟수 = formData.횟수;
      
      // 매핑 필드들 (한글 -> 영어)
      if (formData.유료무료 !== undefined) updateData.feeType = formData.유료무료;
      if (formData.기능 !== undefined) updateData.function = formData.기능;
      if (formData.팀명 !== undefined) updateData.team = formData.팀명;
      if (formData.단위사업명 !== undefined) updateData.unit = formData.단위사업명;
      
      console.log("✅ 정제된 업데이트 데이터:", updateData);

      await updatePerformance(formData.id, updateData);
      showSnackbar("실적이 수정되었습니다.", "success");
      setEditing(null);
      setShowEditModal(false);
      await handleSearch();
    } catch (err) {
      console.error("수정 실패:", err);
      setError("수정 실패: " + err.message);
      showSnackbar("수정 실패: " + err.message, "error");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    
    setLoading(true);
    setError("");
    try {
      await deletePerformance(id);
      showSnackbar("삭제되었습니다.", "success");
      await handleSearch();
    } catch (err) {
      setError("삭제 실패: " + err.message);
      showSnackbar("삭제 실패: " + err.message, "error");
    }
    setLoading(false);
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`선택한 ${ids.length}건을 정말 삭제하시겠습니까?`)) return;
    
    setLoading(true);
    setError("");
    try {
      await deleteMultiplePerformances(ids);
      showSnackbar(`선택된 ${ids.length}건 삭제 완료`, "success");
      await handleSearch();
    } catch (err) {
      setError("일괄 삭제 실패: " + err.message);
      showSnackbar("일괄 삭제 실패: " + err.message, "error");
    }
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      if (mode === "attendance") {
        return {
          ...prev,
          [key]: value,
          ...(key === "세부사업명" ? { 날짜: "" } : {})
        };
      } else {
        if (key === "function") {
          return { ...prev, function: value, unit: "", 세부사업명: "" };
        }
        if (key === "unit") {
          return { ...prev, unit: value, 세부사업명: "" };
        }
        return { ...prev, [key]: value };
      }
    });
  };

  if (roleLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          권한 정보를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  const filteredUnitOptions = filters.function
    ? Array.from(new Set([
        ...unitOptions,
        ...data.filter(row => row.function === filters.function).map(row => row.unit).filter(Boolean)
      ]))
    : unitOptions;

  const filteredSubProgramOptions = filters.unit
    ? Array.from(new Set([
        ...allSubPrograms,
        ...data.filter(row => row.unit === filters.unit).map(row => row.세부사업명).filter(Boolean)
      ]))
    : allSubPrograms;

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: "100vw" }}>
      {SnackbarComp}
      
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontWeight: 700,
          fontSize: { xs: "1.25rem", sm: "1.6rem" },
          color: "#222",
          textAlign: { xs: "center", sm: "left" }
        }}
      >
        출석·실적 통합 관리
      </Typography>

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            처리 중입니다...
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {uploadResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ 등록 성공: {uploadResult.filter(r => r.success).length || 0}건 / 
          ❌ 실패: {uploadResult.filter(r => !r.success).length || 0}건
        </Alert>
      )}

      {mode === "performance" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <ExportButton
            data={data}
            fileName="실적_통계.xlsx"
            label="엑셀 다운로드"
            headers={[
              ["날짜", "날짜"],
              ["세부사업명", "세부사업명"],
              ["이용자명", "이용자명"],
              ["성별", "성별"],
              ["내용(특이사항)", "내용(특이사항)"],
              ["출석여부", "출석여부"],
              ["고유아이디", "고유아이디"]
            ]}
          />
        </Box>
      )}

      {mode === "performance" && <PerformanceStats data={data} />}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Button
              variant={mode === "attendance" ? "contained" : "outlined"}
              onClick={() => {
                setMode("attendance");
                setTimeout(() => handleSearch(), 0);
              }}
              fullWidth
              size="large"
              sx={{ fontWeight: mode === "attendance" ? 700 : 400 }}
            >
              출석관리
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant={mode === "performance" ? "contained" : "outlined"}
              onClick={() => {
                setMode("performance");
                setTimeout(() => handleSearch(), 0);
              }}
              fullWidth
              size="large"
              sx={{ fontWeight: mode === "performance" ? 700 : 400 }}
            >
              실적관리
            </Button>
          </Grid>
        </Grid>
      </Box>

      {mode === "attendance" && (
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              세부사업명
            </Typography>
            <select
              value={filters.세부사업명}
              onChange={e => handleFilterChange("세부사업명", e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            >
              <option value="">세부사업명 선택</option>
              {subProgramOptions.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              날짜
            </Typography>
            <input
              type="date"
              value={filters.날짜}
              onChange={e => handleFilterChange("날짜", e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
              disabled={!filters.세부사업명}
            />
          </Grid>
        </Grid>
      )}

      {mode === "performance" && (
  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
    {/* ✅ 강사는 기능/단위사업명 필터 숨기기 */}
    {userRole !== "teacher" && (
      <>
        <Grid item xs={12} sm={3}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            기능
          </Typography>
          <select
            value={filters.function}
            onChange={e => handleFilterChange("function", e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">전체</option>
            {functionOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            단위사업명
          </Typography>
          <select
            value={filters.unit}
            onChange={e => handleFilterChange("unit", e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
            disabled={!filters.function}
          >
            <option value="">전체</option>
            {filteredUnitOptions.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Grid>
      </>
    )}
    <Grid item xs={12} sm={userRole === "teacher" ? 6 : 2}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        세부사업명
      </Typography>
      <select
        value={filters.세부사업명}
        onChange={e => handleFilterChange("세부사업명", e.target.value)}
        className="w-full border rounded px-3 py-2 text-base"
        disabled={userRole !== "teacher" && !filters.unit}
      >
        <option value="">
          {userRole === "teacher" ? "담당 세부사업 선택" : "전체"}
        </option>
        {userRole === "teacher" 
          ? subProgramOptions.map((sp, idx) => (
              <option key={sp + idx} value={sp}>{sp}</option>
            ))
          : filteredSubProgramOptions.map((sp, idx) => (
              <option key={sp + idx} value={sp}>{sp}</option>
            ))
        }
      </select>
    </Grid>
    <Grid item xs={12} sm={userRole === "teacher" ? 6 : 4}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        날짜
      </Typography>
      <input
        type="date"
        value={filters.날짜}
        onChange={e => handleFilterChange("날짜", e.target.value)}
        className="w-full border rounded px-3 py-2 text-base"
      />
    </Grid>
  </Grid>
)}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSearch}
          size="large"
          sx={{ minWidth: 100, fontWeight: 600 }}
        >
          조회
        </Button>
      </Box>

      {mode === "attendance" && userRole !== "teacher" && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                onClick={() => setShowForm(true)}
                fullWidth
                size="large"
              >
                + 단건 등록
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                onClick={() => {
                  if (userRole === "teacher") {
                    showSnackbar("권한이 없습니다.", "error");
                    return;
                  }
                  setShowUpload(true);
                }}
                fullWidth
                size="large"
              >
                📥 대량 업로드
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {mode === "performance" && userRole !== "teacher" && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setShowSingleRegister(true)}
            size="large"
          >
            + 단건 등록
          </Button>
        </Box>
      )}

      {/* ✅ 핵심 기능: 체크박스 출석 체크 기능 완전 복원 */}
      <AttendancePerformanceTable
        mode={mode}
        userRole={userRole}
        data={data}
        onEdit={mode === "performance" ? handleEdit : undefined}
        onDelete={mode === "performance" ? handleDelete : undefined}
        onBulkDelete={mode === "performance" ? handleBulkDelete : undefined}
        onCheck={mode === "attendance" ? handleCheck : undefined} // ✅ 개별 출석 체크
        onBulkAttendanceSave={mode === "attendance" ? handleBulkAttendanceSave : undefined} // ✅ 일괄 출석 저장
      />

      {/* ✅ 실적 수정 모달 */}
      <Dialog 
        open={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditing(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>실적 수정</DialogTitle>
        <DialogContent>
          {editing && (
            <AttendancePerformanceForm
              mode="performance"
              initialData={editing}
              onSubmit={handleUpdate}
              onClose={() => {
                setShowEditModal(false);
                setEditing(null);
              }}
              structure={programStructureMap}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowEditModal(false);
              setEditing(null);
            }}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 단건 등록 다이얼로그 */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>단건 출석 등록</DialogTitle>
        <DialogContent>
          <AttendancePerformanceForm
            mode="attendance"
            initialData={{}}
            onSubmit={handleSingleRegister}
            onClose={() => setShowForm(false)}
            structure={programStructureMap}
          />
        </DialogContent>
      </Dialog>

      {/* 대량 업로드 다이얼로그 */}
      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>대량 출석 업로드</DialogTitle>
        <DialogContent>
          <AttendancePerformanceUploadForm
            mode="attendance"
            onSuccess={handleUpload}
            onClose={() => setShowUpload(false)}
            structure={programStructureMap}
          />
        </DialogContent>
      </Dialog>

      {/* 실적 단건 등록 다이얼로그 */}
      <Dialog
        open={showSingleRegister}
        onClose={() => setShowSingleRegister(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>실적 단건 등록</DialogTitle>
        <DialogContent>
          <PerformanceSingleRegisterForm
            onSuccess={handleSinglePerformanceRegister}
            onClose={() => setShowSingleRegister(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AttendancePerformanceManage;