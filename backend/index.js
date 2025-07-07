// backend/index.js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// --- 라우터 연결 ---
app.use("/api/program-structure", require("./routes/programStructure"));
app.use("/api/performances", require("./routes/performances"));
app.use("/api/performance-summaries", require("./routes/performanceSummary"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/members"));

// --- 404 에러 핸들러 ---
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- 서버 실행 ---
const PORT = process.env.PORT || 5184;
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 ${PORT}번 포트에서 실행 중`);
});