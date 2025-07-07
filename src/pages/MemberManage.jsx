import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import MemberRegisterForm from "../components/MemberRegisterForm";
import MemberUploadForm from "../components/MemberUploadForm";
import MemberTable from "../components/MemberTable";
import useSnackbar from "../components/useSnackbar";

import {
  getAllMembers,
  registerMember,
  updateMember,
  deleteMember,
} from "../services/memberAPI";

function MemberManage() {
  const [members, setMembers] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [SnackbarComp, showSnackbar] = useSnackbar();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const all = await getAllMembers();
      setMembers(all);
    } catch {
      showSnackbar("회원 목록 불러오기 실패", "error");
    }
  };

  // ✅ 등록 또는 수정
  const handleRegister = async (member) => {
    const isEdit = !!selectedMember;
    const success = isEdit
      ? await updateMember(selectedMember.id, member)
      : await registerMember(member);

    if (success) {
      await loadMembers();
      setShowRegister(false);
      setSelectedMember(null);
      showSnackbar(isEdit ? "회원 정보 수정 완료" : "회원 등록 완료", "success");
    } else {
      showSnackbar(isEdit ? "수정 실패" : "중복된 회원입니다.", "warning");
    }
  };

  // ✅ 수정 버튼 클릭 시
  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowRegister(true);
  };

  // ✅ 삭제
  const handleDelete = async (id) => {
    await deleteMember(id);
    await loadMembers();
    showSnackbar("삭제 완료", "info");
  };

  // ✅ 업로드
  const handleUpload = async (rows) => {
    let added = 0;
    for (const row of rows) {
      const success = await registerMember(row);
      if (success) added++;
    }

    if (added > 0) {
      await loadMembers();
      showSnackbar(`${added}명 등록 완료`, "success");
    } else {
      showSnackbar("모두 중복되어 등록되지 않았습니다.", "warning");
    }
    setShowUpload(false);
  };

  return (
    <div className="p-8">
      {SnackbarComp}

      <Typography variant="h5" gutterBottom>
        전체 회원 관리
      </Typography>

      {/* 버튼 영역 */}
      <Stack direction="row" spacing={2} className="my-4">
        <Button
          variant="contained"
          onClick={() => {
            setSelectedMember(null);
            setShowRegister(true);
          }}
        >
          회원 등록
        </Button>
        <Button variant="outlined" onClick={() => setShowUpload(true)}>
          대량 회원 업로드
        </Button>
      </Stack>

      {/* 회원 테이블 */}
      <MemberTable
        members={members}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 등록/수정 모달 */}
      <Dialog
        open={showRegister}
        onClose={() => {
          setShowRegister(false);
          setSelectedMember(null);
        }}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {selectedMember ? "회원 수정" : "회원 등록"}
          <IconButton
            aria-label="close"
            onClick={() => {
              setShowRegister(false);
              setSelectedMember(null);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <MemberRegisterForm
            onRegister={handleRegister}
            initialData={selectedMember}
          />
        </DialogContent>
      </Dialog>

      {/* 업로드 모달 */}
      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          대량 회원 업로드
          <IconButton
            aria-label="close"
            onClick={() => setShowUpload(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <MemberUploadForm
            onSuccess={handleUpload}
            onClose={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MemberManage;