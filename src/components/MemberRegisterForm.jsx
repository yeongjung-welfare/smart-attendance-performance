import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button, Grid, useMediaQuery, InputAdornment } from "@mui/material";
import { checkDuplicateMember, checkDuplicateMemberAdvanced } from "../services/memberAPI";
import { getAgeGroup } from "../utils/ageGroup";
import { getAge } from "../utils/ageUtils";
import { normalizeDate } from "../utils/dateUtils";

// ✅ 전화번호 정규화 함수 추가
function normalizePhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
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
    disability: "",
    ageGroup: ""
  });

  // ✅ initialData 또는 member prop 처리 (두 가지 방식 모두 지원)
  useEffect(() => {
    const data = initialData || member;
    if (data) {
      console.log("✅ 폼에 로드된 데이터:", data);
      setForm({
        name: data.name || "",
        gender: data.gender || "",
        birthdate: normalizeDate(data.birthdate) || "", // ✅ 날짜 정규화
        phone: normalizePhone(data.phone) || "", // ✅ 전화번호 정규화
        address: data.address || "",
        district: data.district || "",
        incomeType: data.incomeType || "일반",
        disability: data.disability ?? "",
        ageGroup: data.ageGroup || ""
      });
    }
  }, [initialData, member]);

  // ✅ 생년월일 변경 시 연령대 자동 계산
  useEffect(() => {
    if (form.birthdate && form.birthdate.length === 10) {
      try {
        const birthYear = form.birthdate.substring(0, 4);
        const calculatedAgeGroup = getAgeGroup(birthYear);
        if (calculatedAgeGroup !== form.ageGroup) {
          console.log("✅ 연령대 자동 계산:", birthYear, "→", calculatedAgeGroup);
          setForm(prev => ({ ...prev, ageGroup: calculatedAgeGroup }));
        }
      } catch (error) {
        console.error("연령대 계산 오류:", error);
      }
    }
  }, [form.birthdate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ 전화번호 자동 정규화
    if (name === 'phone') {
      setForm((prev) => ({ ...prev, [name]: normalizePhone(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ 개선된 handleSubmit 함수 (중복 확인 로직 강화)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name?.trim()) {
      alert("이름은 필수 입력 항목입니다.");
      return;
    }

    const birthdate = normalizeDate(form.birthdate);
    const phone = normalizePhone(form.phone);
    
    console.log("✅ 정규화된 데이터:", {
      birthdate: form.birthdate + " → " + birthdate,
      phone: form.phone + " → " + phone
    });

    // ✅ 중복 체크 (신규 등록시만)
    const isEditMode = !!(initialData || member);
    if (!isEditMode) {
      try {
        // 개선된 중복 확인 로직 적용
        const duplicateResult = await checkDuplicateMemberAdvanced({
          name: form.name.trim(),
          birthdate,
          phone
        });
        
        console.log("✅ 중복 확인 결과:", duplicateResult);
        
        if (duplicateResult.isDuplicate) {
          const { confidence, message, matches, action } = duplicateResult;
          
          if (action === 'block') {
            alert(message);
            return;
          } else if (action === 'warn') {
            const matchInfo = matches.map(m => 
              `- ${m.name} (${m.birthdate}) ${m.phone || '연락처 없음'}`
            ).join('\n');
            
            const proceed = window.confirm(
              `${message}\n\n기존 회원 정보:\n${matchInfo}\n\n계속 진행하시겠습니까?`
            );
            if (!proceed) return;
          } else if (action === 'suggest') {
            const proceed = window.confirm(
              `${message}\n\n기존 회원과 동일인물일 가능성이 있습니다.\n계속 진행하시겠습니까?`
            );
            if (!proceed) return;
          }
        }
      } catch (error) {
        console.error("중복 확인 오류:", error);
        // 중복 확인 실패 시에도 등록 진행 (기존 동작 유지)
      }
    }

    // ✅ 최종 데이터 준비
    const age = getAge(birthdate);
    const ageGroup = getAgeGroup(birthdate.substring(0, 4));
    
    const fullMember = {
      ...form,
      birthdate, // ✅ 정규화된 날짜
      phone, // ✅ 정규화된 전화번호
      ageGroup,
      age,
      disability: form.disability ?? "",
      name: form.name.trim(),
      address: form.address?.trim() || "",
      district: form.district?.trim() || ""
    };

    console.log("✅ 제출할 최종 데이터:", fullMember);

    // ✅ 콜백 함수 호출 (기존 방식 완전 보존)
    try {
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
    } catch (error) {
      console.error("회원 등록/수정 오류:", error);
      alert(`처리 실패: ${error.message}`);
    }
  };

  const handlePostcodeSearch = () => {
    if (window.daum?.postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
          const fullAddress = data.roadAddress || data.jibunAddress || "";
          setForm((prev) => ({ ...prev, address: fullAddress }));
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
            name="name"
            label="이름 *"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        {/* 성별 */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="gender"
            label="성별"
            value={form.gender}
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
            name="birthdate"
            label="생년월일"
            type="date"
            value={form.birthdate}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* 연락처 */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="phone"
            label="연락처"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            placeholder="010-0000-0000"
          />
        </Grid>

        {/* 주소 */}
        <Grid item xs={12}>
          <TextField
            name="address"
            label="주소"
            value={form.address}
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

        {/* 행정동 */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="district"
            label="행정동"
            value={form.district}
            onChange={handleChange}
            fullWidth
            placeholder="예: 당산동"
          />
        </Grid>

        {/* 소득구분 */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="incomeType"
            label="소득구분"
            value={form.incomeType}
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

        {/* 장애유무 */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="disability"
            label="장애유무"
            value={form.disability}
            onChange={handleChange}
            fullWidth
            select
          >
            <MenuItem value="">선택</MenuItem>
            <MenuItem value="무">무</MenuItem>
            <MenuItem value="유">유</MenuItem>
          </TextField>
        </Grid>

        {/* 연령대 (읽기 전용) */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="ageGroup"
            label="연령대"
            value={form.ageGroup}
            fullWidth
            disabled
            placeholder="생년월일 입력시 자동계산"
          />
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
            {(initialData || member) ? "수정" : "등록"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default MemberRegisterForm;
