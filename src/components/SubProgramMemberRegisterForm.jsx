import React, { useState } from "react";
import { generateUserId } from "../utils/generateId";
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Paper,
  Typography
} from "@mui/material";

const defaultForm = {
  team: "",
  unitProgram: "",
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.gender || !form.subProgram || !form.paidType) return;

    const member = {
      ...form,
      userId: generateUserId(),
      createdAt: new Date().toISOString(),
    };

    onRegister(member);
    setForm(defaultForm);
  };

  return (
    <Paper className="p-4 mb-6" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        📌 이용자 개별 등록
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* 1열: 팀, 단위, 세부 */}
          <Grid item xs={12} sm={3}>
            <TextField label="팀명" name="team" value={form.team} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="단위사업명" name="unitProgram" value={form.unitProgram} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              label="세부사업명"
              name="subProgram"
              value={form.subProgram}
              onChange={handleChange}
              required
              fullWidth
            >
              {subPrograms.map((sp) => (
                <MenuItem key={sp} value={sp}>
                  {sp}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 2열: 이름, 성별, 연락처 */}
          <Grid item xs={12} sm={2}>
            <TextField label="이용자명" name="name" value={form.name} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              select
              label="성별"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="남">남</MenuItem>
              <MenuItem value="여">여</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="연락처" name="phone" value={form.phone} onChange={handleChange} fullWidth />
          </Grid>

          {/* 3열: 생년월일, 연령대, 거주지 */}
          <Grid item xs={12} sm={3}>
            <TextField label="생년월일" name="birthdate" value={form.birthdate} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="연령대" name="ageGroup" value={form.ageGroup} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="거주지" name="address" value={form.address} onChange={handleChange} fullWidth />
          </Grid>

          {/* 4열: 소득구분, 장애유무, 유무료 */}
          <Grid item xs={12} sm={2}>
            <TextField label="소득구분" name="incomeType" value={form.incomeType} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={2}>
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
          <Grid item xs={12} sm={2}>
            <TextField
              select
              label="유료/무료"
              name="paidType"
              value={form.paidType}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="유료">유료</MenuItem>
              <MenuItem value="무료">무료</MenuItem>
            </TextField>
          </Grid>

          {/* 5열: 이용상태 + 등록버튼 */}
          <Grid item xs={12} sm={2}>
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
          <Grid item xs={12} sm={2}>
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