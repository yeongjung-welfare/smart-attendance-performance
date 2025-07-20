import React, { useState, useEffect } from "react";
import { 
  TextField, MenuItem, Button, Grid, useMediaQuery, InputAdornment, Alert, 
  Autocomplete, FormControl, InputLabel, Select 
} from "@mui/material";
import { getAllMembers, checkDuplicateMember, registerMember } from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function SubProgramMemberRegisterForm({ 
  onRegister, 
  initialData, 
  filters, 
  subProgramOptions = [],
  directSubProgramSelect = false
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [form, setForm] = useState({
    세부사업명: filters?.세부사업명 || "",
    이용자명: "",
    성별: "",
    생년월일: "",
    연락처: "",
    주소: "",
    소득구분: "일반",
    유료무료: "무료",
    이용상태: "이용"
  });
  const [error, setError] = useState("");
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    getAllMembers().then(setAllMembers);
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        세부사업명: initialData.세부사업명 || filters?.세부사업명 || "",
        이용자명: initialData.이용자명 || initialData.name || "",
        성별: initialData.성별 || initialData.gender || "",
        생년월일: initialData.생년월일 || initialData.birthdate || "",
        연락처: initialData.연락처 || initialData.phone || "",
        주소: initialData.주소 || initialData.address || "",
        소득구분: initialData.소득구분 || initialData.incomeType || "일반",
        유료무료: initialData.유료무료 || "무료",
        이용상태: initialData.이용상태 || "이용"
      });
    } else {
      setForm((prev) => ({
        ...prev,
        세부사업명: filters?.세부사업명 || ""
      }));
    }
  }, [initialData, filters?.세부사업명]);

  // 전체회원에서 선택 시 자동 채움
  const handleMemberSelect = (event, value) => {
    if (value) {
      setForm((prev) => ({
        ...prev,
        이용자명: value.name || "",
        성별: value.gender || "",
        생년월일: value.birthdate || "",
        연락처: value.phone || "",
        주소: value.address || "",
        소득구분: value.incomeType || "일반"
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.이용자명 || !form.생년월일 || !form.연락처 || !form.세부사업명) {
      setError("이용자명, 생년월일, 연락처, 세부사업명은 필수 입력입니다.");
      return;
    }

    const 생년월일 = normalizeDate(form.생년월일);
    const isDuplicate = await checkDuplicateMember({
      name: form.이용자명.trim(),
      birthdate: 생년월일,
      phone: form.연락처.trim()
    });

    if (!initialData && isDuplicate) {
      setError("이미 등록된 회원입니다. 세부사업별 등록을 진행합니다.");
      const fullMember = {
        ...form,
        생년월일,
        연령대: getAgeGroup(생년월일.substring(0, 4)),
        팀명: filters?.팀명,
        단위사업명: filters?.단위사업명
      };
      onRegister(fullMember);
      return;
    }

    try {
      if (!initialData) {
        const memberData = {
          name: form.이용자명.trim(),
          gender: form.성별,
          birthdate: 생년월일,
          phone: form.연락처.trim(),
          address: form.주소,
          incomeType: form.소득구분,
          registrationDate: new Date().toISOString().split("T")[0]
        };
        await registerMember(memberData);
      }

      const fullMember = {
        ...form,
        생년월일,
        연령대: getAgeGroup(생년월일.substring(0, 4)),
        팀명: filters?.팀명,
        단위사업명: filters?.단위사업명
      };
      onRegister(fullMember);

      if (!initialData) {
        setForm({
          세부사업명: filters?.세부사업명 || "",
          이용자명: "",
          성별: "",
          생년월일: "",
          연락처: "",
          주소: "",
          소득구분: "일반",
          유료무료: "무료",
          이용상태: "이용"
        });
      }
    } catch (err) {
      setError("등록 실패: " + err.message);
    }
  };

  const handlePostcodeSearch = () => {
    if (window.daum?.postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
          const fullAddress = data.roadAddress || data.jibunAddress || "";
          setForm((prev) => ({
            ...prev,
            주소: fullAddress
          }));
        }
      }).open();
    } else {
      setError("우편번호 검색 API를 불러올 수 없습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Autocomplete
            options={allMembers}
            getOptionLabel={(option) => `${option.name || ""} (${option.phone || ""})`}
            onChange={handleMemberSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                label="전체회원에서 선택 (선택사항)"
                placeholder="이름이나 전화번호로 검색"
                variant="outlined"
                fullWidth
              />
            )}
          />
        </Grid>

        {/* ✅ 세부사업명 선택 방식 개선 */}
        <Grid item xs={12}>
          {directSubProgramSelect ? (
            <FormControl fullWidth required>
              <InputLabel>세부사업명</InputLabel>
              <Select
                name="세부사업명"
                value={form.세부사업명}
                onChange={handleChange}
                label="세부사업명"
              >
                {subProgramOptions.map((sp) => (
                  <MenuItem key={sp} value={sp}>
                    {sp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              name="세부사업명"
              label="세부사업명"
              value={form.세부사업명}
              onChange={handleChange}
              fullWidth
              required
              disabled={!!filters?.세부사업명}
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="이용자명"
            label="이용자명"
            value={form.이용자명}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="성별"
            label="성별"
            select
            value={form.성별}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">선택</MenuItem>
            <MenuItem value="남">남</MenuItem>
            <MenuItem value="여">여</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="생년월일"
            label="생년월일"
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
            name="연락처"
            label="연락처"
            value={form.연락처}
            onChange={handleChange}
            fullWidth
            required
            placeholder="010-1234-5678"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="주소"
            label="주소"
            value={form.주소}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handlePostcodeSearch} size="small">
                    주소검색
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="소득구분"
            label="소득구분"
            select
            value={form.소득구분}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="일반">일반</MenuItem>
            <MenuItem value="기초수급">기초수급</MenuItem>
            <MenuItem value="차상위">차상위</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="유료무료"
            label="유료/무료"
            select
            value={form.유료무료}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="무료">무료</MenuItem>
            <MenuItem value="유료">유료</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            name="이용상태"
            label="이용상태"
            select
            value={form.이용상태}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="이용">이용</MenuItem>
            <MenuItem value="중단">중단</MenuItem>
            <MenuItem value="졸업">졸업</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            fullWidth={isMobile}
            sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}
          >
            등록하기
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default SubProgramMemberRegisterForm;
