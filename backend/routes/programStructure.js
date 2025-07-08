// 📁 backend/routes/programStructure.js
const express = require("express");
const router = express.Router();

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

router.get("/", (req, res) => {
  res.json(programStructure);
});

router.post("/", (req, res) => {
  programStructure = req.body;
  res.json(programStructure);
});

router.put("/:key", (req, res) => {
  const key = req.params.key;
  if (!programStructure[key]) {
    return res.status(404).json({ error: "해당 사업구조 키가 없습니다." });
  }
  programStructure[key] = req.body;
  res.json(programStructure[key]);
});

router.delete("/:key", (req, res) => {
  const key = req.params.key;
  if (!programStructure[key]) {
    return res.status(404).json({ error: "해당 사업구조 키가 없습니다." });
  }
  delete programStructure[key];
  res.json({ success: true });
});

module.exports = router;