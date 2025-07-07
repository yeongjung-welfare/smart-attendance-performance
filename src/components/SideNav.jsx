// src/components/SideNav.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

function SideNav({ role, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <nav className="w-56 bg-white border-r hidden md:block">
      <div className="p-6 font-bold text-lg">메뉴</div>
      <ul className="space-y-2 px-4">
        <li>
          <Link to="/dashboard" className="block py-2 hover:bg-blue-100 rounded">대시보드</Link>
        </li>
        {role === "admin" && (
          <>
            <li>
              <Link to="/members" className="block py-2 hover:bg-blue-100 rounded">회원관리</Link>
            </li>
            <li>
              <Link to="/subprogram-members" className="block py-2 hover:bg-blue-100 rounded">세부사업별 이용자 관리</Link>
            </li>
            <li>
              <Link to="/attendance" className="block py-2 hover:bg-blue-100 rounded">출석관리</Link>
            </li>
            <li>
              <Link to="/performance" className="block py-2 hover:bg-blue-100 rounded">실적관리</Link>
            </li>
            <li>
              <Link to="/performance-stats" className="block py-2 hover:bg-blue-100 rounded">실적 통계/조회</Link>
            </li>
            <li>
              <Link to="/team-map" className="block py-2 hover:bg-blue-100 rounded">팀-세부사업명 매핑 관리</Link>
            </li>
            <li>
              <Link to="/admin" className="block py-2 hover:bg-blue-100 rounded">승인관리</Link>
            </li>
          </>
        )}
        {role === "teacher" && (
          <>
            <li>
              <Link to="/attendance" className="block py-2 hover:bg-blue-100 rounded">출석관리</Link>
            </li>
            <li>
              <Link to="/performance" className="block py-2 hover:bg-blue-100 rounded">실적관리</Link>
            </li>
            <li>
              <Link to="/performance-stats" className="block py-2 hover:bg-blue-100 rounded">실적 통계/조회</Link>
            </li>
          </>
        )}
        {role === "user" && (
          <li>
            <Link to="/my-performance" className="block py-2 hover:bg-blue-100 rounded">내 실적</Link>
          </li>
        )}
        {/* 로그인 상태면 로그아웃 버튼, 아니면 로그인/회원가입 */}
        {role ? (
          <li>
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2 hover:bg-blue-100 rounded text-red-600"
            >
              로그아웃
            </button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login" className="block py-2 hover:bg-blue-100 rounded">로그인</Link>
            </li>
            <li>
              <Link to="/signup" className="block py-2 hover:bg-blue-100 rounded">회원가입</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default SideNav;