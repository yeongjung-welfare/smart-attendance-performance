// src/components/SubProgramMemberEditModal.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Alert, FormControl,
  InputLabel, Select
} from "@mui/material";
import { updateSubProgramMember } from "../services/subProgramMemberAPI";
import { useProgramStructure } from "../hooks/useProgramStructure";
import { normalizeDate } from "../utils/dateUtils"; // ✅ toFirebaseDate 제거

function SubProgramMemberEditModal({ open, onClose, member, onSave }) {
  const [form, setForm] = useState(member || {});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const structure = useProgramStructure();

  const allSubPrograms = React.useMemo(() => {
    const subPrograms = [];
    Object.keys(structure).forEach(team => {
      Object.keys(structure[team]).forEach(unit => {
        structure[team][unit].forEach(subProgram => {
          if (!subPrograms.includes(subProgram)) {
            subPrograms.push(subProgram);
          }
        });
      });
    });
    return subPrograms.sort();
  }, [structure]);

  useEffect(() => {
    if (member) {
      setForm({
        id: member.id || member.고유아이디 || "",
        이용자명: member.이용자명 || "",
        연락처: member.연락처 || "",
        성별: member.성별 || "",
        생년월일: member.생년월일 || "",
        연령대: member.연령대 || "",
        주소: member.주소 || "",
        소득구분: member.소득구분 || "일반",
        유료무료: member.유료무료 || "무료",
        이용상태: member.이용상태 || "이용",
        세부사업명: member.세부사업명 || "",
        팀명: member.팀명 || "",
        단위사업명: member.단위사업명 || ""
      });
    } else {
      setForm({
        id: "",
        이용자명: "",
        연락처: "",
        성별: "",
        생년월일: "",
        연령대: "",
        주소: "",
        소득구분: "일반",
        유료무료: "무료",
        이용상태: "이용",
        세부사업명: "",
        팀명: "",
        단위사업명: ""
      });
    }
    
    setError("");
    setLoading(false);
  }, [member, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.이용자명 || !form.세부사업명 || !form.id || !form.생년월일 || !form.연락처) {
      setError("이용자명, 세부사업명, 생년월일, 연락처는 필수 입력입니다.");
      return;
    }

    setLoading(true);
    try {
      // ✅ 문자열로 정규화하여 저장 (Date 객체 제거)
      const normalizedData = {
        ...form,
        생년월일: form.생년월일 ? normalizeDate(form.생년월일) : ""
      };

      console.log("수정 데이터:", { id: form.id, data: normalizedData });
      await updateSubProgramMember(form.id, normalizedData);
      if (onSave) onSave(normalizedData);
      onClose();
      setError("");
    } catch (err) {
      setError(err.message || "수정 실패. ID 또는 데이터 확인 필요.");
      console.error("수정 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>이용자 정보 수정</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* 이용자명 */}
            <Grid size={6}>
              <TextField
                name="이용자명"
                label="이용자명 *"
                value={form.이용자명}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            {/* 연락처 */}
            <Grid size={6}>
              <TextField
                name="연락처"
                label="연락처 *"
                value={form.연락처}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            {/* 성별 */}
            <Grid size={6}>
              <TextField
                name="성별"
                label="성별"
                value={form.성별}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="남">남</MenuItem>
                <MenuItem value="여">여</MenuItem>
              </TextField>
            </Grid>

            {/* 생년월일 */}
            <Grid size={6}>
              <TextField
                name="생년월일"
                label="생년월일 *"
                type="date"
                value={form.생년월일}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* 연령대 */}
            <Grid size={6}>
              <TextField
                name="연령대"
                label="연령대"
                value={form.연령대}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* 세부사업명 */}
            <Grid size={6}>
              <TextField
                name="세부사업명"
                label="세부사업명 *"
                value={form.세부사업명}
                onChange={handleChange}
                fullWidth
                select
                required
              >
                {allSubPrograms.length > 0 ? (
                  allSubPrograms.map((sp) => (
                    <MenuItem key={sp} value={sp}>
                      {sp}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    세부사업명 데이터를 불러오는 중...
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            {/* 소득구분 */}
            <Grid size={6}>
              <TextField
                name="소득구분"
                label="소득구분"
                value={form.소득구분}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="일반">일반</MenuItem>
                <MenuItem value="기초수급">기초수급</MenuItem>
                <MenuItem value="차상위">차상위</MenuItem>
                <MenuItem value="국가유공자">국가유공자</MenuItem>
              </TextField>
            </Grid>

            {/* 유료/무료 */}
            <Grid size={6}>
              <TextField
                name="유료무료"
                label="유료/무료"
                value={form.유료무료}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="무료">무료</MenuItem>
                <MenuItem value="유료">유료</MenuItem>
              </TextField>
            </Grid>

            {/* 이용상태 */}
            <Grid size={6}>
              <TextField
                name="이용상태"
                label="이용상태"
                value={form.이용상태}
                onChange={handleChange}
                fullWidth
                select
              >
                <MenuItem value="이용">이용</MenuItem>
                <MenuItem value="종결">종결</MenuItem>
              </TextField>
            </Grid>

            {/* 주소 */}
            <Grid size={12}>
              <TextField
                name="주소"
                label="주소"
                value={form.주소}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? "저장 중..." : "저장"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SubProgramMemberEditModal;
