// 📁 backend/routes/auth.js
import express from "express";
const router = express.Router();

let users = [];

router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "필수 입력값 누락" });
  if (users.some(u => u.email === email))
    return res.status(409).json({ error: "이미 등록된 이메일입니다." });
  users.push({ name, email, password });
  res.json({ success: true, message: "회원가입 성공" });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) res.json({ success: true, token: "fake-jwt-token", name: user.name });
  else res.status(401).json({ error: "이메일 또는 비밀번호 오류" });
});

export default router;