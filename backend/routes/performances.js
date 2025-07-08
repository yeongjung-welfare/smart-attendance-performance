const express = require("express");
const router = express.Router();

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
  }
];

router.get("/", (req, res) => {
  res.json(performances);
});

router.post("/", (req, res) => {
  const data = req.body;
  if (!data.name || !data.function || !data.unit || !data.subProgram || !data.date) {
    return res.status(400).json({ error: "필수 입력값 누락" });
  }
  const newId = performances.length ? performances[performances.length - 1].id + 1 : 1;
  const newPerformance = { id: newId, ...data };
  performances.push(newPerformance);
  res.json(newPerformance);
});

router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = performances.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "실적을 찾을 수 없습니다." });
  performances[index] = { ...performances[index], ...req.body };
  res.json(performances[index]);
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = performances.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "실적을 찾을 수 없습니다." });
  performances.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;
