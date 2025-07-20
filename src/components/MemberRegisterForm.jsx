import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button, Grid, useMediaQuery, InputAdornment } from "@mui/material";
import { checkDuplicateMember } from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { getAge } from "../utils/ageUtils";

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function MemberRegisterForm({ onRegister, initialData, member, onSubmit }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  
  // ✅ 초기 상태 설정 (기존 기능 완전 보존)
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthdate: "",
    phone: "",
    address: "",
    district: "",
    incomeType: "일반",
    disability: "", // 반드시 추가
    ageGroup: "" // ✅ 연령대 필드 추가
  });

  // ✅ initialData 또는 member prop 처리 (두 가지 방식 모두 지원)
  useEffect(() => {
    const data = initialData || member;
    if (data) {
      console.log("✅ 폼에 로드된 데이터:", data); // 디버깅용
      setForm({
        name: data.name || "",
        gender: data.gender || "",
        birthdate: data.birthdate || "",
        phone: data.phone || "",
        address: data.address || "",
        district: data.district || "",
        incomeType: data.incomeType || "일반",
        disability: data.disability ?? "", // 반드시 보정
        ageGroup: data.ageGroup || "" // 기존 연령대 정보 유지
      });
    }
  }, [initialData, member]);

  // ✅ 생년월일 변경 시 연령대 자동 계산
  useEffect(() => {
    if (form.birthdate && form.birthdate.length === 10) { // yyyy-mm-dd 형식 확인
      try {
        const birthYear = form.birthdate.substring(0, 4);
        const calculatedAgeGroup = getAgeGroup(birthYear);
        
        // 연령대가 변경된 경우만 업데이트 (무한 루프 방지)
        if (calculatedAgeGroup !== form.ageGroup) {
          console.log("✅ 연령대 자동 계산:", birthYear, "→", calculatedAgeGroup);
          setForm(prev => ({
            ...prev,
            ageGroup: calculatedAgeGroup
          }));
        }
      } catch (error) {
        console.error("연령대 계산 오류:", error);
      }
    }
  }, [form.birthdate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.birthdate || !form.phone) {
      alert("이름, 생년월일, 연락처는 필수 입력 항목입니다.");
      return;
    }

    const birthdate = normalizeDate(form.birthdate);
    
    // ✅ 중복 체크 (신규 등록시만)
    const isEditMode = !!(initialData || member);
    if (!isEditMode) {
      const isDuplicate = await checkDuplicateMember({
        name: form.name.trim(),
        birthdate,
        phone: form.phone.trim()
      });
      
      if (isDuplicate) {
        alert("이미 등록된 회원입니다. (이름, 생년월일, 연락처가 동일한 회원이 존재합니다)");
        return;
      }
    }

    // ✅ 최종 데이터 준비
    const age = getAge(birthdate);
    const ageGroup = getAgeGroup(birthdate.substring(0, 4));
    
    const fullMember = {
      ...form,
      birthdate,
      ageGroup, // 최신 계산된 연령대 사용
      age,
      disability: form.disability ?? "", // undefined 방지
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      district: form.district.trim()
    };

    console.log("✅ 제출할 최종 데이터:", fullMember);

    // ✅ 콜백 함수 호출 (기존 방식 완전 보존)
    if (onRegister) {
      await onRegister(fullMember);
    } else if (onSubmit) {
      await onSubmit(fullMember);
    }

    // ✅ 신규 등록일 때만 폼 초기화
    if (!isEditMode) {
      setForm({
        name: "",
        gender: "",
        birthdate: "",
        phone: "",
        address: "",
        district: "",
        incomeType: "일반",
        disability: "",
        ageGroup: ""
      });
    }
  };

  const handlePostcodeSearch = () => {
    if (window.daum?.postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
          const fullAddress = data.roadAddress || data.jibunAddress || "";
          setForm((prev) => ({
            ...prev,
            address: fullAddress
          }));
        }
      }).open();
    } else {
      alert("우편번호 검색 API를 불러올 수 없습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* 이름 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="이름"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>

        {/* 성별 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="성별"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            variant="outlined"
          >
            <MenuItem value="남">남</MenuItem>
            <MenuItem value="여">여</MenuItem>
          </TextField>
        </Grid>

        {/* 생년월일 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="생년월일"
            name="birthdate"
            type="date"
            value={form.birthdate}
            onChange={handleChange}
            required
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* ✅ 연령대 (자동 계산, 읽기 전용) */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="연령대"
            name="ageGroup"
            value={form.ageGroup}
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
            helperText="생년월일 입력시 자동 계산됩니다"
          />
        </Grid>

        {/* 연락처 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="연락처"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            variant="outlined"
            placeholder="010-1234-5678"
          />
        </Grid>

        {/* 소득구분 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="소득구분"
            name="incomeType"
            value={form.incomeType}
            onChange={handleChange}
            variant="outlined"
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
            fullWidth
            label="주소"
            name="address"
            value={form.address}
            onChange={handleChange}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handlePostcodeSearch}
                    size="small"
                    variant="outlined"
                  >
                    주소검색
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* 행정동 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="행정동"
            name="district"
            value={form.district}
            onChange={handleChange}
            variant="outlined"
            placeholder="예: 영등포동"
          />
        </Grid>

        {/* 장애유무 */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="장애유무"
            name="disability"
            value={form.disability}
            onChange={handleChange}
            variant="outlined"
          >
            <MenuItem value="">선택</MenuItem>
            <MenuItem value="무">무</MenuItem>
            <MenuItem value="유">유</MenuItem>
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
            {(initialData || member) ? "수정하기" : "등록하기"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default MemberRegisterForm;