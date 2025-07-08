const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Health Check 엔드포인트 (반드시 필요!)
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// 기본 경로
app.get("/", (req, res) => {
  res.send("서버가 정상적으로 작동 중입니다.");
});

// 테스트용 hello API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// 라우터 연결
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/members"));
app.use("/api/program-structure", require("./routes/programStructure"));
app.use("/api/performances", require("./routes/performances"));
app.use("/api/performance-summaries", require("./routes/performanceSummary"));

// 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`✅ API 서버가 ${PORT} 포트에서 실행 중`);
});
