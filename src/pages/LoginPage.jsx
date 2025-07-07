import React, { useState } from "react";
import { loginWithFirebase } from "../services/authAPI"; // ✅ 경로 올바름
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // ⬅ 추가

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, userData } = await loginWithFirebase(form.email, form.password);
      alert(`로그인 성공! 환영합니다, ${userData?.name || user.email}님`);

      // 👉 토큰 저장 또는 권한 처리 필요 시 여기에 추가
      // localStorage.setItem("token", user.uid); 등
      // 리다이렉트 처리도 여기에 가능
      // ✅ 로그인 성공 후 대시보드로 이동
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password")
        ? "이메일 또는 비밀번호가 잘못되었습니다."
        : err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-8 border rounded">
      <h2 className="text-xl font-bold mb-4">로그인</h2>
      <form onSubmit={handleSubmit}>
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
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default LoginPage;