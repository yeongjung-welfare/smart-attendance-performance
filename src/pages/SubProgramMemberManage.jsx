// 🔧 src/pages/SubProgramMemberManage.jsx (수정본)

import React, { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Dialog
} from "@mui/material";
import SubProgramMemberRegisterForm from "../components/SubProgramMemberRegisterForm";
import SubProgramMemberUploadForm from "../components/SubProgramMemberUploadForm";
import SubProgramMemberTable from "../components/SubProgramMemberTable";
import SubProgramMemberModal from "../components/SubProgramMemberModal";
import ExportButton from "../components/ExportButton";
import useSnackbar from "../components/useSnackbar";
import { useProgramStructure } from "../hooks/useProgramStructure";
import { useUser } from "../hooks/useUser";
import { useEffectOnce } from "../hooks/useEffectOnce";
import {
  getSubProgramMembers,
  registerSubProgramMember,
  deleteSubProgramMember,
  deleteMultipleSubProgramMembers
} from "../services/subProgramMemberAPI";

function SubProgramMemberManage() {
  const [members, setMembers] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [SnackbarComp, showSnackbar] = useSnackbar();
  const structure = useProgramStructure();
  const { user } = useUser();
  const role = user?.role;
  const allowedSubPrograms = user?.subPrograms || [];

  // ✅ Firestore에서 세부사업 이용자 불러오기
  useEffect(() => {
    if (role === "teacher" && allowedSubPrograms.length === 1) {
      loadMembers(allowedSubPrograms[0]);
    } else {
      loadMembers();
    }
  }, [role]);

  const loadMembers = async (subProgramName = "") => {
    try {
      if (subProgramName) {
        const data = await getSubProgramMembers(subProgramName);
        setMembers(data);
      } else {
        // 모든 세부사업의 데이터를 한꺼번에 불러오지는 않음 (필터를 먼저 선택하게 유도)
        setMembers([]);
      }
    } catch (e) {
      showSnackbar("이용자 불러오기 실패", "error");
    }
  };

  useEffectOnce(() => {
    if (role === "teacher" && allowedSubPrograms.length === 1) {
      setSelectedProgram(allowedSubPrograms[0]);
    }
  });

  const allSubs = [];
  Object.values(structure).forEach(units =>
    Object.values(units).forEach(subs => allSubs.push(...subs))
  );
  const subPrograms = Array.from(new Set(allSubs)).sort();

  const handleRegister = async (member) => {
    try {
      const newId = await registerSubProgramMember(member);
      if (newId) {
        showSnackbar("이용자 등록 완료", "success");
        if (member.subProgram === selectedProgram) {
          await loadMembers(selectedProgram);
        }
      }
    } catch {
      showSnackbar("등록 실패", "error");
    }
  };

  const handleUpload = async (rows) => {
    let added = 0;
    for (const row of rows) {
      try {
        await registerSubProgramMember(row);
        added++;
      } catch {
        // 중복 또는 에러 무시
      }
    }
    if (added > 0) {
      showSnackbar(`${added}명 등록 완료`, "success");
      if (selectedProgram) await loadMembers(selectedProgram);
    }
    setShowUpload(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteSubProgramMember(id);
    await loadMembers(selectedProgram);
    showSnackbar("삭제 완료", "info");
  };

  const canDelete = (member) => {
    if (role === "admin" || role === "manager") return true;
    if (role === "teacher") {
      return allowedSubPrograms.includes(member.subProgram);
    }
    return false;
  };

  const filteredSubPrograms =
    role === "teacher" ? allowedSubPrograms : subPrograms;

  return (
    <div className="p-8">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">세부사업별 이용자 명부 관리</h2>

      {role !== "teacher" && (
        <SubProgramMemberRegisterForm
          subPrograms={subPrograms}
          onRegister={handleRegister}
        />
      )}

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {role !== "teacher" && (
          <Button
            variant="outlined"
            onClick={() => setShowUpload(true)}
          >
            대량 이용자 업로드
          </Button>
        )}
        <ExportButton
          data={members}
          fileName="전체_이용자명부.xlsx"
          label="엑셀 다운로드"
        />
      </div>

      <FormControl sx={{ minWidth: 240, mb: 2 }}>
        <InputLabel>세부사업명 선택</InputLabel>
        <Select
          value={selectedProgram}
          label="세부사업명 선택"
          onChange={(e) => {
            setSelectedProgram(e.target.value);
            loadMembers(e.target.value);
          }}
        >
          <MenuItem value="">전체 보기</MenuItem>
          {filteredSubPrograms.map((sp) => (
            <MenuItem key={sp} value={sp}>
              {sp}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <SubProgramMemberTable
        members={members}
        onDelete={handleDelete}
        canDelete={canDelete}
      />

      <Dialog open={showUpload} onClose={() => setShowUpload(false)} maxWidth="md" fullWidth>
        <SubProgramMemberUploadForm
          onSuccess={handleUpload}
          onClose={() => setShowUpload(false)}
          userInfo={user}
        />
      </Dialog>

      {selectedProgram && (
        <SubProgramMemberModal
          open={!!selectedProgram}
          onClose={() => setSelectedProgram("")}
          subProgramName={selectedProgram}
          members={members}
          userInfo={user}
        />
      )}
    </div>
  );
}

export default SubProgramMemberManage;