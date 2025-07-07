// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // 에러 로깅 등 추가 처리 가능
    console.error(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <p>문제가 발생했습니다:</p>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;