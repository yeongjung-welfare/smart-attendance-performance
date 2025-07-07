// pages/SignupPage.jsx
import React, { useState } from "react";
import { signupWithFirebase } from "../services/authAPI";

function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { name, email, password } = form;

    // 유효성 검사
    if (!name || !email || !password) {
      setError("모든 항목을 입력해주세요.");
      setLoading(false);
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setError("비밀번호는 숫자를 포함한 8자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      await signupWithFirebase(email, password, name);
      setSuccess("회원가입이 완료되었습니다. 승인 후 로그인해주세요.");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      const errorMsg = err.message.includes("email-already-in-use")
        ? "이미 가입된 이메일입니다."
        : "회원가입 중 오류가 발생했습니다.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-8 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">회원가입</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
          className="block w-full mb-2 border rounded px-2 py-1"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="이메일"
          value={form.email}
          onChange={handleChange}
          className="block w-full mb-2 border rounded px-2 py-1"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          className="block w-full mb-2 border rounded px-2 py-1"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </div>
  );
}

export default SignupPage;