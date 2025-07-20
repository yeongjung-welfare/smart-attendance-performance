import React, { useState } from "react";
  import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, TextField, MenuItem, Alert
  } from "@mui/material";
  import { updateSubProgramMember } from "../services/subProgramMemberAPI";
  import { normalizeDate } from "../utils/dateUtils"; // 날짜 형식 정규화

  function SubProgramMemberBulkEditModal({ open, onClose, memberIds, subPrograms, onSave }) {
    const [form, setForm] = useState({
      세부사업명: "",
      소득구분: "",
      유료무료: "",
      이용상태: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      setError("");
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.세부사업명 && !form.소득구분 && !form.유료무료 && !form.이용상태) {
        setError("최소한 하나의 필드를 입력해주세요.");
        return;
      }

      try {
        for (const id of memberIds) {
          const updateData = {};
          if (form.세부사업명) updateData.세부사업명 = form.세부사업명;
          if (form.소득구분) updateData.소득구분 = form.소득구분;
          if (form.유료무료) updateData.유료무료 = form.유료무료;
          if (form.이용상태) updateData.이용상태 = form.이용상태;
          console.log("일괄 수정 데이터:", { id, data: updateData });
          await updateSubProgramMember(id, updateData);
        }
        if (onSave) onSave();
        onClose();
      } catch (err) {
        setError(err.message || "일괄 수정 실패. ID 목록 확인 필요.");
        console.error("일괄 수정 오류:", err);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.2rem" } }}>
          선택된 이용자 정보 일괄 수정 ({memberIds.length}명)
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit} autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="세부사업명"
                  name="세부사업명"
                  value={form.세부사업명}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">변경 안 함</MenuItem>
                  {subPrograms.map((sp) => (
                    <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="소득구분"
                  name="소득구분"
                  value={form.소득구분}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">변경 안 함</MenuItem>
                  <MenuItem value="일반">일반</MenuItem>
                  <MenuItem value="기초수급">기초수급</MenuItem>
                  <MenuItem value="차상위">차상위</MenuItem>
                  <MenuItem value="국가유공자">국가유공자</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="유료/무료"
                  name="유료무료"
                  value={form.유료무료}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">변경 안 함</MenuItem>
                  <MenuItem value="무료">무료</MenuItem>
                  <MenuItem value="유료">유료</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="이용상태"
                  name="이용상태"
                  value={form.이용상태}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="">변경 안 함</MenuItem>
                  <MenuItem value="이용">이용</MenuItem>
                  <MenuItem value="종결">종결</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  일괄 저장
                </Button>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    );
  }

  export default SubProgramMemberBulkEditModal;