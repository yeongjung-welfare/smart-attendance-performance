import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button } from "@mui/material";

function MemberRegisterForm({ onRegister, initialData }) {
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthdate: "",
    phone: "",
    address: "",
    district: "",
    incomeType: "일반"
  });

  // ✅ 초기값 설정 (수정 모드일 경우)
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.birthdate || !form.phone) return;
    onRegister(form); // 등록 or 수정
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField name="name" label="이름" fullWidth value={form.name} onChange={handleChange} required />
      <TextField
        select
        name="gender"
        label="성별"
        value={form.gender}
        onChange={handleChange}
        fullWidth
        required
      >
        <MenuItem value="남">남</MenuItem>
        <MenuItem value="여">여</MenuItem>
      </TextField>
      <TextField
        name="birthdate"
        label="생년월일"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={form.birthdate}
        onChange={handleChange}
        fullWidth
        required
      />
      <TextField name="phone" label="연락처" fullWidth value={form.phone} onChange={handleChange} required />
      <TextField name="address" label="주소" fullWidth value={form.address} onChange={handleChange} />
      <TextField name="district" label="행정동" fullWidth value={form.district} onChange={handleChange} />
      <TextField
        select
        name="incomeType"
        label="소득구분"
        value={form.incomeType}
        onChange={handleChange}
        fullWidth
      >
        <MenuItem value="일반">일반</MenuItem>
        <MenuItem value="기초수급">기초수급</MenuItem>
        <MenuItem value="차상위">차상위</MenuItem>
        <MenuItem value="국가유공자">국가유공자</MenuItem>
      </TextField>
      <Button type="submit" variant="contained" color="primary">
        {initialData ? "수정" : "등록"}
      </Button>
    </form>
  );
}

export default MemberRegisterForm;