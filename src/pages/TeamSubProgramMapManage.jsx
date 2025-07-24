import React, { useEffect, useState } from "react";
import {
  getAllTeamSubProgramMaps,
  addTeamSubProgramMap,
  deleteTeamSubProgramMap
} from "../services/teamSubProgramMapAPI";
import TeamSubProgramUploadForm from "../components/TeamSubProgramUploadForm";
import { useAuthContext } from "../contexts/AuthContext";
import {
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Snackbar
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { exportToExcel } from "../utils/exportToExcel";

function TeamSubProgramMapManage() {
  const { user, userRole } = useAuthContext();
  const [mappings, setMappings] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    functionType: "",
    teamName: "",
    mainProgramName: "",
    subProgramName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // ✅ 권한 확인 (admin과 manager 모두 허용)
  useEffect(() => {
    if (userRole && !["admin", "manager"].includes(userRole)) {
      setError("관리자 또는 매니저 권한이 필요합니다.");
      return;
    }
  }, [userRole]);

  // ✅ 기존 fetchData 함수 완전 유지 + 로딩 상태 추가
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllTeamSubProgramMaps();
      setMappings(data);
      setError(""); // 성공 시 에러 초기화
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      setError("데이터를 불러오는데 실패했습니다: " + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && ["admin", "manager"].includes(userRole)) {
      fetchData();
    }
  }, [user, userRole]);

  // ✅ handleChange 함수 수정 (Select 컴포넌트용)
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 handleChange: ${name} = ${value}`); // 디버그용
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Autocomplete 전용 핸들러 수정 (inputValue도 처리)
  const handleAutocompleteChange = (fieldName, newValue, reason, details) => {
    console.log(`📝 handleAutocompleteChange: ${fieldName} = ${newValue}, reason: ${reason}`);
    
    // freeSolo 모드에서 사용자가 직접 타이핑한 경우도 처리
    const finalValue = newValue || "";
    setForm(prev => ({ ...prev, [fieldName]: finalValue }));
  };

  // ✅ Autocomplete input 변경 핸들러 추가
  const handleAutocompleteInputChange = (fieldName, newInputValue, reason) => {
    console.log(`📝 handleAutocompleteInputChange: ${fieldName} = ${newInputValue}, reason: ${reason}`);
    
    // 타이핑 중에도 실시간으로 form 상태 업데이트
    if (reason === 'input') {
      setForm(prev => ({ ...prev, [fieldName]: newInputValue }));
    }
  };

  // ✅ 강화된 handleSave 함수
  const handleSave = async () => {
    setError("");
    setSuccess("");

    // ✅ 권한 재확인 (admin과 manager 모두 허용)
    if (!["admin", "manager"].includes(userRole)) {
      setError("관리자 또는 매니저 권한이 필요합니다.");
      return;
    }

    // ✅ 폼 상태 디버깅 로그
    console.log("📊 현재 폼 상태:", form);

    const { functionType, teamName, mainProgramName, subProgramName } = form;

    // ✅ 강화된 유효성 검사
    const formFields = {
      functionType: functionType?.trim() || "",
      teamName: teamName?.trim() || "",
      mainProgramName: mainProgramName?.trim() || "",
      subProgramName: subProgramName?.trim() || ""
    };

    console.log("🔍 검증할 필드들:", formFields);

    // ✅ 빈 값 체크 개선
    const emptyFields = [];
    if (!formFields.functionType) emptyFields.push("기능");
    if (!formFields.teamName) emptyFields.push("팀명");
    if (!formFields.mainProgramName) emptyFields.push("단위사업명");
    if (!formFields.subProgramName) emptyFields.push("세부사업명");

    if (emptyFields.length > 0) {
      const errorMsg = `다음 항목을 입력해주세요: ${emptyFields.join(", ")}`;
      console.error("❌ 필수 필드 누락:", emptyFields);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    try {
      console.log("💾 저장 시도 중...", formFields);

      await addTeamSubProgramMap({
        subProgramName: formFields.subProgramName,
        teamName: formFields.teamName,
        functionType: formFields.functionType,
        mainProgramName: formFields.mainProgramName,
      }, editing !== null);

      // ✅ 성공 후 폼 초기화
      setForm({
        functionType: "",
        teamName: "",
        mainProgramName: "",
        subProgramName: "",
      });
      setEditing(null);
      setSuccess("매핑이 성공적으로 저장되었습니다.");
      await fetchData();
    } catch (err) {
      console.error("💥 저장 실패:", err);
      setError(err.message || "저장 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // ✅ 기존 handleEdit 함수 완전 유지
  const handleEdit = (map) => {
    setForm({
      functionType: map.functionType,
      teamName: map.teamName,
      mainProgramName: map.mainProgramName,
      subProgramName: map.subProgramName,
    });
    setEditing(map.id);
  };

  // ✅ 기존 handleDelete 함수 완전 유지 + 에러 처리 강화
  const handleDelete = async (id) => {
    if (!["admin", "manager"].includes(userRole)) {
      setError("관리자 또는 매니저 권한이 필요합니다.");
      return;
    }

    if (window.confirm("정말 삭제하시겠습니까?")) {
      setLoading(true);
      try {
        await deleteTeamSubProgramMap(id);
        setSuccess("매핑이 성공적으로 삭제되었습니다.");
        await fetchData();
      } catch (err) {
        console.error("삭제 실패:", err);
        setError("삭제 중 오류가 발생했습니다: " + err.message);
      }
      setLoading(false);
    }
  };

  // ✅ 기존 handleExportExcel 함수 완전 유지
  const handleExportExcel = () => {
    const formatted = filteredMappings.map((map) => ({
      세부사업명: map.subProgramName,
      팀명: map.teamName,
      기능: map.functionType,
      단위사업명: map.mainProgramName,
    }));

    exportToExcel({
      data: formatted,
      fileName: "팀별_세부사업_매핑",
      sheetName: "TeamMapping",
    });
  };

  // ✅ 기존 필터링 로직 완전 유지
  const filteredMappings = mappings.filter((map) =>
    `${map.subProgramName}${map.teamName}${map.functionType}${map.mainProgramName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ✅ 기존 unique 옵션 생성 로직 완전 유지
  const uniqueMainProgramsByTeam = [...new Set(
    mappings
      .filter((m) => !form.teamName || m.teamName === form.teamName)
      .map((m) => m.mainProgramName)
      .filter(Boolean)
  )].sort();

  const uniqueSubProgramsByMain = [...new Set(
    mappings
      .filter((m) => !form.mainProgramName || m.mainProgramName === form.mainProgramName)
      .map((m) => m.subProgramName)
      .filter(Boolean)
  )].sort();

  // ✅ 권한 없는 사용자 처리 (admin, manager가 아닌 경우)
  if (userRole && !["admin", "manager"].includes(userRole)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          관리자 또는 매니저 권한이 필요한 페이지입니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        팀-세부사업 매핑 관리
      </Typography>

      {/* ✅ 에러 및 성공 알림 */}
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {success && (
        <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        </Snackbar>
      )}

      {/* ✅ 폼 영역 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editing ? "매핑 수정" : "새 매핑 추가"}
        </Typography>

        <TextField
          label="검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, mb: 2 }}>
          {/* ✅ 기능 선택 (Select 유지) */}
          <FormControl fullWidth>
            <InputLabel>기능</InputLabel>
            <Select
              name="functionType"
              value={form.functionType}
              onChange={handleChange}
              label="기능"
            >
              <MenuItem value="서비스제공 기능">서비스제공 기능</MenuItem>
              <MenuItem value="사례관리 기능">사례관리 기능</MenuItem>
              <MenuItem value="지역조직화 기능">지역조직화 기능</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ 팀명 선택 (Select 유지) */}
          <FormControl fullWidth>
            <InputLabel>팀명</InputLabel>
            <Select
              name="teamName"
              value={form.teamName}
              onChange={handleChange}
              label="팀명"
            >
              <MenuItem value="서비스제공연계팀">서비스제공연계팀</MenuItem>
              <MenuItem value="마을협력팀">마을협력팀</MenuItem>
              <MenuItem value="마을돌봄팀">마을돌봄팀</MenuItem>
              <MenuItem value="사례관리팀">사례관리팀</MenuItem>
              <MenuItem value="운영지원팀">운영지원팀</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ 단위사업명 (Autocomplete 완전 수정) */}
          <Autocomplete
            value={form.mainProgramName}
            onChange={(event, newValue, reason, details) => 
              handleAutocompleteChange('mainProgramName', newValue, reason, details)
            }
            onInputChange={(event, newInputValue, reason) => 
              handleAutocompleteInputChange('mainProgramName', newInputValue, reason)
            }
            options={uniqueMainProgramsByTeam}
            renderInput={(params) => (
              <TextField
                {...params}
                label="단위사업명"
                name="mainProgramName"
              />
            )}
            freeSolo
            clearOnEscape
          />

          {/* ✅ 세부사업명 (Autocomplete 완전 수정 - 핵심 부분) */}
          <Autocomplete
            value={form.subProgramName}
            onChange={(event, newValue, reason, details) => 
              handleAutocompleteChange('subProgramName', newValue, reason, details)
            }
            onInputChange={(event, newInputValue, reason) => 
              handleAutocompleteInputChange('subProgramName', newInputValue, reason)
            }
            options={uniqueSubProgramsByMain}
            renderInput={(params) => (
              <TextField
                {...params}
                label="세부사업명"
                name="subProgramName"
              />
            )}
            freeSolo
            clearOnEscape
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : editing ? "수정" : "저장"}
          </Button>

          {editing && (
            <Button
              variant="outlined"
              onClick={() => {
                setEditing(null);
                setForm({
                  functionType: "",
                  teamName: "",
                  mainProgramName: "",
                  subProgramName: "",
                });
              }}
              disabled={loading}
            >
              취소
            </Button>
          )}
        </Box>
      </Paper>

      {/* ✅ 액션 버튼들 */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button onClick={handleExportExcel} variant="outlined">
          엑셀 다운로드 (검색결과 기준)
        </Button>
        <TeamSubProgramUploadForm onUploadComplete={fetchData} />
      </Box>

      {/* ✅ 매핑 테이블 */}
      <Paper>
        <Typography variant="h6" sx={{ p: 2 }}>
          등록된 매핑 ({filteredMappings.length}건)
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>세부사업명</TableCell>
                <TableCell>팀명</TableCell>
                <TableCell>기능</TableCell>
                <TableCell>단위사업명</TableCell>
                <TableCell>관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMappings.map((map) => (
                <TableRow key={map.id}>
                  <TableCell>{map.subProgramName}</TableCell>
                  <TableCell>{map.teamName}</TableCell>
                  <TableCell>{map.functionType}</TableCell>
                  <TableCell>{map.mainProgramName}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleEdit(map)}
                      disabled={loading}
                      size="small"
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => handleDelete(map.id)}
                      disabled={loading}
                      size="small"
                      color="error"
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredMappings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                    {search ? "검색 결과가 없습니다." : "등록된 매핑이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default TeamSubProgramMapManage;
