const express = require("express");
const router = express.Router();
const users = require("../usersStore");

router.get("/members", (req, res) => {
  res.json(users);
});

module.exports = router;
