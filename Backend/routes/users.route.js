import express from "express";
import { getProfile } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getProfile);

export default router;
