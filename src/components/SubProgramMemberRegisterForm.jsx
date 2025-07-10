import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Paper,
  Typography,
  Alert
} from "@mui/material";
import { getAgeGroup } from "../utils/ageGroup";
import { findMemberByNameAndPhone } from "../services/subProgramMemberAPI";
import { generateUserId } from "../utils/generateId";
import { useUser } from "../hooks/useUser";

const defaultForm = {
  subProgram: "",
  name: "",
  gender: "",
  phone: "",
  birthdate: "",
  ageGroup: "",
  address: "",
  incomeType: "",
  disability: "",
  paidType: "",
  status: "이용",
};

function SubProgramMemberRegisterForm({ subPrograms, onRegister }) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const { user } = useUser();
  const role = user?.role;
  const allowedSubPrograms = user?.subPrograms || [];

  useEffect(() => {
    if (form.birthdate && !form.ageGroup) {
      const birthYear = form.birthdate.slice(0, 4);
      setForm((prev) => ({ ...prev, ageGroup: getAgeGroup(birthYear) }));
    }
  }, [form.birthdate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, subProgram } = form;
    if (!name || !subProgram) {
      setError("이용자명과 세부사업명은 필수 입력입니다.");
      return;
    }
    if (phone) {
      const existing = await findMemberByNameAndPhone(name.trim(), phone.trim());
      if (existing && existing.subProgram === subProgram) {
        setError("이미 동일한 세부사업에 등록된 이용자입니다.");
        return;
      }
    }
    const member = {
      ...form,
      userId: generateUserId(),
      createdAt: new Date().toISOString()
    };
    try {
      await onRegister(member);
      setForm(defaultForm);
      setError("");
    } catch (err) {
      setError(err.message || "회원 등록에 실패했습니다.");
    }
  };

  const filteredSubPrograms =
    role === "teacher" ? allowedSubPrograms : subPrograms;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        📌 세부사업별 이용자 개별 등록
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <Grid container spacing={2}>
          <Grid xs={12} sm={4}>
            <TextField
              select
              label="세부사업명"
              name="subProgram"
              value={form.subProgram}
              onChange={handleChange}
              fullWidth
              required
            >
              {filteredSubPrograms.map((sp) => (
                <MenuItem key={sp} value={sp}>
                  {sp}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid xs={12} sm={4}>
            <TextField
              label="이용자명"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              select
              label="성별"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="남">남</MenuItem>
              <MenuItem value="여">여</MenuItem>
            </TextField>
          </Grid>

          <Grid xs={12} sm={4}>
            <TextField
              label="연락처"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              fullWidth
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              label="생년월일"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              fullWidth
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              label="연령대"
              name="ageGroup"
              value={form.ageGroup}
              fullWidth
              disabled
            />
          </Grid>

          <Grid xs={12} sm={6}>
            <TextField
              label="거주지"
              name="address"
              value={form.address}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              label="소득구분"
              name="incomeType"
              value={form.incomeType}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              select
              label="장애유무"
              name="disability"
              value={form.disability}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="있음">있음</MenuItem>
              <MenuItem value="없음">없음</MenuItem>
            </TextField>
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              select
              label="유료/무료"
              name="paidType"
              value={form.paidType}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="유료">유료</MenuItem>
              <MenuItem value="무료">무료</MenuItem>
            </TextField>
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              select
              label="이용상태"
              name="status"
              value={form.status}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="이용">이용</MenuItem>
              <MenuItem value="중지">중지</MenuItem>
              <MenuItem value="종결">종결</MenuItem>
            </TextField>
          </Grid>

          <Grid xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              등록
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

export default SubProgramMemberRegisterForm;