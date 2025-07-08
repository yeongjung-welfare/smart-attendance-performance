// backend/index.js

require("dotenv").config(); // 반드시 맨 위에!

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ 서버 상태 확인용 엔드포인트
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// ✅ 기본 응답
app.get("/", (req, res) => {
  res.send("서버가 정상적으로 작동 중입니다.");
});

// ✅ 라우터 연결
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/hello"));
app.use("/api", require("./routes/members"));
app.use("/api/program-structure", require("./routes/programStructure"));
app.use("/api/performances", require("./routes/performances"));
app.use("/api/performance-summaries", require("./routes/performanceSummary"));

// ✅ 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ API 서버가 ${PORT} 포트에서 실행 중`);
});