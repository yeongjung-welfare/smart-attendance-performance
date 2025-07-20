import React, { useEffect, useState } from "react";
import { 
  getAllTeamSubProgramMaps, 
  addTeamSubProgramMap, 
  deleteTeamSubProgramMap 
} from "../services/teamSubProgramMapAPI";
import TeamSubProgramUploadForm from "../components/TeamSubProgramUploadForm";
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

  // ✅ 기존 fetchData 함수 완전 유지 + 로딩 상태 추가
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllTeamSubProgramMaps();
      setMappings(data);
      setError(""); // 성공 시 에러 초기화
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다: " + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ 기존 handleChange 함수 완전 유지
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ 기존 handleSave 함수 개선 (로직 완전 유지 + 에러 처리 강화)
  const handleSave = async () => {
  setError("");
  setSuccess("");

  const { functionType, teamName, mainProgramName, subProgramName } = form;

  if (!functionType || !teamName || !mainProgramName || !subProgramName) {
    setError("모든 항목을 입력해주세요.");
    return;
  }

  if (!functionType.trim() || !teamName.trim() || !mainProgramName.trim() || !subProgramName.trim()) {
    setError("공백만으로는 입력할 수 없습니다.");
    return;
  }

  setLoading(true);
  try {
    await addTeamSubProgramMap({
      세부사업명: subProgramName.trim(),
      팀명: teamName.trim(),
      기능: functionType.trim(),
      단위사업명: mainProgramName.trim(),
    }, editing !== null); // editing 상태에 따라 overwrite 결정

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
    setError(err.message || "저장 중 오류가 발생했습니다.");
    console.error("저장 실패:", err);
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
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setLoading(true);
      try {
        await deleteTeamSubProgramMap(id);
        setSuccess("매핑이 성공적으로 삭제되었습니다.");
        await fetchData();
      } catch (err) {
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
  )].sort();

  const uniqueSubProgramsByMain = [...new Set(
    mappings
      .filter((m) => !form.mainProgramName || m.mainProgramName === form.mainProgramName)
      .map((m) => m.subProgramName)
  )].sort();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        팀-세부사업 매핑 관리
      </Typography>

      {/* ✅ 에러 및 성공 알림 강화 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* ✅ 기존 폼 레이아웃 완전 유지 + UI 개선 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {editing ? "매핑 수정" : "새 매핑 추가"}
        </Typography>
        
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, mb: 2 }}>
          <TextField
            label="검색 (세부사업명 / 팀명 / 기능 / 단위사업명)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 2 }}>
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

          <Autocomplete
            options={form.teamName ? uniqueMainProgramsByTeam : []}
            value={form.mainProgramName}
            onChange={(event, newValue) => {
              setForm({ ...form, mainProgramName: newValue || "" });
            }}
            renderInput={(params) => (
              <TextField {...params} label="단위사업명" />
            )}
            freeSolo
          />

          <Autocomplete
            options={form.mainProgramName ? uniqueSubProgramsByMain : []}
            value={form.subProgramName}
            onChange={(event, newValue) => {
              setForm({ ...form, subProgramName: newValue || "" });
            }}
            renderInput={(params) => (
              <TextField {...params} label="세부사업명" />
            )}
            freeSolo
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={loading}
            sx={{ minWidth: 100 }}
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
            >
              취소
            </Button>
          )}
        </Box>
      </Paper>

      {/* ✅ 기존 액션 버튼들 완전 유지 + 스타일 개선 */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={handleExportExcel}>
          엑셀 다운로드 (검색결과 기준)
        </Button>
        <TeamSubProgramUploadForm onUploadComplete={fetchData} />
      </Box>

      {/* ✅ 기존 테이블 완전 유지 + 반응형 개선 */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
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
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>세부사업명</strong></TableCell>
                <TableCell><strong>팀명</strong></TableCell>
                <TableCell><strong>기능</strong></TableCell>
                <TableCell><strong>단위사업명</strong></TableCell>
                <TableCell><strong>관리</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMappings.map((map) => (
                <TableRow key={map.id} hover>
                  <TableCell>{map.subProgramName}</TableCell>
                  <TableCell>{map.teamName}</TableCell>
                  <TableCell>{map.functionType}</TableCell>
                  <TableCell>{map.mainProgramName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEdit(map)}
                        disabled={loading}
                      >
                        수정
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(map.id)}
                        disabled={loading}
                      >
                        삭제
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMappings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {search ? "검색 결과가 없습니다." : "등록된 매핑이 없습니다."}
                    </Typography>
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