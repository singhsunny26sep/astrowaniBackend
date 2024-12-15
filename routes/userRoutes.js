// userRoutes.js
const express = require("express");
const router = express.Router();
const {
  requestOTP,
  register,
  login,
  verifyOTP,
  resendOTP,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  getAllUser,
  requestAstroOTP,
  registerAstrologer,
  updateAstrologerProfile,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

router.post("/sign-in", requestOTP);
router.post("/astro-sign-in", requestAstroOTP);
router.post("/register", register);
router.post("/register-astrologer", registerAstrologer);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);
router.get("/get-all-users", protect, getAllUser);
router.put("/profile", protect, updateProfile);
router.put("/update-astrologer-profile", protect, updateAstrologerProfile);
router.put("/update-password", protect, updatePassword);

module.exports = router;
