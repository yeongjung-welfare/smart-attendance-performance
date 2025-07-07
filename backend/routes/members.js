import express from "express";
const router = express.Router();

let users = [];

router.get("/members", (req, res) => {
  res.json(users);
});

export default router;
