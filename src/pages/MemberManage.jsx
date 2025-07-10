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
  checkDuplicateMember,
  updateMemberWithNonEmptyFields
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

  // 등록 또는 수정
  const handleRegister = async (member) => {
    const isEdit = !!selectedMember;
    if (isEdit) {
      await updateMember(selectedMember.id, member);
      await loadMembers();
      setShowRegister(false);
      setSelectedMember(null);
      showSnackbar("회원 정보 수정 완료", "success");
    } else {
      const isDuplicate = await checkDuplicateMember(member);
      if (isDuplicate) {
        // 빈 값이 아닌 필드만 기존 데이터에 덮어쓰기
        await updateMemberWithNonEmptyFields(member);
        await loadMembers();
        setShowRegister(false);
        setSelectedMember(null);
        showSnackbar("중복 회원 정보 업데이트 완료", "info");
      } else {
        await registerMember(member);
        await loadMembers();
        setShowRegister(false);
        setSelectedMember(null);
        showSnackbar("회원 등록 완료", "success");
      }
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowRegister(true);
  };

  const handleDelete = async (id) => {
    await deleteMember(id);
    await loadMembers();
    showSnackbar("삭제 완료", "info");
  };

  const handleUpload = async () => {
    await loadMembers();
    showSnackbar("업로드 완료", "success");
    setShowUpload(false);
  };

  return (
    <div className="p-8">
      {SnackbarComp}

      <Typography variant="h5" gutterBottom>
        전체 회원 관리
      </Typography>

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

      <MemberTable
        members={members}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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