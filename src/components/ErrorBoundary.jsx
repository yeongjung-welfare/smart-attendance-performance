// src/components/ErrorBoundary.jsx
import React from "react";

/**
 * 전역 에러 바운더리 컴포넌트
 * - 자식 컴포넌트에서 렌더링 중 발생한 오류를 감지하고 사용자에게 안내 메시지를 보여줍니다.
 * - 에러 메시지와 상세 스택 정보를 시각적으로 표시하며, 개발·운영 환경 모두에서 안전하게 동작합니다.
 * - 모바일·데스크탑 모두 가독성 높은 반응형 스타일 적용
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI를 표시하도록 상태를 업데이트
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 등 추가 처리 가능 (예: Sentry, 서버 전송 등)
    this.setState({ errorInfo });
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReload = () => {
    // 페이지 새로고침(복구 시도)
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 my-4 bg-red-100 text-red-700 rounded shadow max-w-xl mx-auto">
          <h3 className="font-bold mb-2">⚠️ 문제가 발생했습니다</h3>
          <p className="mb-2">잠시 후 다시 시도하거나, 문제가 지속될 경우 관리자에게 문의해 주세요.</p>
          {this.state.error?.message && (
            <div className="mb-2">
              <span className="font-semibold">에러 메시지:</span>
              <pre className="bg-red-50 rounded p-2 overflow-x-auto text-sm">{this.state.error.message}</pre>
            </div>
          )}
          {this.state.errorInfo?.componentStack && (
            <details className="mb-2 text-xs whitespace-pre-wrap">
              <summary className="cursor-pointer">상세 정보 보기</summary>
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <button
            onClick={this.handleReload}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;