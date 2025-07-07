// 예외 잡기(서버 다운 방지)
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection:", reason);
});

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let users = []; // 서버 메모리 회원 목록

// --- 사업구조 API (GET/POST/PUT/DELETE) ---
let programStructure = {
  "서비스제공기능": {
    "노인복지": ["노인건강교실", "노인상담"],
    "교육문화 및 평생교육": ["성인 줌바댄스", "어린이 미술교실"]
  },
  "사례관리기능": {
    "사례관리": ["사례관리"],
    "위기지원": ["위기지원"]
  },
  "지역조직화기능": {
    "지역조직화": ["마을축제", "여름축제", "겨울축제"]
  }
};

// 사업구조 전체 조회
app.get("/api/program-structure", (req, res) => {
  try {
    res.status(200).json(programStructure);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// 사업구조 전체 저장(덮어쓰기)
app.post("/api/program-structure", (req, res) => {
  try {
    programStructure = req.body;
    res.status(200).json(programStructure);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// 사업구조 개별 항목 수정
app.put("/api/program-structure/:key", (req, res) => {
  try {
    const key = req.params.key;
    if (!programStructure[key]) {
      return res.status(404).json({ error: "해당 사업구조 키가 없습니다." });
    }
    programStructure[key] = req.body;
    res.status(200).json(programStructure[key]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// 사업구조 개별 항목 삭제
app.delete("/api/program-structure/:key", (req, res) => {
  try {
    const key = req.params.key;
    if (!programStructure[key]) {
      return res.status(404).json({ error: "해당 사업구조 키가 없습니다." });
    }
    delete programStructure[key];
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 실적 데이터(임시 메모리) ---
let performances = [
  {
    id: 1,
    function: "서비스제공기능",
    unit: "노인복지",
    subProgram: "노인건강교실",
    name: "홍길동",
    result: "참여",
    date: "2025-07-01",
    note: ""
  },
  {
    id: 2,
    function: "지역조직화기능",
    unit: "지역조직화",
    subProgram: "마을축제",
    name: "김영희",
    result: "미참여",
    date: "2025-07-01",
    note: ""
  }
];

// --- 실적 CRUD API ---
app.get("/api/performances", (req, res) => {
  try {
    res.json(performances);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

app.post("/api/performances", (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.function || !data.unit || !data.subProgram || !data.date) {
      return res.status(400).json({ error: "필수 입력값 누락" });
    }
    const newId = performances.length ? performances[performances.length - 1].id + 1 : 1;
    const newPerformance = { id: newId, ...data };
    performances.push(newPerformance);
    res.json(newPerformance);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

app.put("/api/performances/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const index = performances.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "실적을 찾을 수 없습니다." });
    performances[index] = { ...performances[index], ...req.body };
    res.json(performances[index]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

app.delete("/api/performances/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const index = performances.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "실적을 찾을 수 없습니다." });
    performances.splice(index, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 실적 요약(통계) API (예시) ---
app.get("/api/performance-summaries", (req, res) => {
  try {
    res.json([
      {
        programId: "prog001",
        function: "서비스제공기능",
        unit: "교육문화 및 평생교육",
        name: "성인 줌바댄스",
        team: "서비스제공연계팀",
        registered: { male: 3, female: 5, total: 8 },
        actual: { male: 3, female: 4, total: 7 },
        totalVisits: { male: 7, female: 11, total: 18 },
        free: { male: 2, female: 3, total: 5 },
        paid: { male: 1, female: 1, total: 2 },
        sessions: 4,
        cases: 2,
        ageGroups: { "10대": 2, "20대": 1, "60대": 3, "70대 이상": 1 },
        protectionStatus: { "기초생활수급자": 2, "장애인": 1, "국가유공자": 1, "일반": 3 },
        date: "2025-07-01"
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 회원가입 API (이름, 이메일, 비밀번호) ---
app.post("/api/signup", (req, res) => {
  try {
    const { name, password, email } = req.body;
    if (!name || !password || !email) {
      return res.status(400).json({ error: "필수 입력값 누락" });
    }
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ error: "이미 등록된 이메일입니다." });
    }
    users.push({ name, password, email });
    res.json({ success: true, message: "회원가입 성공" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 로그인 API (이메일, 비밀번호) ---
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      res.json({ success: true, token: "fake-jwt-token", name: user.name });
    } else {
      res.status(401).json({ error: "이메일 또는 비밀번호 오류" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 회원정보 API (Express 임시, Firestore 사용 시 프론트에서 직접 호출 권장) ---
app.get("/api/members", (req, res) => {
  try {
    // 임시: users 배열 반환 (실전은 Firestore 연동)
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// --- 404 핸들러 ---
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(5184, () => {
  console.log("API 서버가 5184번 포트에서 실행중!");
});