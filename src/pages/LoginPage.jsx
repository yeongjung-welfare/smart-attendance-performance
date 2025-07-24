import React, { useState } from "react";
import { loginWithFirebase } from "../services/authAPI";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Divider
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // 입력 시 에러 메시지 클리어
    if (error) setError(null);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 입력 유효성 검사
    if (!form.email || !form.password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      setLoading(false);
      return;
    }

    if (!validateEmail(form.email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const { user, userData } = await loginWithFirebase(form.email, form.password);
      
      // 로그인 성공 후 대시보드로 이동
      navigate("/dashboard");
    } catch (err) {
      let errorMsg = "로그인 중 오류가 발생했습니다.";
      
      if (err.message.includes("auth/user-not-found")) {
        errorMsg = "등록되지 않은 이메일입니다.";
      } else if (err.message.includes("auth/wrong-password")) {
        errorMsg = "비밀번호가 잘못되었습니다.";
      } else if (err.message.includes("auth/invalid-email")) {
        errorMsg = "올바른 이메일 형식을 입력해주세요.";
      } else if (err.message.includes("auth/too-many-requests")) {
        errorMsg = "너무 많은 시도로 인해 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        {/* 헤더 */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            로그인
          </Typography>
          <Typography variant="body2" color="text.secondary">
            출석 및 실적 관리 시스템에 로그인하세요
          </Typography>
        </Box>

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 로그인 폼 */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="이메일 주소"
            name="email"
            autoComplete="email"
            autoFocus
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            error={error && error.includes('이메일')}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="비밀번호"
            type="password"
            id="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            error={error && error.includes('비밀번호')}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mb: 2, 
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>또는</Divider>

          {/* 회원가입 링크 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              아직 계정이 없으신가요?
            </Typography>
            <Button
              component={Link}
              to="/signup"
              variant="outlined"
              fullWidth
              startIcon={<PersonAddIcon />}
              sx={{ 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              회원가입
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
