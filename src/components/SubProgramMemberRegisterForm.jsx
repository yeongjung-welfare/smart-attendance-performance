import React, { useState, useEffect } from "react";
import { 
  TextField, MenuItem, Button, Grid, useMediaQuery, InputAdornment, Alert, 
  Autocomplete, FormControl, InputLabel, Select, Box, Paper, Typography
} from "@mui/material";
import { getAllMembers, checkDuplicateMember, registerMember } from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { normalizeDate, getCurrentKoreanDate } from "../utils/dateUtils"; // ✅ toFirebaseDate 제거

// ✅ 전화번호 정규화 함수 추가
function normalizePhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function SubProgramMemberRegisterForm({
  onRegister,
  initialData,
  filters,
  subProgramOptions = [],
  directSubProgramSelect = false,
  allSubPrograms = []
}) {
  const isMobile = useMediaQuery("(max-width:600px)");

  // ✅ console.log를 컴포넌트 내부로 이동
  console.log("🔍 SubProgramMemberRegisterForm props 확인:", {
    subProgramOptions,
    allSubPrograms,
    filters,
    directSubProgramSelect
  });

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

// ✅ 세부사업 옵션 결정 로직 추가
const [availableSubPrograms, setAvailableSubPrograms] = useState([]);

  const [error, setError] = useState("");
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    getAllMembers().then(setAllMembers);
  }, []);

  // ✅ 세부사업 옵션 동적 설정
