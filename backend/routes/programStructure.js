const express = require("express");
const router = express.Router();

let programStructure = {
  "서비스제공기능": {
    "교육문화 및 평생교육": ["성인 줌바댄스", "성인 요가", "어르신 스케치"]
  },
  "사례관리기능": {
    "사례관리": ["사례접수", "사례회의-참여자"],
  },
  "지역조직화기능": {
    "지역조직화": ["지역사회 네트워크", "자원봉사 모집", "자원봉사 활동"]
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