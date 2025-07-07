// src/pages/TeamSubProgramMapManage.jsx
import React, { useEffect, useState } from "react";
import {
  getAllTeamSubProgramMaps,
  addTeamSubProgramMap,
  deleteTeamSubProgramMap,
} from "../services/teamSubProgramMapAPI";
import TeamSubProgramUploadForm from "../components/TeamSubProgramUploadForm";
import {
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
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

  // 데이터 로딩
  const fetchData = async () => {
    const data = await getAllTeamSubProgramMaps();
    setMappings(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 입력값 변경 처리
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 저장 또는 수정
  const handleSave = async () => {
    const { functionType, teamName, mainProgramName, subProgramName } = form;
    if (!functionType || !teamName || !mainProgramName || !subProgramName) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const isDuplicate = mappings.some(
      (item) =>
        item.subProgramName === subProgramName &&
        item.teamName === teamName &&
        item.functionType === functionType &&
        item.mainProgramName === mainProgramName
    );
    if (isDuplicate) {
      alert("동일한 조합의 데이터가 이미 존재합니다.");
      return;
    }

    await addTeamSubProgramMap(form);
    setForm({
      functionType: "",
      teamName: "",
      mainProgramName: "",
      subProgramName: "",
    });
    setEditing(null);
    fetchData();
  };

  // 수정 버튼 클릭
  const handleEdit = (map) => {
    setForm({
      functionType: map.functionType,
      teamName: map.teamName,
      mainProgramName: map.mainProgramName,
      subProgramName: map.subProgramName,
    });
    setEditing(map.id);
  };

  // 삭제
  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteTeamSubProgramMap(id);
      fetchData();
    }
  };

  // ✅ 엑셀 다운로드 - 검색된 목록 기준
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

  // ✅ 검색 적용
  const filteredMappings = mappings.filter((map) =>
    `${map.subProgramName}${map.teamName}${map.functionType}${map.mainProgramName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ✅ Autocomplete용 유니크 목록 생성 (선택 연동 반영)
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
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">팀-세부사업명 매핑 관리</h2>

      {/* 검색창 */}
      <div className="mb-4">
        <TextField
          label="검색 (세부사업명 / 팀명 / 기능 / 단위사업명)"
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 입력폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <FormControl>
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

        <FormControl>
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
          freeSolo
          options={uniqueMainProgramsByTeam}
          value={form.mainProgramName}
          onInputChange={(e, newValue) =>
            setForm((prev) => ({ ...prev, mainProgramName: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="단위사업명" required />
          )}
        />

        <Autocomplete
          freeSolo
          options={uniqueSubProgramsByMain}
          value={form.subProgramName}
          onInputChange={(e, newValue) =>
            setForm((prev) => ({ ...prev, subProgramName: newValue }))
          }
          renderInput={(params) => (
            <TextField {...params} label="세부사업명" required />
          )}
        />
      </div>

      {/* 저장/취소 버튼 */}
      <div className="flex gap-2 mb-6">
        <Button variant="contained" onClick={handleSave}>
          {editing ? "수정 완료" : "저장"}
        </Button>
        {editing && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setForm({
                functionType: "",
                teamName: "",
                mainProgramName: "",
                subProgramName: "",
              });
              setEditing(null);
            }}
          >
            취소
          </Button>
        )}
      </div>

      {/* 엑셀 다운로드 */}
      <div className="mb-6">
        <Button variant="outlined" color="primary" onClick={handleExportExcel}>
          엑셀 다운로드 (검색결과 기준)
        </Button>
      </div>

      {/* 업로드 폼 */}
      <TeamSubProgramUploadForm onUploadComplete={fetchData} />

      {/* 목록 테이블 */}
      <table className="w-full border text-sm mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">세부사업명</th>
            <th className="border px-2 py-1">팀명</th>
            <th className="border px-2 py-1">기능</th>
            <th className="border px-2 py-1">단위사업명</th>
            <th className="border px-2 py-1">관리</th>
          </tr>
        </thead>
        <tbody>
          {filteredMappings.map((map) => (
            <tr key={map.id}>
              <td className="border px-2 py-1">{map.subProgramName}</td>
              <td className="border px-2 py-1">{map.teamName}</td>
              <td className="border px-2 py-1">{map.functionType}</td>
              <td className="border px-2 py-1">{map.mainProgramName}</td>
              <td className="border px-2 py-1">
                <Button size="small" onClick={() => handleEdit(map)}>
                  수정
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(map.id)}
                >
                  삭제
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TeamSubProgramMapManage;