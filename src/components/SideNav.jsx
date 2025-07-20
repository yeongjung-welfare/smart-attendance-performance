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
        {/* 공통 */}
        <li className="mt-4 font-semibold text-gray-600">공통</li>
        <li>
          <Link to="/dashboard" className="block py-2 hover:bg-blue-100 rounded ml-2">대시보드</Link>
        </li>

        {/* 이용자 관리 */}
        {(role === "admin" || role === "manager") && (
          <>
            <li className="mt-4 font-semibold text-gray-600">이용자 관리</li>
            <li>
              <Link to="/members" className="block py-2 hover:bg-blue-100 rounded ml-2">전체 이용자 관리</Link>
            </li>
            <li>
              <Link to="/subprogram-members" className="block py-2 hover:bg-blue-100 rounded ml-2">세부사업별 이용자 관리</Link>
            </li>
          </>
        )}

        {/* 출석·실적 관리 */}
        {(role === "admin" || role === "manager" || role === "teacher") && (
          <>
            <li className="mt-4 font-semibold text-gray-600">출석·실적 관리</li>
            {(role === "admin" || role === "manager") && (
              <li>
                <Link to="/attendance" className="block py-2 hover:bg-blue-100 rounded ml-2">출석·실적 등록 및 관리</Link>
              </li>
            )}
            {role === "teacher" && (
              <li>
                <Link to="/attendance-teacher" className="block py-2 hover:bg-blue-100 rounded ml-2">출석·실적 등록 및 관리</Link>
              </li>
            )}
            {(role === "admin" || role === "manager") && (
              <li>
                <Link to="/bulk-performance-upload" className="block py-2 hover:bg-blue-100 rounded ml-2">대량 실적 업로드</Link>
              </li>
            )}
            {(role === "admin" || role === "manager" || role === "teacher") && (
              <li>
                <Link to="/performance-stats" className="block py-2 hover:bg-blue-100 rounded ml-2">실적 통계/조회</Link>
              </li>
            )}
          </>
        )}

        {/* 매칭 관리 */}
        {(role === "admin" || role === "manager") && (
          <>
            <li className="mt-4 font-semibold text-gray-600">매칭 관리</li>
            <li>
              <Link to="/team-map" className="block py-2 hover:bg-blue-100 rounded ml-2">팀-세부사업 매칭 관리</Link>
            </li>
            <li>
              <Link to="/teacher-map" className="block py-2 hover:bg-blue-100 rounded ml-2">강사-세부사업 매칭 관리</Link>
            </li>
          </>
        )}

        {/* 관리자 전용 */}
        {role === "admin" && (
          <>
            <li className="mt-4 font-semibold text-gray-600">관리자 전용</li>
            <li>
              <Link to="/admin" className="block py-2 hover:bg-blue-100 rounded ml-2">승인관리</Link>
            </li>
          </>
        )}

        {/* 로그아웃 또는 로그인/회원가입 */}
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