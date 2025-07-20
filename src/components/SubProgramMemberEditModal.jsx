// src/components/SubProgramMemberEditModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Alert, FormControl,
  InputLabel, Select
} from "@mui/material";
import { updateSubProgramMember } from "../services/subProgramMemberAPI";
import { useProgramStructure } from "../hooks/useProgramStructure";

function SubProgramMemberEditModal({ open, onClose, member, onSave }) {
  const [form, setForm] = useState(member || {});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ✅ 프로그램 구조 데이터 가져오기
  const structure = useProgramStructure();

  // ✅ 모든 세부사업명 추출 (드롭다운용)
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
      console.log("수정 데이터:", { id: form.id, data: form });
      await updateSubProgramMember(form.id, form);
      
      if (onSave) onSave(form);
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <DialogTitle>이용자 정보 수정</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="이용자명"
                label="이용자명 *"
                value={form.이용자명}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="연락처"
                label="연락처 *"
                value={form.연락처}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>성별</InputLabel>
                <Select
                  name="성별"
                  value={form.성별}
                  onChange={handleChange}
                  label="성별"
                >
                  <MenuItem value="남">남</MenuItem>
                  <MenuItem value="여">여</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
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
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="연령대"
                label="연령대"
                value={form.연령대}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="주소"
                label="주소"
                value={form.주소}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            {/* ✅ 개선된 세부사업명 드롭다운 */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>세부사업명 *</InputLabel>
                <Select
                  name="세부사업명"
                  value={form.세부사업명}
                  onChange={handleChange}
                  label="세부사업명 *"
                >
                  {allSubPrograms.length > 0 ? (
                    allSubPrograms.map((sp) => (
                      <MenuItem key={sp} value={sp}>
                        {sp}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      세부사업명 데이터를 불러오는 중...
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>소득구분</InputLabel>
                <Select
                  name="소득구분"
                  value={form.소득구분}
                  onChange={handleChange}
                  label="소득구분"
                >
                  <MenuItem value="일반">일반</MenuItem>
                  <MenuItem value="기초수급">기초수급</MenuItem>
                  <MenuItem value="차상위">차상위</MenuItem>
                  <MenuItem value="국가유공자">국가유공자</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>유료/무료</InputLabel>
                <Select
                  name="유료무료"
                  value={form.유료무료}
                  onChange={handleChange}
                  label="유료/무료"
                >
                  <MenuItem value="무료">무료</MenuItem>
                  <MenuItem value="유료">유료</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>이용상태</InputLabel>
                <Select
                  name="이용상태"
                  value={form.이용상태}
                  onChange={handleChange}
                  label="이용상태"
                >
                  <MenuItem value="이용">이용</MenuItem>
                  <MenuItem value="종결">종결</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SubProgramMemberEditModal;