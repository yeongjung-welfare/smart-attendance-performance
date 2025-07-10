import React, { useState, useEffect } from "react";
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  useMediaQuery,
  InputAdornment
} from "@mui/material";
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

function MemberRegisterForm({ onRegister, initialData }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthdate: "",
    phone: "",
    address: "",
    district: "",
    incomeType: "일반"
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        gender: initialData.gender || "",
        birthdate: initialData.birthdate || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        district: initialData.district || "",
        incomeType: initialData.incomeType || "일반"
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.birthdate || !form.phone) return;

    const birthdate = normalizeDate(form.birthdate);
    const isDuplicate = await checkDuplicateMember({
      name: form.name.trim(),
      birthdate,
      phone: form.phone.trim()
    });

    if (!initialData && isDuplicate) {
      alert("이미 등록된 회원입니다.");
      return;
    }

    const age = getAge(birthdate);
    const ageGroup = getAgeGroup(birthdate.substring(0, 4));

    const fullMember = {
      ...form,
      birthdate,
      ageGroup,
      age
    };

    onRegister(fullMember);
    if (!initialData) {
      setForm({
        name: "",
        gender: "",
        birthdate: "",
        phone: "",
        address: "",
        district: "",
        incomeType: "일반"
      });
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
      <Grid container spacing={2} direction="row">
        <Grid item xs={12} sm={6}>
          <TextField
            name="name"
            label="이름"
            fullWidth
            value={form.name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            name="gender"
            label="성별"
            fullWidth
            value={form.gender}
            onChange={handleChange}
            required
          >
            <MenuItem value="남">남</MenuItem>
            <MenuItem value="여">여</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="birthdate"
            label="생년월일"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={form.birthdate}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="phone"
            label="연락처"
            fullWidth
            value={form.phone}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="address"
            label="주소"
            fullWidth
            value={form.address}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handlePostcodeSearch}>우편번호 검색</Button>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="district"
            label="행정동"
            fullWidth
            value={form.district}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            name="incomeType"
            label="소득구분"
            fullWidth
            value={form.incomeType}
            onChange={handleChange}
          >
            <MenuItem value="일반">일반</MenuItem>
            <MenuItem value="기초수급">기초수급</MenuItem>
            <MenuItem value="차상위">차상위</MenuItem>
            <MenuItem value="국가유공자">국가유공자</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            {initialData ? "수정" : "등록"}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

export default MemberRegisterForm;