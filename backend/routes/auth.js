const express = require("express");
const router = express.Router();

// 로그인 라우터
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@smart.com" && password === "1234") {
    res.json({ token: "mock-jwt-token" });
  } else {
    res.status(401).json({ error: "인증 실패" });
  }
});

module.exports = router;