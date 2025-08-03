// src/pages/AttendancePerformanceManage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Grid, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Pagination from "@mui/material/Pagination";
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
  fetchPerformancesPaging,
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50); // 필요시 조정
  const [lastDocs, setLastDocs] = useState([]); // 각 페이지별 커서 쌓음(이전 페이지 가능하게)
  const [totalPages, setTotalPages] = useState(1);
  const [pageData, setPageData] = useState([]);
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
    console.log("🔍 programStructureMap 생성 시작:", allSubPrograms);
    
    // ✅ 두 가지 구조 모두 생성
    const flatMap = {}; // 기존 구조 (실적 수정용)
    const hierarchicalMap = {}; // 계층 구조 (드롭다운용)
    
    for (const sub of allSubPrograms) {
      const struct = await getStructureBySubProgram(sub) || {};
      
      // 기존 flat 구조 유지
      flatMap[sub] = struct;
      
      // 계층 구조 생성
      if (struct.team && struct.unit) {
        if (!hierarchicalMap[struct.team]) {
          hierarchicalMap[struct.team] = {};
        }
        if (!hierarchicalMap[struct.team][struct.unit]) {
          hierarchicalMap[struct.team][struct.unit] = [];
        }
        if (!hierarchicalMap[struct.team][struct.unit].includes(sub)) {
          hierarchicalMap[struct.team][struct.unit].push(sub);
        }
      }
    }
    
    console.log("✅ 생성된 flatMap:", flatMap);
    console.log("✅ 생성된 hierarchicalMap:", hierarchicalMap);
    
    // ✅ 두 구조를 모두 포함하는 객체 설정
    setProgramStructureMap({
      flat: flatMap,
      hierarchical: hierarchicalMap
    });
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
  setLoading(true);
  setError("");
  // 기존 onSnapshot 구독 해제
  if (unsubscribeRef.current) {
    unsubscribeRef.current();
    unsubscribeRef.current = null;
  }

  // 페이징용 startAfterDoc 가져오기 (page가 1보다 클 때만)
  const startAfterDoc = page > 1 ? lastDocs[page - 2] : null;

  // 필터에 강사 세부사업 적용 로직 그대로 재구성
  const currentFilters = { ...filters };
  if (userRole === "teacher" && subProgramOptions.length === 0) {
    setError("담당 세부사업이 설정되지 않았습니다. 관리자에게 문의하세요.");
    setLoading(false);
    return;
  }
  if (userRole === "teacher" && subProgramOptions.length > 0) {
    currentFilters.세부사업명 = filters.세부사업명 || subProgramOptions[0];
    // 강사는 다른 필터 제한 가능
    if (!filters.날짜) delete currentFilters.날짜;
  }

  fetchPerformancesPaging({
    filters: currentFilters,
    pageSize,
    startAfterDoc
  })
    .then(result => {
      const items = result.items || [];
      // 페이징 디버깅 로그
  console.log(`@@@@ 페이지: ${page}, data.length: ${items.length}, startAfterDoc:`, startAfterDoc);
  console.log('@@@@ result.lastDoc:', result.lastDoc);
  console.log('@@@@ lastDocs:', lastDocs);

      const enrichedRows = items.map(row => ({
        ...row,
        teamName: row.team || getTeamName(row.세부사업명)
      }));

      enrichedRows.sort((a, b) => {
      const aKey = `${a.세부사업명 || ""}_${a.이용자명 || ""}`;
      const bKey = `${b.세부사업명 || ""}_${b.이용자명 || ""}`;
      return aKey.localeCompare(bKey, "ko");
    });

    setData(enrichedRows);

    // 2) 총 데이터 개수를 받아 페이지 수 계산 후 상태 저장
    // fetchPerformancesPaging이 {total} 필드를 반환해야 함
    if (result.total) {
      setTotalPages(Math.ceil(result.total / pageSize));
    } else {
      setTotalPages(1);
    }

    // 3) 페이지 커서 저장
    const newLastDocs = [...lastDocs];
if (result.items.length > 0 && result.lastDoc) {
  newLastDocs[page - 1] = result.lastDoc;
}
setLastDocs(newLastDocs);

    setLoading(false);
  })
  .catch(err => {
    setError("실적 데이터(페이지) 로드 실패: " + err.message);
    setLoading(false);
    setData([]);
    setTotalPages(1); // 실패 시 기본값 세팅
  });
}

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [mode, filters.세부사업명, filters.날짜, filters.function, filters.unit, page]);

  // ✅ 모드 변경 시 공통 초기화