useEffect(() => {
  console.log("📝 세부사업 옵션 업데이트:", {
    subProgramOptions: subProgramOptions?.length || 0,
    subProgramOptionsData: subProgramOptions,
    allSubPrograms: allSubPrograms?.length || 0,
    allSubProgramsData: allSubPrograms,
    filters,
    directSubProgramSelect
  });
  
  // 필터 조건이 있을 때는 해당 필터의 세부사업만, 없을 때는 전체 세부사업
  if (subProgramOptions && subProgramOptions.length > 0) {
    console.log("✅ subProgramOptions 사용:", subProgramOptions);
    setAvailableSubPrograms(subProgramOptions);
  } else if (allSubPrograms && allSubPrograms.length > 0) {
    console.log("✅ allSubPrograms 사용:", allSubPrograms);
    setAvailableSubPrograms(allSubPrograms);
  } else {
    console.log("⚠️ 세부사업 옵션이 없음");
    setAvailableSubPrograms([]);
  }
}, [subProgramOptions, allSubPrograms, filters, directSubProgramSelect]);

  useEffect(() => {
  console.log("📝 initialData 변경 감지:", initialData); // 디버깅용
  
  if (initialData) {
    const birthdate = initialData.생년월일 || initialData.birthdate;
    const phone = initialData.연락처 || initialData.phone;
    
    const newFormData = {
      세부사업명: initialData.세부사업명 || filters?.세부사업명 || "",
      이용자명: initialData.이용자명 || initialData.name || "",
      성별: initialData.성별 || initialData.gender || "",
      생년월일: birthdate ? normalizeDate(birthdate) : "",
      연락처: normalizePhone(phone),
      주소: initialData.주소 || initialData.address || "",
      소득구분: initialData.소득구분 || initialData.incomeType || "일반",
      유료무료: initialData.유료무료 || "무료",
      이용상태: initialData.이용상태 || "이용"
    };
    
    console.log("📝 폼 데이터 설정:", newFormData); // 디버깅용
    setForm(newFormData);
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
        생년월일: value.birthdate ? normalizeDate(value.birthdate) : "", // ✅ 문자열로 정규화
        연락처: normalizePhone(value.phone), // ✅ 전화번호 정규화
        주소: value.address || "",
        소득구분: value.incomeType || "일반"
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ 전화번호 자동 정규화
    if (name === '연락처') {
      setForm((prev) => ({ ...prev, [name]: normalizePhone(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    setError("");
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.이용자명 || !form.생년월일 || !form.연락처 || !form.세부사업명) {
    setError("이용자명, 생년월일, 연락처, 세부사업명은 필수 입력입니다.");
    return;
  }

  // ✅ 안전한 날짜 처리 - 문자열로 저장
  const 생년월일 = normalizeDate(form.생년월일);
  const 연락처 = normalizePhone(form.연락처);

  console.log("📝 세부사업 등록 데이터:", {
    이용자명: form.이용자명,
    원본생년월일: form.생년월일,
    정규화생년월일: 생년월일,
    원본연락처: form.연락처,
    정규화연락처: 연락처
  });

  // ✅ 🔥 전체회원 존재 여부 검증 (새로 추가)
  const memberExists = await checkDuplicateMember({
    name: form.이용자명.trim(),
    birthdate: 생년월일,
    phone: 연락처
  });

  if (!memberExists) {
    const confirmResult = window.confirm(
      `'${form.이용자명}' 이용자가 전체회원 관리에 등록되어 있지 않습니다.\n\n전체회원으로 먼저 등록하시겠습니까?\n\n• 확인: 전체회원으로 등록 후 세부사업 등록 진행\n• 취소: 등록 중단 (전체회원 관리에서 먼저 등록 필요)`
    );
    
    if (!confirmResult) {
      setError("전체회원 관리에서 해당 이용자를 먼저 등록해주세요.");
      return;
    }
  }

  const isDuplicate = await checkDuplicateMember({
    name: form.이용자명.trim(),
    birthdate: 생년월일,
    phone: 연락처
  });

    if (!initialData && isDuplicate) {
      setError("이미 등록된 회원입니다. 세부사업별 등록을 진행합니다.");
      
      const fullMember = {
        ...form,
        생년월일, // ✅ 문자열로 저장
        연락처, // ✅ 정규화된 전화번호
        연령대: getAgeGroup(생년월일.substring(0, 4)),
        팀명: filters?.팀명,
        단위사업명: filters?.단위사업명
      };
      
      onRegister(fullMember);
      return;
    }

    try {
      // ✅ 전체회원 등록 시에도 문자열로 저장
      if (!initialData) {
        const memberData = {
          name: form.이용자명.trim(),
          gender: form.성별,
          birthdate: 생년월일, // ✅ 문자열로 저장 (Date 객체 제거)
          phone: 연락처, // ✅ 정규화된 전화번호
          address: form.주소,
          incomeType: form.소득구분,
          registrationDate: getCurrentKoreanDate() // ✅ 문자열로 저장
        };

        await registerMember(memberData);
      }

      const fullMember = {
        ...form,
        생년월일, // ✅ 문자열로 저장
        연락처, // ✅ 정규화된 전화번호
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
          setForm((prev) => ({ ...prev, 주소: fullAddress }));
        }
      }).open();
    } else {
      setError("우편번호 검색 API를 불러올 수 없습니다.");
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        세부사업별 이용자 등록
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* 전체회원에서 선택 */}
          <Grid item xs={12}>
            <Autocomplete
              options={allMembers}
              getOptionLabel={(option) => `${option.name} (${option.phone || '연락처 없음'})`}
              onChange={handleMemberSelect}
              renderInput={(params) => (
                <TextField {...params} label="전체회원에서 선택 (선택사항)" />
              )}
            />
          </Grid>

          {/* 세부사업명 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
  <InputLabel>세부사업명 *</InputLabel>
  <Select
    name="세부사업명"
    value={form.세부사업명}
    onChange={handleChange}
    required
    disabled={!directSubProgramSelect}
    MenuProps={{
      PaperProps: {
        sx: {
          maxHeight: 300,
          '& .MuiMenuItem-root': {
            fontSize: '1rem',
            minHeight: 48,
            padding: '12px 16px'
          }
        }
      }
    }}
  >
    {availableSubPrograms.length > 0 ? (
      availableSubPrograms.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>
        {directSubProgramSelect ? "세부사업 로딩 중..." : "상위 항목을 선택해주세요"}
      </MenuItem>
    )}
  </Select>
</FormControl>
          </Grid>

          {/* 이용자명 */}
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

          {/* 성별 */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="성별"
              label="성별"
              value={form.성별}
              onChange={handleChange}
              fullWidth
              select
            >
              <MenuItem value="">선택</MenuItem>
              <MenuItem value="남">남</MenuItem>
              <MenuItem value="여">여</MenuItem>
            </TextField>
          </Grid>

          {/* 생년월일 */}
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

          {/* 연락처 */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="연락처"
              label="연락처 *"
              value={form.연락처}
              onChange={handleChange}
              fullWidth
              required
              placeholder="010-0000-0000"
            />
          </Grid>

          {/* 소득구분 */}
          <Grid item xs={12} sm={6}>
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

          {/* 주소 */}
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
                ),
              }}
            />
          </Grid>

          {/* 유료무료 */}
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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

          {/* 제출 버튼 */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
            >
              {initialData ? "수정" : "등록"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

export default SubProgramMemberRegisterForm;
