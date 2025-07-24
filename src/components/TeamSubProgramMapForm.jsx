import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Stack,
  Alert,
} from "@mui/material";
import { addTeamSubProgramMap } from "../services/teamSubProgramMapAPI";
import { useAuthContext } from "../contexts/AuthContext";

const FUNCTIONS = ["서비스제공 기능", "사례관리 기능", "지역조직화 기능"];
const TEAMS = ["서비스제공연계팀", "마을협력팀", "마을돌봄팀", "사례관리팀", "운영지원팀"];

function TeamSubProgramMapForm({ onSuccess, editingItem }) {
  const { user, userRole } = useAuthContext();
  const [subProgramName, setSubProgramName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [functionType, setFunctionType] = useState("");
  const [mainProgramName, setMainProgramName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setSubProgramName(editingItem.subProgramName || "");
      setTeamName(editingItem.teamName || "");
      setFunctionType(editingItem.functionType || "");
      setMainProgramName(editingItem.mainProgramName || "");
    }
  }, [editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // 🔒 form 기본 동작 방지
    setError("");
    setSuccess("");

    // ✅ 권한 확인 (admin과 manager 모두 허용)
    if (!["admin", "manager"].includes(userRole)) {
      setError("관리자 또는 매니저 권한이 필요합니다.");
      return;
    }

    const trimmedSubProgramName = subProgramName.trim();
    const trimmedTeamName = teamName.trim();
    const trimmedFunctionType = functionType.trim();
    const trimmedMainProgramName = mainProgramName.trim();

    // ✅ 콘솔 확인용 출력
    console.log("✅ 제출값 확인:", {
      trimmedSubProgramName,
      trimmedTeamName,
      trimmedFunctionType,
      trimmedMainProgramName,
    });

    if (
      !trimmedSubProgramName ||
      !trimmedTeamName ||
      !trimmedFunctionType ||
      !trimmedMainProgramName
    ) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await addTeamSubProgramMap({
        subProgramName: trimmedSubProgramName,
        teamName: trimmedTeamName,
        functionType: trimmedFunctionType,
        mainProgramName: trimmedMainProgramName,
      });

      setSuccess("저장되었습니다.");
      setSubProgramName("");
      setTeamName("");
      setFunctionType("");
      setMainProgramName("");
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("저장 실패:", err);
      setError(err.message || "저장 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // ✅ 권한 없는 사용자 처리 (admin, manager가 아닌 경우)
  if (userRole && !["admin", "manager"].includes(userRole)) {
    return (
      <Alert severity="error">
        관리자 또는 매니저 권한이 필요합니다.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          label="기능"
          name="functionType"
          value={functionType}
          onChange={(e) => setFunctionType(e.target.value)}
          required
          select
          fullWidth
        >
          {FUNCTIONS.map((fn) => (
            <MenuItem key={fn} value={fn}>
              {fn}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="팀명"
          name="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          select
          fullWidth
        >
          {TEAMS.map((team) => (
            <MenuItem key={team} value={team}>
              {team}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="단위사업명"
          name="mainProgramName"
          value={mainProgramName}
          onChange={(e) => setMainProgramName(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="세부사업명"
          name="subProgramName"
          value={subProgramName}
          onChange={(e) => setSubProgramName(e.target.value)}
          required
          fullWidth
        />

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          fullWidth
        >
          {loading ? "저장 중..." : "저장"}
        </Button>
      </Stack>
    </Box>
  );
}

export default TeamSubProgramMapForm;
