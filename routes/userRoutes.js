import express from "express";
import { getUserProfile, updateUserLocation } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/me").get(protect, getUserProfile);
router.route("/location").patch(protect, updateUserLocation);

export default router;
