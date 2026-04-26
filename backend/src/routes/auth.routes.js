// src/routes/auth.routes.js
const router = require("express").Router();
const { register, login, verifyOtp, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/me", authenticate, getMe);
module.exports = router;
