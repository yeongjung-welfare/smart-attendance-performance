const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
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
});

module.exports = router;
