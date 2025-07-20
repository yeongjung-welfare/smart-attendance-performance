// src/components/ErrorBoundary.jsx
import React from "react";
import { Box, Typography, Button, Card, CardContent, Alert, Collapse } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

/**
 * 전역 에러 바운더리 컴포넌트
 * - 자식 컴포넌트에서 렌더링 중 발생한 오류를 감지하고 사용자에게 안내 메시지를 보여줍니다.
 * - 에러 메시지와 상세 스택 정보를 시각적으로 표시하며, 개발·운영 환경 모두에서 안전하게 동작합니다.
 * - 모바일·데스크탑 모두 가독성 높은 반응형 스타일 적용
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
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

    // ✅ 실제 서비스에서는 에러 리포팅 서비스 연동
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReload = () => {
    // 페이지 새로고침(복구 시도)
    window.location.reload();
  };

  handleRetry = () => {
    // 컴포넌트 상태만 리셋하여 재렌더링 시도
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8f9fa",
            p: 2
          }}
        >
          <Card
            sx={{
              maxWidth: 600,
              width: "100%",
              boxShadow: 3
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* ✅ 에러 아이콘 및 제목 */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ErrorOutlineIcon
                  sx={{ 
                    fontSize: 48, 
                    color: "error.main", 
                    mr: 2 
                  }}
                />
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      color: "error.main",
                      mb: 1
                    }}
                  >
                    오류가 발생했습니다
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    시스템에서 예상치 못한 문제가 발생했습니다
                  </Typography>
                </Box>
              </Box>

              {/* ✅ 사용자 안내 메시지 */}
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
              >
                <Typography variant="body1">
                  잠시 후 다시 시도하거나, 문제가 지속될 경우 관리자에게 문의해 주세요.
                </Typography>
              </Alert>

              {/* ✅ 에러 메시지 (개발 환경에서만 표시) */}
              {this.state.error?.message && process.env.NODE_ENV !== "production" && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {this.state.error.message}
                  </Typography>
                </Alert>
              )}

              {/* ✅ 액션 버튼들 */}
              <Box 
                sx={{ 
                  display: "flex", 
                  gap: 2, 
                  mb: 3,
                  flexWrap: "wrap"
                }}
              >
                <Button
                  variant="contained"
                  onClick={this.handleRetry}
                  startIcon={<RefreshIcon />}
                  sx={{ flex: 1, minWidth: 120 }}
                >
                  다시 시도
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                  sx={{ flex: 1, minWidth: 120 }}
                >
                  페이지 새로고침
                </Button>
              </Box>

              {/* ✅ 기술적 세부정보 (개발 환경에서만) */}
              {process.env.NODE_ENV !== "production" && this.state.errorInfo && (
                <Box>
                  <Button
                    variant="text"
                    onClick={this.toggleDetails}
                    startIcon={
                      this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                    sx={{ mb: 2 }}
                  >
                    기술적 세부정보 {this.state.showDetails ? "숨기기" : "보기"}
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Error Stack:
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            fontSize: "0.75rem",
                            backgroundColor: "#f5f5f5",
                            p: 2,
                            borderRadius: 1,
                            overflow: "auto",
                            maxHeight: 200,
                            fontFamily: "monospace"
                          }}
                        >
                          {this.state.error?.stack}
                        </Box>
                        
                        {this.state.errorInfo?.componentStack && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                              Component Stack:
                            </Typography>
                            <Box
                              component="pre"
                              sx={{
                                fontSize: "0.75rem",
                                backgroundColor: "#f5f5f5",
                                p: 2,
                                borderRadius: 1,
                                overflow: "auto",
                                maxHeight: 200,
                                fontFamily: "monospace"
                              }}
                            >
                              {this.state.errorInfo.componentStack}
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Collapse>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;