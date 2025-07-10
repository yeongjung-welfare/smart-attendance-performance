require("dotenv").config(); // 반드시 맨 위!

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // 로컬 기본값

app.use(cors());
app.use(express.json());

// Health Check (Render용)
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// 라우터 연결
app.use("/api", require("./routes/hello"));
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