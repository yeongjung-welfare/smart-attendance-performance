const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 라우터 연결
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/members"));
app.use("/api/program-structure", require("./routes/programStructure"));
app.use("/api/performances", require("./routes/performances"));
app.use("/api/performance-summaries", require("./routes/performanceSummary"));

// 기본 경로
app.get("/", (req, res) => {
  res.send("✅ Backend is running. Try accessing /api/hello");
});

// 테스트용 hello API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
