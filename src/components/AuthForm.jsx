import React from "react";
function AuthForm() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <h2 className="text-xl font-bold mb-4">로그인</h2>
      <form className="flex flex-col gap-2 w-64">
        <input className="border rounded px-3 py-2" type="email" placeholder="이메일" />
        <input className="border rounded px-3 py-2" type="password" placeholder="비밀번호" />
        <button className="bg-blue-600 text-white rounded py-2 mt-2 hover:bg-blue-700" type="submit">
          로그인
        </button>
      </form>
    </div>
  );
}
export default AuthForm;