useEffect(() => {
  setData([]);
  setError("");
  setUploadResult(null);
}, [mode]);

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
        날짜: filters.날짜,
        performanceType: "개별"
      };

      if (userRole === "teacher" && subProgramOptions.length > 0) {
        // 강사는 담당 세부사업만 조회
        searchFilters = {
          세부사업명: filters.세부사업명 || subProgramOptions[0],
          날짜: filters.날짜,
          performanceType: "개별"
        };
      }

      // 페이징용 startAfterDoc (page가 1보다 클 때만)
      const startAfterDoc = (page > 1 && lastDocs[page - 2]) ? lastDocs[page - 2] : null;

      const result = await fetchPerformancesPaging({
        filters: searchFilters,
        pageSize,
        startAfterDoc
      });

      const items = result.items || [];
      console.log("실적 데이터:", items);

      if (items.length === 0) {
        setError("해당 조건에 맞는 실적 데이터가 없습니다.");
      } else {
        const enrichedResult = items.map(row => ({
          ...row,
          teamName: row.team || getTeamName(row.세부사업명)
        }));
        setData(enrichedResult);

        // 페이지 정보에 따른 커서 저장
        const newLastDocs = [...lastDocs];
        if (result.lastDoc) newLastDocs[page - 1] = result.lastDoc;
        setLastDocs(newLastDocs);
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
      const uniqueRows = Array.from(
  new Map(rows.map(row => [row.고유아이디, row])).values()
);

      await saveAttendanceRecords(uniqueRows.map(row => ({
        이용자명: row.이용자명,
        날짜: row.날짜,
        세부사업명: row.세부사업명,
        성별: row.성별,
        출석여부: row.출석여부 === true || row.출석여부 === "true",
        고유아이디: row.고유아이디
      })));
      showSnackbar(`선택된 ${runiqueRows.length}명 출석 저장 및 실적 자동 연동 완료`, "success");
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
    setMode("performance"); 
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

      if (!formData.id) {
  setError("수정할 항목의 ID가 없습니다.");
  setLoading(false);
  return;
}
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
    let newFilters;
    if (mode === "attendance") {
      newFilters = {
        ...prev,
        [key]: value,
        ...(key === "세부사업명" ? { 날짜: "" } : {})
      };
    } else {
      if (key === "function") {
        newFilters = { ...prev, function: value, unit: "", 세부사업명: "" };
      } else if (key === "unit") {
        newFilters = { ...prev, unit: value, 세부사업명: "" };
      } else {
        newFilters = { ...prev, [key]: value };
      }
    }
    return newFilters;
  });

  setPage(1);
  setLastDocs([]);
  
  // 직후 검색 호출 (debounce 적용 시 제외)
  handleSearch();
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
      데이터를 불러오는 중입니다. 잠시만 기다려 주세요...
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
  <Grid container columns={12} spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}>
      <Button
        variant={mode === "attendance" ? "contained" : "outlined"}
        onClick={() => {
          setMode("attendance");
          setData([]);
          setError("");
          setUploadResult(null);
        }}
        fullWidth
        size="large"
        sx={{ fontWeight: mode === "attendance" ? 700 : 400 }}
      >
        출석관리
      </Button>
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <Button
        variant={mode === "performance" ? "contained" : "outlined"}
        onClick={() => {
          setMode("performance");
          setData([]);
          setError("");
          setUploadResult(null);
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
  <Grid container columns={12} spacing={2} alignItems="center" sx={{ mb: 2 }}>
    <Grid size={6}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        세부사업명
      </Typography>
      <select
        value={filters.세부사업명}
        onChange={e => handleFilterChange("세부사업명", e.target.value)}
        className="w-full border rounded px-3 py-2 text-base"
      >
        <option value="">세부사업명 선택</option>
        {subProgramOptions.map(sp => (
          <option key={sp} value={sp}>{sp}</option>
        ))}
      </select>
      {!filters.세부사업명 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          세부사업명을 먼저 선택해주세요.
        </Typography>
      )}
    </Grid>
    <Grid size={6}>
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
  <Grid container columns={12} spacing={2} alignItems="center" sx={{ mb: 2 }}>
    {userRole !== "teacher" && (
      <>
        <Grid size={3}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            기능
          </Typography>
          <select
            value={filters.function}
            onChange={e => handleFilterChange("function", e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          >
            <option value="">전체</option>
            {functionOptions.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {!filters.function && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              기능을 먼저 선택해주세요.
            </Typography>
          )}
        </Grid>
        <Grid size={3}>
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
            {filteredUnitOptions.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Grid>
      </>
    )}
    <Grid size={2}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        세부사업명
      </Typography>
      <select
        value={filters.세부사업명}
        onChange={e => handleFilterChange("세부사업명", e.target.value)}
        className="w-full border rounded px-3 py-2 text-base"
        disabled={userRole !== "teacher" && !filters.unit}
      >
        <option value="">{userRole === "teacher" ? "담당 세부사업 선택" : "전체"}</option>
        {(userRole === "teacher" ? subProgramOptions : filteredSubProgramOptions).map((sp, idx) => (
          <option key={sp + idx} value={sp}>{sp}</option>
        ))}
      </select>
    </Grid>
    <Grid size={4}>
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
    <Grid container columns={12} spacing={2}>
      <Grid size={6}>
        <Button
          variant="contained"
          onClick={() => setShowForm(true)}
          fullWidth
          size="large"
        >
          + 단건 등록
        </Button>
      </Grid>
      <Grid size={6}>
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

{mode === "performance" && (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center", mb: 2 }}>
    <Button
      variant="outlined"
      size="small"
      onClick={() => page > 1 && setPage(page - 1)}
      disabled={page <= 1 || loading}
    >
      이전
    </Button>

    <Pagination
      count={totalPages || 1}  // totalPages가 없으면 1페이지로 fallback
      page={page}
      onChange={(e, value) => setPage(value)}
      color="primary"
      siblingCount={1}
      boundaryCount={1}
      disabled={loading}
      shape="rounded"
    />

    <Button
      variant="outlined"
      size="small"
      onClick={() => page < (totalPages || 1) && setPage(page + 1)}
      disabled={loading || page >= (totalPages || 1)}
    >
      다음
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
            mode="performance"   // ✅ 반드시 지정 (attendance 기본값 방지)
  initialData={editing}   // ✅ 수정 데이터 전달
  onSubmit={handleUpdate} // ✅ 수정 시 updatePerformance 실행
  onCancel={() => {
    setShowEditModal(false);
    setEditing(null);
  }}
  structure={{
    ...programStructureMap.flat,
    flat: programStructureMap.flat,
    hierarchical: programStructureMap.hierarchical
  }}
/>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowEditModal(false);
              setEditing(null);
            }}
            autoFocus   // 👈 추가!
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
    {(!programStructureMap.flat || !programStructureMap.hierarchical) ? (
  <Alert severity="warning">사업 구조를 불러오는 중입니다...</Alert>
) : (
  <AttendancePerformanceForm
    mode="attendance"
    onSubmit={handleSingleRegister}
    onClose={() => setShowForm(false)}
    structure={programStructureMap.hierarchical || {}}
    flatStructure={programStructureMap.flat || {}}
  />
)}
    {/* ✅ 디버깅용 - 배포 시 제거 */}
    {process.env.NODE_ENV === 'development' && (
  <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      DEBUG: programStructureMap 구조
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      Flat keys: {Object.keys(programStructureMap.flat || {}).join(', ')}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      Hierarchical keys: {Object.keys(programStructureMap.hierarchical || {}).join(', ')}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      AllSubPrograms: {allSubPrograms.join(', ')}
    </Typography>
  </Box>
)}
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
  onSuccess={() => {
    setShowUpload(false);
    handleSearch();
  }}
  onClose={() => setShowUpload(false)}
  structure={{
    ...programStructureMap.flat,
    flat: programStructureMap.flat,
    hierarchical: programStructureMap.hierarchical
  }}
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