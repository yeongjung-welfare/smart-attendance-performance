import React from "react";
import { Link, useNavigate } from "react-router-dom";

function SideNav({ role, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">메뉴</h2>
      </div>

      <nav className="flex-1 p-4">
        {/* 공통 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            공통
          </h3>
          <Link
            to="/dashboard"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            대시보드
          </Link>
        </div>

        {/* 이용자 관리 - 관리자/매니저만 */}
        {(role === "admin" || role === "manager") && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              이용자 관리
            </h3>
            <Link
              to="/members"
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              전체 이용자 관리
            </Link>
            <Link
              to="/subprogram-members"
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              세부사업별 이용자 관리
            </Link>
          </div>
        )}

        {/* 출석·실적 관리 */}
        {(role === "admin" || role === "manager" || role === "teacher") && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              출석·실적 관리
            </h3>
            {(role === "admin" || role === "manager") && (
              <Link
                to="/attendance"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                출석·실적 등록 및 관리
              </Link>
            )}
            {role === "teacher" && (
              <>
                <Link
                  to="/attendance-teacher"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  출석·실적 등록 및 관리
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                >
                  로그아웃
                </button>
              </>
            )}
            {(role === "admin" || role === "manager") && (
              <Link
                to="/bulk-performance-upload"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                대량 실적 업로드
              </Link>
            )}
            {(role === "admin" || role === "manager") && (
              <Link
                to="/performance-stats"
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                실적 통계/조회
              </Link>
            )}
          </div>
        )}

        {/* 매칭 관리 - 관리자/매니저만 */}
        {(role === "admin" || role === "manager") && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              매칭 관리
            </h3>
            <Link
              to="/team-map"
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              팀-세부사업 매칭 관리
            </Link>
            <Link
              to="/teacher-map"
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              강사-세부사업 매칭 관리
            </Link>
          </div>
        )}

        {/* 관리자 전용 */}
        {role === "admin" && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              관리자 전용
            </h3>
            <Link
              to="/admin"
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              승인관리
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 매니저용 로그아웃 */}
        {role === "manager" && (
          <div className="mb-4">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            >
              로그아웃
            </button>
          </div>
        )}
      </nav>

      {/* 비로그인 상태: 로그인/회원가입 */}
      {!role && (
        <div className="p-4 border-t">
          <Link
            to="/login"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 mb-2"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            회원가입
          </Link>
        </div>
      )}
    </div>
  );
}

export default SideNav;