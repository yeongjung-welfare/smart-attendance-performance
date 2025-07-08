// 📁 backend/routes/members.js
const express = require("express");
const router = express.Router();

// 같은 users 배열을 공유 (위에서 정의되었을 경우 DB나 공유 메모리로 대체 필요)
const authRouter = require("./auth");
const users = authRouter.users || []; // fallback if shared elsewhere

router.get("/members", (req, res) => {
  res.json(users);
});

module.exports = router;