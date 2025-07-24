import React, { useState } from "react";
import { signupWithFirebase } from "../services/authAPI";
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
  Divider,
  LinearProgress
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LoginIcon from "@mui/icons-material/Login";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // 입력 시 에러 메시지 클리어
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 50) return 'error';
    if (strength < 75) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return '매우 약함';
    if (strength < 50) return '약함';
    if (strength < 75) return '보통';
    return '강함';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { name, email, password, confirmPassword } = form;

    // 유효성 검사
    if (!name || !email || !password || !confirmPassword) {
      setError("모든 항목을 입력해주세요.");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    if (!/\d/.test(password)) {
      setError("비밀번호는 숫자를 포함해야 합니다.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      await signupWithFirebase(email, password, name);
      setSuccess("회원가입이 완료되었습니다. 승인 후 로그인해주세요.");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      let errorMsg = "회원가입 중 오류가 발생했습니다.";
      
      if (err.message.includes("email-already-in-use")) {
        errorMsg = "이미 가입된 이메일입니다.";
      } else if (err.message.includes("weak-password")) {
        errorMsg = "비밀번호가 너무 약합니다.";
      } else if (err.message.includes("invalid-email")) {
        errorMsg = "올바른 이메일 형식을 입력해주세요.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

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
          <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            회원가입
          </Typography>
          <Typography variant="body2" color="text.secondary">
            출석 및 실적 관리 시스템에 가입하세요
          </Typography>
        </Box>

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 성공 메시지 */}
        {success && (
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon />}
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="body2">
              {success}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3초 후 로그인 페이지로 이동합니다...
            </Typography>
          </Alert>
        )}

        {/* 회원가입 폼 */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="이름"
            name="name"
            autoComplete="name"
            autoFocus
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="이메일 주소"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            error={error && error.includes('비밀번호')}
            helperText="8자 이상, 숫자 포함"
            sx={{ mb: 1 }}
          />

          {/* 비밀번호 강도 표시 */}
          {form.password && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  비밀번호 강도
                </Typography>
                <Typography variant="caption" color={`${getPasswordStrengthColor(passwordStrength)}.main`}>
                  {getPasswordStrengthText(passwordStrength)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength} 
                color={getPasswordStrengthColor(passwordStrength)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="비밀번호 확인"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            error={error && error.includes('일치하지')}
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
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>또는</Divider>

          {/* 로그인 링크 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              이미 계정이 있으신가요?
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              fullWidth
              startIcon={<LoginIcon />}
              sx={{ 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              로그인
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignupPage;
