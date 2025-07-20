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
  const [form, setForm] = useState({ ...member, disability: member?.disability ?? "" });

  useEffect(() => {
    setForm({ ...member, disability: member?.disability ?? "" });
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.birthdate) return;
    onSave({ ...form, disability: form.disability ?? "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>회원 정보 수정</DialogTitle>
      <DialogContent>
        <TextField label="이용자명" name="name" value={form.name} onChange={handleChange} required fullWidth />
        <TextField select label="성별" name="gender" value={form.gender} onChange={handleChange} required fullWidth>
          <MenuItem value="남">남</MenuItem>
          <MenuItem value="여">여</MenuItem>
        </TextField>
        <TextField
          label="생년월일"
          name="birthdate"
          type="date"
          value={form.birthdate}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          required
          fullWidth
        />
        <TextField label="연락처" name="phone" value={form.phone} onChange={handleChange} required fullWidth />
        <TextField label="주소" name="address" value={form.address} onChange={handleChange} fullWidth />
        <TextField label="행정동" name="district" value={form.district} onChange={handleChange} fullWidth />
        <TextField select label="소득구분" name="incomeType" value={form.incomeType} onChange={handleChange} fullWidth>
          <MenuItem value="일반">일반</MenuItem>
          <MenuItem value="기초수급">기초수급</MenuItem>
          <MenuItem value="차상위">차상위</MenuItem>
          <MenuItem value="국가유공자">국가유공자</MenuItem>
        </TextField>
        <TextField
          select
          label="장애유무"
          name="disability"
          value={form.disability ?? ""}
          onChange={handleChange}
          fullWidth
        >
          <MenuItem value="">선택</MenuItem>
          <MenuItem value="무">무</MenuItem>
          <MenuItem value="유">유</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberEditModal;
