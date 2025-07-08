// backend/index.js

const express = require("express");
const cors = require("cors");

const app = express();

// Render 환경에서는 반드시 PORT가 환경변수로 지정됨
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Render에서 서버 상태 확인용 엔드포인트
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// ✅ 기본 경로 응답
app.get("/", (req, res) => {
  res.send("서버가 정상적으로 작동 중입니다.");
});

// ✅ /api/hello 연결
app.use("/api/hello", require("./routes/hello"));

// ✅ 나머지 경로 404 처리
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`✅ API 서버가 ${PORT} 포트에서 실행 중`);
});