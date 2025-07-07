// ✅ src/components/MemberEditModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem
} from "@mui/material";

function MemberEditModal({ open, onClose, member, onSave }) {
  const [form, setForm] = useState({ ...member });

  useEffect(() => {
    setForm({ ...member });
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.birthdate) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>회원 정보 수정</DialogTitle>
      <DialogContent className="space-y-3 mt-2">
        <TextField name="name" label="이름" fullWidth value={form.name} onChange={handleChange} required />
        <TextField select name="gender" label="성별" value={form.gender} onChange={handleChange} fullWidth required>
          <MenuItem value="남">남</MenuItem>
          <MenuItem value="여">여</MenuItem>
        </TextField>
        <TextField
          name="birthdate"
          label="생년월일"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.birthdate}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField name="phone" label="연락처" fullWidth value={form.phone} onChange={handleChange} required />
        <TextField name="address" label="주소" fullWidth value={form.address} onChange={handleChange} />
        <TextField name="district" label="행정동" fullWidth value={form.district} onChange={handleChange} />
        <TextField
          select
          name="incomeType"
          label="소득구분"
          value={form.incomeType || "일반"}
          onChange={handleChange}
          fullWidth
        >
          <MenuItem value="일반">일반</MenuItem>
          <MenuItem value="기초수급">기초수급</MenuItem>
          <MenuItem value="차상위">차상위</MenuItem>
          <MenuItem value="국가유공자">국가유공자</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">저장</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberEditModal;