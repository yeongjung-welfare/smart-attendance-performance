const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT; // 꼭 이거 하나만 써야 Render 정상 작동

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("서버가 정상적으로 작동 중입니다.");
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.listen(PORT, () => {
  console.log(`✅ API 서버가 ${PORT} 포트에서 실행 중`);
});