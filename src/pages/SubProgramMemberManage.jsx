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
  deleteMultipleSubProgramMembers,
  findMemberByNameAndPhone,
  updateSubProgramMember
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

  useEffect(() => {
    if (role !== "teacher") {
      if (allowedSubPrograms.length === 1) {
        loadMembers(allowedSubPrograms[0]);
      } else {
        loadMembers();
      }
    }
    // eslint-disable-next-line
  }, [role]);

  const loadMembers = async (subProgramName = "") => {
    try {
      if (subProgramName) {
        const data = await getSubProgramMembers(subProgramName);
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (e) {
      showSnackbar("이용자 불러오기 실패", "error");
    }
  };

  useEffectOnce(() => {
    if (role !== "teacher" && allowedSubPrograms.length === 1) {
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
      if (member.phone) {
        const exist = await findMemberByNameAndPhone(member.name.trim(), member.phone.trim());
        if (exist) {
          await updateSubProgramMember(exist.id, member);
          showSnackbar("동일인 정보 업데이트 완료", "info");
          if (member.subProgram === selectedProgram) {
            await loadMembers(selectedProgram);
          }
          return;
        }
      }
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
    let added = 0, updated = 0;
    for (const row of rows) {
      try {
        const exist = await findMemberByNameAndPhone(row.name, row.phone);
        if (exist) {
          await updateSubProgramMember(exist.id, row);
          updated++;
        } else {
          await registerSubProgramMember(row);
          added++;
        }
      } catch {
        // 중복 또는 에러 무시
      }
    }
    if (added + updated > 0) {
      showSnackbar(`${added}명 신규, ${updated}명 업데이트 완료`, "success");
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

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;
    await deleteMultipleSubProgramMembers(ids);
    await loadMembers(selectedProgram);
    showSnackbar(`${ids.length}명 삭제 완료`, "info");
  };

  const canDelete = (member) => {
    if (role === "admin" || role === "manager") return true;
    return false;
  };

  const filteredSubPrograms =
    role === "teacher" ? [] : role === "manager" ? allowedSubPrograms : subPrograms;

  if (role === "teacher") {
    return (
      <div className="p-8">
        {SnackbarComp}
        <h2 className="text-2xl font-bold mb-4">세부사업별 이용자 명부 관리</h2>
        <p>⚠️ 강사는 이용자 명부 관리 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {SnackbarComp}
      <h2 className="text-2xl font-bold mb-4">세부사업별 이용자 명부 관리</h2>

      <SubProgramMemberRegisterForm
        subPrograms={subPrograms}
        onRegister={handleRegister}
      />

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Button
          variant="outlined"
          onClick={() => setShowUpload(true)}
        >
          대량 이용자 업로드
        </Button>
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
        onBulkDelete={handleBulkDelete}
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